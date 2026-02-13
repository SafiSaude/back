import { LancamentoResponseDto } from './lancamento-response.dto';

export class PaginatedLancamentosResponseDto {
  data: LancamentoResponseDto[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
