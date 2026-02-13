import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantCNPJ } from './entities/tenant-cnpj.entity';
import { User } from '../users/entities/user.entity';
import { Lancamento } from '../lancamentos/entities/lancamento.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantCNPJ, User, Lancamento])],
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
