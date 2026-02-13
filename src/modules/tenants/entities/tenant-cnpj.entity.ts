import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Tenant } from './tenant.entity';

/**
 * Relacionamento entre Tenant e CNPJs
 * Um Tenant pode ter múltiplos CNPJs (ex: capital com recursos municipal + estadual)
 * Cada CNPJ é único no sistema (não pode estar vinculado a 2 Tenants diferentes)
 */
@Entity('tenant_cnpjs')
@Unique(['cnpj'])
export class TenantCNPJ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 18 })
  cnpj: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao: string; // Ex: "Municipal", "Estadual"

  @ManyToOne(() => Tenant, (tenant) => tenant.cnpjs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
