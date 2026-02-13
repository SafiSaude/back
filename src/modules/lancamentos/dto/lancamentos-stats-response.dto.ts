export class LancamentosStatsResponseDto {
  totalLancamentos: number;

  valorTotalBruto: number;

  valorTotalLiquido: number;

  periodoMaisRecente: {
    ano: number;
    mes: number;
  };

  anos: number[];

  tiposRepasse: Array<{
    tipo: string;
    total: number;
  }>;

  contasBancarias: Array<{
    banco: string;
    agencia: string;
    conta: string;
    total: number;
  }>;
}
