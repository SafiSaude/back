import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuthResponseDto, RefreshResponseDto, UserResponseDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly JWT_EXPIRATION_SECONDS = 3600; // 1 hora

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Autentica usuario com email e senha
   * @param email - Email do usuario
   * @param password - Senha em texto plano
   * @returns Token JWT e dados do usuario (sem passwordHash)
   * @throws UnauthorizedException se credenciais invalidas ou usuario inativo
   */
  async login(email: string, password: string): Promise<AuthResponseDto> {
    // Buscar usuario por email
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Verificar se usuario esta ativo
    if (!user.ativo) {
      throw new UnauthorizedException('Usuario inativo. Entre em contato com o administrador.');
    }

    // Validar senha com bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Atualizar timestamp de ultimo acesso
    user.ultimoAcesso = new Date();
    await this.usersRepository.save(user);

    // Gerar JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Preparar resposta sem passwordHash
    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      tenantId: user.tenantId,
      ativo: user.ativo,
    };

    return {
      accessToken,
      user: userResponse,
      expiresIn: this.JWT_EXPIRATION_SECONDS,
    };
  }

  /**
   * Gera novo token JWT para usuario autenticado
   * @param user - Dados do usuario do JWT payload
   * @returns Novo token JWT
   */
  async refreshToken(user: JwtPayload): Promise<RefreshResponseDto> {
    // Verificar se usuario ainda existe e esta ativo
    const dbUser = await this.usersRepository.findOne({
      where: { id: user.sub },
    });

    if (!dbUser) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    if (!dbUser.ativo) {
      throw new UnauthorizedException('Usuario inativo');
    }

    // Gerar novo token com mesmo payload
    const payload: JwtPayload = {
      sub: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      tenantId: dbUser.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: this.JWT_EXPIRATION_SECONDS,
    };
  }

  /**
   * Valida se usuario existe e esta ativo (para uso interno)
   * @param userId - ID do usuario
   * @returns Usuario sem passwordHash ou null
   */
  async validateUser(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, ativo: true },
    });

    if (!user) {
      return null;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
