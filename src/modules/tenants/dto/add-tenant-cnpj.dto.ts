import { IsString, Matches, IsOptional } from 'class-validator';

export class AddTenantCnpjDto {
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj: string;

  @IsOptional()
  @IsString()
  descricao?: string; // Ex: "Estadual", "Municipal"
}
