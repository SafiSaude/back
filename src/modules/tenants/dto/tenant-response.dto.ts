export interface TenantCnpjDto {
  id: string;
  cnpj: string;
  descricao?: string;
  criadoEm: Date;
}

export class TenantResponseDto {
  id: string;
  nome: string;
  cnpj: string;
  emailContato: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  criadoPor?: string;
  atualizadoPor?: string;
  cnpjs?: TenantCnpjDto[]; // Additional CNPJs for state capitals
}
