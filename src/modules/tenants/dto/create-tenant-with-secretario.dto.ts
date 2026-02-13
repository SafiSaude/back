import { IsString, IsEmail, IsOptional, MinLength, Matches, IsBoolean } from 'class-validator';

export class CreateSecretarioDto {
  @IsString()
  @MinLength(3)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Senha deve ter no mínimo 8 caracteres',
  })
  senha: string;
}

export class CreateTenantWithSecretarioDto {
  @IsString()
  @MinLength(3)
  nome: string;

  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj: string;

  @IsEmail()
  emailContato: string;

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
  cnpjEstadual?: string; // For state capital municipalities

  @IsOptional()
  secretario?: CreateSecretarioDto;
}
