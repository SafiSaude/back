export class LancamentoResponseDto {
  id: string;

  tenantId: string | null;

  cnpj: string;

  // Processo e Portaria
  nuProcesso?: string;

  nuPortaria?: string;

  dtPortaria?: Date;

  // Período
  ano: number;

  mes: number;

  nuCompetencia?: string;

  diaPagamento?: number;

  // Tipo e Repasse
  tpRepasse: string;

  nuOb?: string;

  coTipoRecurso?: string;

  tpRecursoProp?: string;

  recursoCOVIDOUNormal?: string;

  // Localização
  uf: string;

  coMunicipioIbge: string;

  municipio: string;

  // Entidade
  entidade?: string;

  // Classificação e Programa
  bloco?: string;

  componente?: string;

  programa?: string;

  nuProposta?: string;

  // Dados Bancários
  banco?: string;

  agencia?: string;

  conta?: string;

  // Valores Financeiros
  valorBruto: number;

  desconto: number;

  valorLiquido: number;

  // Saldo da Conta
  dtSaldoConta?: Date;

  vlSaldoConta?: number;

  // Marcadores
  marcadorEmendaCOVID?: string;

  // Auditoria
  criadoEm: Date;

  criadoPor?: string;

  atualizadoEm: Date;

  atualizadoPor?: string;
}
