import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TenantCNPJ } from './tenant-cnpj.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 18, unique: true })
  cnpj: string;

  @Column({ type: 'varchar', length: 255, name: 'email_contato' })
  emailContato: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cidade: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  estado: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  @Column({ type: 'uuid', nullable: true, name: 'criado_por' })
  criadoPor: string;

  @Column({ type: 'uuid', nullable: true, name: 'atualizado_por' })
  atualizadoPor: string;

  // Relationship: One tenant has many users
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  // Relationship: One tenant has many CNPJs (for multi-sphere municipalities like state capitals)
  @OneToMany(() => TenantCNPJ, (tenantCnpj) => tenantCnpj.tenant, {
    cascade: true,
    eager: true,
  })
  cnpjs: TenantCNPJ[];
}
