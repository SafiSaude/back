import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  LoginDto,
  AuthResponseDto,
  RefreshResponseDto,
  LogoutResponseDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Autentica usuario com email e senha
   * Retorna JWT token e dados do usuario
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * POST /api/auth/refresh
   * Gera novo JWT token para usuario autenticado
   * Requer token valido no header Authorization
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: any): Promise<RefreshResponseDto> {
    // req.user vem do JwtStrategy.validate()
    // Contém: { id: sub, email, role }
    const userPayload = {
      sub: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
    return this.authService.refreshToken(userPayload);
  }

  /**
   * POST /api/auth/logout
   * Endpoint para logout (limpa sessao no frontend)
   * Nao requer autenticacao pois o frontend pode ter token expirado
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<LogoutResponseDto> {
    // JWT eh stateless, logout eh feito no frontend removendo o token
    // Este endpoint existe para manter consistencia da API
    return { message: 'Logout successful' };
  }
}
