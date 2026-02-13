import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LancamentosFilterDto {
  @IsOptional()
  @IsInt()
  @Min(1999)
  @Max(2050)
  @Type(() => Number)
  ano?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  mes?: number;

  @IsOptional()
  @IsString()
  tpRepasse?: string;

  @IsOptional()
  @IsString()
  banco?: string;

  @IsOptional()
  @IsString()
  agencia?: string;

  @IsOptional()
  @IsString()
  conta?: string;

  @IsOptional()
  @IsString()
  search?: string; // Busca em municipio, entidade

  @IsOptional()
  @IsString()
  cnpj?: string; // Busca exata por CNPJ (14 dígitos)

  @IsOptional()
  @IsString()
  municipio?: string; // Busca parcial em município

  @IsOptional()
  @IsString()
  @Length(2, 2)
  uf?: string; // Busca exata por UF (2 caracteres)

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @IsOptional()
  @IsString()
  sortBy: string = 'ano';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}
