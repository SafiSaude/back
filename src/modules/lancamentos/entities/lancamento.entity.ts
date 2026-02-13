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

@Entity('lancamentos')
export class Lancamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string | null;

  @Column({ type: 'varchar', length: 14 })
  cnpj: string;

  // Processo e Portaria
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'nu_processo' })
  nuProcesso: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'nu_portaria' })
  nuPortaria: string | null;

  @Column({ type: 'date', nullable: true, name: 'dt_portaria' })
  dtPortaria: Date | null;

  // Período (OBRIGATÓRIOS)
  @Column({ type: 'int' })
  ano: number;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'nu_competencia' })
  nuCompetencia: string | null;

  @Column({ type: 'int', nullable: true, name: 'dia_pagamento' })
  diaPagamento: number | null;

  // Tipo e Repasse
  @Column({ type: 'varchar', length: 100, name: 'tp_repasse' })
  tpRepasse: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'nu_ob' })
  nuOb: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'co_tipo_recurso' })
  coTipoRecurso: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tp_recurso_prop' })
  tpRecursoProp: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'recurso_covid_ou_normal' })
  recursoCOVIDOUNormal: string | null;

  // Localização (OBRIGATÓRIOS)
  @Column({ type: 'varchar', length: 2 })
  uf: string;

  @Column({ type: 'varchar', length: 10, name: 'co_municipio_ibge' })
  coMunicipioIbge: string;

  @Column({ type: 'varchar', length: 150 })
  municipio: string;

  // Entidade
  @Column({ type: 'varchar', length: 255, nullable: true })
  entidade: string | null;

  // Classificação e Programa
  @Column({ type: 'varchar', length: 100, nullable: true })
  bloco: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  componente: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  programa: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'nu_proposta' })
  nuProposta: string | null;

  // Dados Bancários
  @Column({ type: 'varchar', length: 100, nullable: true })
  banco: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  agencia: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  conta: string | null;

  // Valores Financeiros (OBRIGATÓRIOS)
  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'valor_bruto' })
  valorBruto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  desconto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'valor_liquido' })
  valorLiquido: number;

  // Saldo da Conta
  @Column({ type: 'date', nullable: true, name: 'dt_saldo_conta' })
  dtSaldoConta: Date | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'vl_saldo_conta' })
  vlSaldoConta: number | null;

  // Marcadores
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'marcador_emenda_covid' })
  marcadorEmendaCOVID: string | null;

  // Auditoria
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @Column({ type: 'uuid', nullable: true, name: 'criado_por' })
  criadoPor: string | null;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  @Column({ type: 'uuid', nullable: true, name: 'atualizado_por' })
  atualizadoPor: string | null;

  // Relação com Tenant
  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;
}
