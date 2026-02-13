import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantCNPJ } from './entities/tenant-cnpj.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Lancamento } from '../lancamentos/entities/lancamento.entity';
import { CreateTenantWithSecretarioDto, UpdateTenantDto, TenantResponseDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantCNPJ)
    private readonly tenantCnpjRepository: Repository<TenantCNPJ>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lancamento)
    private readonly lancamentoRepository: Repository<Lancamento>,
  ) {}

  /**
   * Create a new tenant with its first secretario in a transaction
   * Only SUPER_ADMIN can create tenants
   */
  async createWithSecretario(
    dto: CreateTenantWithSecretarioDto,
    createdBy: string,
  ): Promise<{ tenant: TenantResponseDto; secretario: any }> {
    // Validate creator is SUPER_ADMIN (done via decorator in controller)

    // Check CNPJ is unique
    const existingTenant = await this.tenantRepository.findOne({
      where: { cnpj: dto.cnpj },
    });

    if (existingTenant) {
      throw new BadRequestException('CNPJ já existe no sistema');
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      nome: dto.nome,
      cnpj: dto.cnpj,
      emailContato: dto.emailContato,
      cidade: dto.cidade,
      estado: dto.estado,
      ativo: true,
      criadoPor: createdBy,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Associate orphaned lancamentos with this new tenant
    // This ensures that when a new tenant is created, all lancamentos
    // with a matching CNPJ are automatically linked to the tenant
    await this.lancamentoRepository.update(
      {
        cnpj: dto.cnpj,
        tenantId: null,
      },
      {
        tenantId: savedTenant.id,
      },
    );

    // If there's an additional CNPJ (for state capitals), create a TenantCNPJ record
    if (dto.cnpjEstadual) {
      const tenantCnpj = this.tenantCnpjRepository.create({
        cnpj: dto.cnpjEstadual,
        descricao: 'Estadual',
        tenantId: savedTenant.id,
        tenant: savedTenant,
      });
      await this.tenantCnpjRepository.save(tenantCnpj);

      // Also sync lancamentos for the secondary CNPJ
      await this.lancamentoRepository.update(
        {
          cnpj: dto.cnpjEstadual,
          tenantId: null,
        },
        {
          tenantId: savedTenant.id,
        },
      );
    }

    let secretario = null;

    // Create secretario if provided
    if (dto.secretario) {
      // Check if secretario email is unique
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.secretario.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email do secretário já existe no sistema');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(dto.secretario.senha, 10);

      // Create secretario
      const secretarioUser = this.userRepository.create({
        email: dto.secretario.email,
        nome: dto.secretario.nome,
        passwordHash,
        role: UserRole.SECRETARIO,
        tenantId: savedTenant.id,
        ativo: true,
        atualizadoPor: createdBy,
      });

      secretario = await this.userRepository.save(secretarioUser);
      // Remove password hash from response
      secretario = {
        id: secretario.id,
        email: secretario.email,
        nome: secretario.nome,
        role: secretario.role,
        tenantId: secretario.tenantId,
      };
    }

    return {
      tenant: this.mapToResponseDto(savedTenant),
      secretario,
    };
  }

  /**
   * Find all tenants (SUPER_ADMIN only)
   */
  async findAll(): Promise<TenantResponseDto[]> {
    const tenants = await this.tenantRepository.find({
      relations: ['cnpjs'],
      order: { criadoEm: 'DESC' },
    });
    return tenants.map((t) => this.mapToResponseDto(t));
  }

  /**
   * Find a single tenant by ID
   */
  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['cnpjs'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} não encontrado`);
    }

    return this.mapToResponseDto(tenant);
  }

  /**
   * Update tenant data
   * Only SUPER_ADMIN can update tenants
   * If CNPJ is updated, automatically sync lancamentos
   */
  async update(
    id: string,
    dto: UpdateTenantDto,
    updatedBy: string,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['cnpjs'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} não encontrado`);
    }

    let cnpjChanged = false;

    // Check CNPJ uniqueness if changed
    if (dto.cnpj && dto.cnpj !== tenant.cnpj) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { cnpj: dto.cnpj },
      });
      if (existingTenant) {
        throw new BadRequestException('CNPJ já existe no sistema');
      }
      cnpjChanged = true;
    }

    // Update allowed fields
    if (dto.nome) tenant.nome = dto.nome;
    if (dto.cnpj) tenant.cnpj = dto.cnpj;
    if (dto.emailContato) tenant.emailContato = dto.emailContato;
    if (dto.cidade) tenant.cidade = dto.cidade;
    if (dto.estado) tenant.estado = dto.estado;
    if (dto.ativo !== undefined) tenant.ativo = dto.ativo;

    tenant.atualizadoPor = updatedBy;

    const updated = await this.tenantRepository.save(tenant);

    // If CNPJ was changed, sync lancamentos with new CNPJ
    if (cnpjChanged) {
      // Associate lancamentos with the new CNPJ to this tenant
      await this.lancamentoRepository.update(
        {
          cnpj: dto.cnpj,
          tenantId: null,
        },
        {
          tenantId: updated.id,
        },
      );
    }

    // Handle additional CNPJ for state capitals
    if (dto.cnpjEstadual) {
      // Check if this CNPJ already exists in the system
      const existingCnpj = await this.tenantCnpjRepository.findOne({
        where: { cnpj: dto.cnpjEstadual },
      });

      if (existingCnpj && existingCnpj.tenantId !== updated.id) {
        throw new BadRequestException(
          'Este CNPJ Estadual já está vinculado a outro tenant',
        );
      }

      // If CNPJ doesn't exist yet, create it
      if (!existingCnpj) {
        const tenantCnpj = this.tenantCnpjRepository.create({
          cnpj: dto.cnpjEstadual,
          descricao: 'Estadual',
          tenantId: updated.id,
          tenant: updated,
        });
        await this.tenantCnpjRepository.save(tenantCnpj);

        // Sync lancamentos for the new CNPJ
        await this.lancamentoRepository.update(
          {
            cnpj: dto.cnpjEstadual,
            tenantId: null,
          },
          {
            tenantId: updated.id,
          },
        );
      }
    }

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete a tenant (cascade delete users)
   * Only SUPER_ADMIN can delete tenants
   * ⚠️  This will delete all users in the tenant
   */
  async delete(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} não encontrado`);
    }

    // Log deletion for audit trail
    // TODO: Implement audit log

    // Delete all users in this tenant (cascade)
    await this.userRepository.delete({ tenantId: id });

    // Delete tenant
    await this.tenantRepository.remove(tenant);
  }

  /**
   * Add an additional CNPJ to an existing tenant
   * Useful for state capital municipalities that have multiple CNPJs
   */
  async addCnpj(id: string, cnpj: string, descricao?: string): Promise<TenantCNPJ> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} não encontrado`);
    }

    // Check if CNPJ already exists
    const existingCnpj = await this.tenantCnpjRepository.findOne({
      where: { cnpj },
    });

    if (existingCnpj) {
      throw new BadRequestException('Este CNPJ já está vinculado a outro tenant');
    }

    // Create the tenant CNPJ record
    const tenantCnpj = this.tenantCnpjRepository.create({
      cnpj,
      descricao: descricao || 'Adicional',
      tenantId: id,
      tenant,
    });

    const savedCnpj = await this.tenantCnpjRepository.save(tenantCnpj);

    // Sync lancamentos for this CNPJ
    await this.lancamentoRepository.update(
      {
        cnpj,
        tenantId: null,
      },
      {
        tenantId: id,
      },
    );

    return savedCnpj;
  }

  /**
   * Manually sync lancamentos for a tenant by all its CNPJs
   * This is useful when lancamentos were imported without proper tenant assignment
   * @param id - Tenant ID
   * @returns Object with sync result
   */
  async syncLancamentos(id: string): Promise<{ synced: number; message: string }> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['cnpjs'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} não encontrado`);
    }

    let totalSynced = 0;

    // Sync main CNPJ
    const mainResult = await this.lancamentoRepository.update(
      {
        cnpj: tenant.cnpj,
        tenantId: null,
      },
      {
        tenantId: tenant.id,
      },
    );
    totalSynced += mainResult.affected || 0;

    // Sync additional CNPJs
    if (tenant.cnpjs && tenant.cnpjs.length > 0) {
      for (const tenantCnpj of tenant.cnpjs) {
        const result = await this.lancamentoRepository.update(
          {
            cnpj: tenantCnpj.cnpj,
            tenantId: null,
          },
          {
            tenantId: tenant.id,
          },
        );
        totalSynced += result.affected || 0;
      }
    }

    return {
      synced: totalSynced,
      message: `${totalSynced} lançamento(s) sincronizado(s) com o tenant ${tenant.nome}`,
    };
  }

  /**
   * Helper to map tenant entity to response DTO
   */
  private mapToResponseDto(tenant: Tenant): TenantResponseDto {
    const dto: TenantResponseDto = {
      id: tenant.id,
      nome: tenant.nome,
      cnpj: tenant.cnpj,
      emailContato: tenant.emailContato,
      cidade: tenant.cidade,
      estado: tenant.estado,
      ativo: tenant.ativo,
      criadoEm: tenant.criadoEm,
      atualizadoEm: tenant.atualizadoEm,
      criadoPor: tenant.criadoPor,
      atualizadoPor: tenant.atualizadoPor,
    };

    // Include additional CNPJs if they exist
    if (tenant.cnpjs && tenant.cnpjs.length > 0) {
      dto.cnpjs = tenant.cnpjs.map((cnpj) => ({
        id: cnpj.id,
        cnpj: cnpj.cnpj,
        descricao: cnpj.descricao,
        criadoEm: cnpj.criadoEm,
      }));
    }

    return dto;
  }
}
