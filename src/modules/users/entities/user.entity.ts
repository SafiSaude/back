import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPORTE_ADMIN = 'SUPORTE_ADMIN',
  FINANCEIRO_ADMIN = 'FINANCEIRO_ADMIN',
  SECRETARIO = 'SECRETARIO',
  FINANCEIRO = 'FINANCEIRO',
  VISUALIZADOR = 'VISUALIZADOR',
}

export const UserRoleRank: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.SUPORTE_ADMIN]: 4,
  [UserRole.FINANCEIRO_ADMIN]: 3,
  [UserRole.SECRETARIO]: 2,
  [UserRole.FINANCEIRO]: 1,
  [UserRole.VISUALIZADOR]: 0,
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VISUALIZADOR })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string | null;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  @Column({ type: 'uuid', nullable: true, name: 'atualizado_por' })
  atualizadoPor: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'ultimo_acesso' })
  ultimoAcesso: Date;
}
