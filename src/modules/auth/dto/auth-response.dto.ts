import { UserRole } from '../../users/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  tenantId?: string | null;
  ativo: boolean;
}

export class AuthResponseDto {
  accessToken: string;
  user: UserResponseDto;
  expiresIn: number;
}

export class RefreshResponseDto {
  accessToken: string;
  expiresIn: number;
}

export class LogoutResponseDto {
  message: string;
}
