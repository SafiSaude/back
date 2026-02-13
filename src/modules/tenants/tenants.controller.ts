import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantsService } from './tenants.service';
import { CreateTenantWithSecretarioDto, UpdateTenantDto, TenantResponseDto } from './dto';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * POST /tenants
   * Create a new tenant with its first secretario
   * Only SUPER_ADMIN can access
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTenantDto: CreateTenantWithSecretarioDto,
    @Request() req: any,
  ) {
    const user: User = req.user;

    // Validate SUPER_ADMIN
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only SUPER_ADMIN can create tenants');
    }

    return this.tenantsService.createWithSecretario(createTenantDto, user.id);
  }

  /**
   * GET /tenants
   * Get all tenants
   * Only SUPER_ADMIN can access
   */
  @Get()
  async findAll(@Request() req: any): Promise<TenantResponseDto[]> {
    const user: User = req.user;

    // Validate SUPER_ADMIN
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only SUPER_ADMIN can view all tenants');
    }

    return this.tenantsService.findAll();
  }

  /**
   * GET /tenants/:id
   * Get a single tenant by ID
   * SUPER_ADMIN can access any tenant
   * SECRETARIO can access only their own tenant
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<TenantResponseDto> {
    const user: User = req.user;

    // Validate access
    if (user.role === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN can access any tenant
      return this.tenantsService.findOne(id);
    } else if (user.role === UserRole.SECRETARIO && user.tenantId === id) {
      // SECRETARIO can access only their own tenant
      return this.tenantsService.findOne(id);
    } else {
      throw new Error('You do not have access to this tenant');
    }
  }

  /**
   * PUT /tenants/:id
   * Update a tenant
   * Only SUPER_ADMIN can access
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Request() req: any,
  ): Promise<TenantResponseDto> {
    const user: User = req.user;

    // Validate SUPER_ADMIN
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only SUPER_ADMIN can update tenants');
    }

    return this.tenantsService.update(id, updateTenantDto, user.id);
  }

  /**
   * POST /tenants/:id/cnpjs
   * Add an additional CNPJ to a tenant
   * Only SUPER_ADMIN can access
   * Useful for state capital municipalities
   */
  @Post(':id/cnpjs')
  async addCnpj(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req: any,
  ): Promise<any> {
    const user: User = req.user;

    // Validate SUPER_ADMIN
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only SUPER_ADMIN can add CNPJs');
    }

    return this.tenantsService.addCnpj(id, dto.cnpj, dto.descricao);
  }

  /**
   * POST /tenants/:id/sync-lancamentos
   * Manually sync lancamentos for a tenant
   * Only SUPER_ADMIN can access
   * Useful when lancamentos were imported without proper tenant assignment
   */
  @Post(':id/sync-lancamentos')
  async syncLancamentos(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ synced: number; message: string }> {
    const user: User = req.user;

    // Validate SUPER_ADMIN
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only SUPER_ADMIN can sync lancamentos');
    }

    return this.tenantsService.syncLancamentos(id);
  }

  /**
   * DELETE /tenants/:id
   * Delete a tenant (cascade deletes all users)
   * Only SUPER_ADMIN can access
   * ⚠️  This action cannot be undone!
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    const user: User = req.user;

    // Validate SUPER_ADMIN
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only SUPER_ADMIN can delete tenants');
    }

    return this.tenantsService.delete(id);
  }
}
