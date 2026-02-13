import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './modules/users/entities/user.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  getWelcome() {
    return {
      message: 'Bem-vindo ao SAFISAUDE API',
      version: '1.0.0',
      status: 'online',
    };
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  async seedSuperAdmin() {
    const superAdminEmail = 'felipealfah@gmail.com';
    const superAdminPassword = 'F3l1p301!';

    // Verificar se já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: superAdminEmail },
    });

    if (existingUser) {
      // Se existe, atualizar a senha para garantir que está correta
      const passwordHash = await bcrypt.hash(superAdminPassword, 10);
      existingUser.passwordHash = passwordHash;
      await this.usersRepository.save(existingUser);

      return {
        message: 'Super Admin existe - senha atualizada',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
        },
      };
    }

    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);

    // Criar usuário
    const user = this.usersRepository.create({
      email: superAdminEmail,
      nome: 'Super Admin',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      ativo: true,
    });

    const savedUser = await this.usersRepository.save(user);

    return {
      message: 'Super Admin criado com sucesso',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        nome: savedUser.nome,
        role: savedUser.role,
        ativo: savedUser.ativo,
      },
      credentials: {
        email: superAdminEmail,
        password: superAdminPassword,
      },
    };
  }
}
