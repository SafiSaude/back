import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../../guards/role.guard';
import { RequireRole } from '../../decorators/require-role.decorator';
import { UserRole } from '../users/entities/user.entity';
import { LancamentosService } from './lancamentos.service';
import {
  LancamentosFilterDto,
  LancamentoResponseDto,
  LancamentosStatsResponseDto,
  PaginatedLancamentosResponseDto,
} from './dto';

@Controller('lancamentos')
@UseGuards(JwtAuthGuard, RoleGuard)
export class LancamentosController {
  constructor(private lancamentosService: LancamentosService) {}

  @Get('stats')
  @RequireRole(
    UserRole.SUPER_ADMIN,
    UserRole.SUPORTE_ADMIN,
    UserRole.FINANCEIRO_ADMIN,
    UserRole.SECRETARIO,
    UserRole.FINANCEIRO,
    UserRole.VISUALIZADOR,
  )
  async getStats(
    @Query() filters: LancamentosFilterDto,
    @Request() req: any,
  ): Promise<LancamentosStatsResponseDto> {
    return this.lancamentosService.getStats(filters, req.user);
  }

  @Get()
  @RequireRole(
    UserRole.SUPER_ADMIN,
    UserRole.SUPORTE_ADMIN,
    UserRole.FINANCEIRO_ADMIN,
    UserRole.SECRETARIO,
    UserRole.FINANCEIRO,
    UserRole.VISUALIZADOR,
  )
  async findAll(
    @Query() filters: LancamentosFilterDto,
    @Request() req: any,
  ): Promise<PaginatedLancamentosResponseDto> {
    return this.lancamentosService.findAll(filters, req.user);
  }

  @Get(':id')
  @RequireRole(
    UserRole.SUPER_ADMIN,
    UserRole.SUPORTE_ADMIN,
    UserRole.FINANCEIRO_ADMIN,
    UserRole.SECRETARIO,
    UserRole.FINANCEIRO,
    UserRole.VISUALIZADOR,
  )
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<LancamentoResponseDto> {
    return this.lancamentosService.findOne(id, req.user);
  }
}
