import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { RequireRole } from '../../decorators/require-role.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User, UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @RequireRole(UserRole.SUPER_ADMIN, UserRole.SECRETARIO)
  async create(
    @Body() dto: CreateUserDto,
    @Request() req: any,
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.usersService.create(dto, req.user.id);
  }

  @Get()
  @RequireRole(UserRole.SUPER_ADMIN, UserRole.SUPORTE_ADMIN, UserRole.SECRETARIO)
  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequireRole(
    UserRole.SUPER_ADMIN,
    UserRole.SUPORTE_ADMIN,
    UserRole.SECRETARIO,
    UserRole.FINANCEIRO,
    UserRole.VISUALIZADOR,
  )
  async findOne(@Param('id') id: string): Promise<Omit<User, 'passwordHash'>> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequireRole(UserRole.SUPER_ADMIN, UserRole.SECRETARIO)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.usersService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @RequireRole(UserRole.SUPER_ADMIN, UserRole.SECRETARIO)
  async delete(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.usersService.delete(id, req.user.id);
    return { message: 'Usuário deletado com sucesso' };
  }
}
