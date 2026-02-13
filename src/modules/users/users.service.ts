import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // ================================================================
  // VALIDAÇÕES DE NEGÓCIO (Multi-Tenant)
  // ================================================================

  private validateCanCreateRole(
    creatorRole: UserRole,
    creatorTenantId: string | null,
    targetRole: UserRole,
    targetTenantId: string | null,
  ): void {
    // SUPER_ADMIN can create SUPER_ADMIN, SUPORTE_ADMIN, FINANCEIRO_ADMIN, or SECRETARIO
    if (creatorRole === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN, SUPORTE_ADMIN, or FINANCEIRO_ADMIN must have no tenant
      if ([UserRole.SUPER_ADMIN, UserRole.SUPORTE_ADMIN, UserRole.FINANCEIRO_ADMIN].includes(targetRole)) {
        if (targetTenantId !== null) {
          throw new ForbiddenException(
            `${targetRole} não pode ter um tenant associado`,
          );
        }
        return;
      }
      // SECRETARIO must have a tenant
      if (targetRole === UserRole.SECRETARIO) {
        if (targetTenantId === null) {
          throw new ForbiddenException('SECRETARIO deve ter um tenant');
        }
        return;
      }
      throw new ForbiddenException(
        `SUPER_ADMIN não pode criar ${targetRole}`,
      );
    }

    // SECRETARIO can create FINANCEIRO or VISUALIZADOR in their own tenant
    if (creatorRole === UserRole.SECRETARIO) {
      if (!targetRole || ![UserRole.FINANCEIRO, UserRole.VISUALIZADOR].includes(targetRole)) {
        throw new ForbiddenException(
          `SECRETARIO só pode criar FINANCEIRO ou VISUALIZADOR, não ${targetRole}`,
        );
      }
      if (targetTenantId !== creatorTenantId) {
        throw new ForbiddenException(
          'SECRETARIO só pode criar usuários do próprio tenant',
        );
      }
      return;
    }

    // FINANCEIRO, VISUALIZADOR, and FINANCEIRO_ADMIN cannot create users
    throw new ForbiddenException(
      `${creatorRole} não pode criar usuários`,
    );
  }

  private validateCanUpdateRole(
    updaterId: string,
    updaterRole: UserRole,
    updaterTenantId: string | null,
    targetId: string,
    targetRole: UserRole,
    targetTenantId: string | null,
    newRole?: UserRole,
  ): void {
    // SUPER_ADMIN can update anyone (except cannot remove own SUPER_ADMIN role)
    if (updaterRole === UserRole.SUPER_ADMIN) {
      if (updaterId === targetId && newRole && newRole !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'SUPER_ADMIN não pode remover seu próprio role',
        );
      }
      return;
    }

    // SECRETARIO can update FINANCEIRO/VISUALIZADOR in their own tenant
    if (updaterRole === UserRole.SECRETARIO) {
      if (![UserRole.FINANCEIRO, UserRole.VISUALIZADOR].includes(targetRole)) {
        throw new ForbiddenException(
          'SECRETARIO só pode editar FINANCEIRO ou VISUALIZADOR',
        );
      }
      if (targetTenantId !== updaterTenantId) {
        throw new ForbiddenException(
          'SECRETARIO só pode editar usuários do próprio tenant',
        );
      }
      // Cannot change target's role
      if (newRole && newRole !== targetRole) {
        throw new ForbiddenException(
          'SECRETARIO não pode alterar role de usuários',
        );
      }
      return;
    }

    // FINANCEIRO/VISUALIZADOR can only update themselves
    if ([UserRole.FINANCEIRO, UserRole.VISUALIZADOR].includes(updaterRole)) {
      if (updaterId !== targetId) {
        throw new ForbiddenException(
          'Você só pode atualizar sua própria conta',
        );
      }
      // Cannot change own role
      if (newRole && newRole !== updaterRole) {
        throw new ForbiddenException(
          'Você não pode alterar seu próprio role',
        );
      }
      return;
    }

    throw new ForbiddenException(`${updaterRole} não tem permissão para editar usuários`);
  }

  private validateCanDeleteUser(
    deleterRole: UserRole,
    deleterTenantId: string | null,
    targetRole: UserRole,
    targetTenantId: string | null,
  ): void {
    // SUPER_ADMIN can delete anyone (except protected checks below)
    if (deleterRole === UserRole.SUPER_ADMIN) {
      return;
    }

    // SECRETARIO can delete FINANCEIRO/VISUALIZADOR in their own tenant
    if (deleterRole === UserRole.SECRETARIO) {
      if (![UserRole.FINANCEIRO, UserRole.VISUALIZADOR].includes(targetRole)) {
        throw new ForbiddenException(
          'SECRETARIO só pode deletar FINANCEIRO ou VISUALIZADOR',
        );
      }
      if (targetTenantId !== deleterTenantId) {
        throw new ForbiddenException(
          'SECRETARIO só pode deletar usuários do próprio tenant',
        );
      }
      return;
    }

    // FINANCEIRO and VISUALIZADOR cannot delete anyone
    throw new ForbiddenException(
      `${deleterRole} não tem permissão para deletar usuários`,
    );
  }

  // ================================================================
  // CRUD METHODS
  // ================================================================

  async create(dto: CreateUserDto, createdBy: string): Promise<Omit<User, 'passwordHash'>> {
    const creator = await this.usersRepository.findOne({
      where: { id: createdBy },
    });
    if (!creator) {
      throw new BadRequestException('Creator user not found');
    }

    this.validateCanCreateRole(
      creator.role,
      creator.tenantId,
      dto.role,
      dto.tenantId,
    );

    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      email: dto.email,
      nome: dto.nome,
      passwordHash,
      role: dto.role,
      tenantId: dto.tenantId || null,
      atualizadoPor: createdBy,
    });

    const savedUser = await this.usersRepository.save(user);
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.usersRepository.find();
    return users.map(({ passwordHash: _, ...user }) => user);
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    updatedBy: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const targetUser = await this.usersRepository.findOne({ where: { id } });
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatingUser = await this.usersRepository.findOne({
      where: { id: updatedBy },
    });
    if (!updatingUser) {
      throw new BadRequestException('Updating user not found');
    }

    if (dto.role) {
      this.validateCanUpdateRole(
        updatingUser.id,
        updatingUser.role,
        updatingUser.tenantId,
        targetUser.id,
        targetUser.role,
        targetUser.tenantId,
        dto.role,
      );
    } else {
      // Even if not changing role, validate update permission
      this.validateCanUpdateRole(
        updatingUser.id,
        updatingUser.role,
        updatingUser.tenantId,
        targetUser.id,
        targetUser.role,
        targetUser.tenantId,
      );
    }

    // Apply updates to target user
    Object.assign(targetUser, dto, { atualizadoPor: updatedBy });

    // If role is being changed to a platform-level role, clear tenant_id
    if (dto.role && [UserRole.SUPER_ADMIN, UserRole.SUPORTE_ADMIN, UserRole.FINANCEIRO_ADMIN].includes(dto.role)) {
      targetUser.tenantId = null;
    }

    const savedUser = await this.usersRepository.save(targetUser);
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    const targetUser = await this.usersRepository.findOne({ where: { id } });
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const deletingUser = await this.usersRepository.findOne({
      where: { id: deletedBy },
    });
    if (!deletingUser) {
      throw new BadRequestException('Deleting user not found');
    }

    // CRÍTICO: Nunca deletar Super Admin
    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN não pode ser deletado');
    }

    // CRÍTICO: Nunca deletar a si mesmo
    if (targetUser.id === deletingUser.id) {
      throw new ForbiddenException('Você não pode deletar sua própria conta');
    }

    // CRÍTICO: Nunca deletar um SECRETARIO
    if (targetUser.role === UserRole.SECRETARIO) {
      throw new ForbiddenException('SECRETARIO não pode ser deletado');
    }

    // CRÍTICO: Nunca deletar um FINANCEIRO_ADMIN
    if (targetUser.role === UserRole.FINANCEIRO_ADMIN) {
      throw new ForbiddenException('FINANCEIRO_ADMIN não pode ser deletado');
    }

    // CRÍTICO: Nunca deletar um SUPORTE_ADMIN
    if (targetUser.role === UserRole.SUPORTE_ADMIN) {
      throw new ForbiddenException('SUPORTE_ADMIN não pode ser deletado');
    }

    // Validar permissão por role
    this.validateCanDeleteUser(
      deletingUser.role,
      deletingUser.tenantId,
      targetUser.role,
      targetUser.tenantId,
    );

    await this.usersRepository.remove(targetUser);
  }
}
