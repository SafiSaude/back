import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lancamento } from './entities/lancamento.entity';
import { LancamentosService } from './lancamentos.service';
import { LancamentosController } from './lancamentos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lancamento])],
  controllers: [LancamentosController],
  providers: [LancamentosService],
  exports: [LancamentosService],
})
export class LancamentosModule {}
