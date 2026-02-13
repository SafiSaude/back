import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../modules/users/entities/user.entity';

export const RequireRole = (...roles: UserRole[]) =>
  SetMetadata('roles', roles);
