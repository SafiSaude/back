import { IsString, IsEmail, IsOptional, MinLength, Matches, IsBoolean } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nome?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj?: string;

  @IsOptional()
  @IsEmail()
  emailContato?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, {
    message: 'Estado deve ser uma sigla de 2 letras maiúsculas',
  })
  estado?: string;

  @IsOptional()
  @IsBoolean()
  isCapital?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ Estadual deve estar no formato 00.000.000/0000-00',
  })
  cnpjEstadual?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
