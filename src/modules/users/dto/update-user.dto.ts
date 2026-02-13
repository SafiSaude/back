import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  nome?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
