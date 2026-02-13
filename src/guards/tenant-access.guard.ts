import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../modules/users/entities/user.entity';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Get tenant ID from request params
    const tenantId = request.params.tenantId || request.body?.tenantId;

    // SUPER_ADMIN has access to all tenants
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // SECRETARIO can only access their own tenant
    if (user.role === UserRole.SECRETARIO) {
      if (user.tenantId === tenantId) {
        return true;
      }
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // FINANCEIRO and VISUALIZADOR can only access their own tenant
    if ([UserRole.FINANCEIRO, UserRole.VISUALIZADOR].includes(user.role)) {
      if (user.tenantId === tenantId) {
        return true;
      }
      throw new ForbiddenException('You do not have access to this tenant');
    }

    throw new ForbiddenException('Invalid user role');
  }
}
