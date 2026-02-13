import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lancamento } from './entities/lancamento.entity';
import {
  LancamentosFilterDto,
  LancamentoResponseDto,
  LancamentosStatsResponseDto,
  PaginatedLancamentosResponseDto,
} from './dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class LancamentosService {
  constructor(
    @InjectRepository(Lancamento)
    private lancamentosRepo: Repository<Lancamento>,
  ) {}

  async findAll(
    filters: LancamentosFilterDto,
    user: User,
  ): Promise<PaginatedLancamentosResponseDto> {
    const qb = this.lancamentosRepo.createQueryBuilder('l');

    // TENANT ISOLATION (crítico!)
    if (
      ![
        UserRole.SUPER_ADMIN,
        UserRole.SUPORTE_ADMIN,
        UserRole.FINANCEIRO_ADMIN,
      ].includes(user.role)
    ) {
      qb.andWhere('l.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    // Filtros dinâmicos
    if (filters.ano) {
      qb.andWhere('l.ano = :ano', { ano: filters.ano });
    }

    if (filters.mes) {
      qb.andWhere('l.mes = :mes', { mes: filters.mes });
    }

    if (filters.tpRepasse) {
      qb.andWhere('l.tpRepasse = :tipo', { tipo: filters.tpRepasse });
    }

    if (filters.banco && filters.agencia && filters.conta) {
      qb.andWhere(
        'l.banco = :banco AND l.agencia = :agencia AND l.conta = :conta',
        {
          banco: filters.banco,
          agencia: filters.agencia,
          conta: filters.conta,
        },
      );
    }

    if (filters.search) {
      qb.andWhere(
        '(l.municipio ILIKE :search OR l.entidade ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Filtro por CNPJ (busca exata)
    if (filters.cnpj) {
      qb.andWhere('l.cnpj = :cnpj', { cnpj: filters.cnpj });
    }

    // Filtro por Município (busca parcial, case-insensitive)
    if (filters.municipio) {
      qb.andWhere('l.municipio ILIKE :municipio', {
        municipio: `%${filters.municipio}%`,
      });
    }

    // Filtro por UF (busca exata, uppercase)
    if (filters.uf) {
      qb.andWhere('l.uf = :uf', { uf: filters.uf.toUpperCase() });
    }

    // Ordenação
    const sortBy = filters.sortBy || 'ano';
    const sortOrder = filters.sortOrder || 'DESC';
    qb.orderBy(`l.${sortBy}`, sortOrder);

    // Adicionar ordenação secundária por mês se ordenando por ano
    if (sortBy === 'ano') {
      qb.addOrderBy('l.mes', sortOrder);
    }

    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((lancamento) => this.mapToResponseDto(lancamento)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: User): Promise<LancamentoResponseDto> {
    const qb = this.lancamentosRepo.createQueryBuilder('l');
    qb.where('l.id = :id', { id });

    // TENANT ISOLATION
    if (
      ![
        UserRole.SUPER_ADMIN,
        UserRole.SUPORTE_ADMIN,
        UserRole.FINANCEIRO_ADMIN,
      ].includes(user.role)
    ) {
      qb.andWhere('l.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    const lancamento = await qb.getOne();

    if (!lancamento) {
      throw new NotFoundException(
        `Lançamento com ID ${id} não encontrado`,
      );
    }

    return this.mapToResponseDto(lancamento);
  }

  async getStats(
    filters: LancamentosFilterDto,
    user: User,
  ): Promise<LancamentosStatsResponseDto> {
    const baseQb = this.lancamentosRepo.createQueryBuilder('l');

    // TENANT ISOLATION
    if (
      ![
        UserRole.SUPER_ADMIN,
        UserRole.SUPORTE_ADMIN,
        UserRole.FINANCEIRO_ADMIN,
      ].includes(user.role)
    ) {
      baseQb.where('l.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    // Aplicar filtros
    if (filters.ano) {
      baseQb.andWhere('l.ano = :ano', { ano: filters.ano });
    }

    if (filters.mes) {
      baseQb.andWhere('l.mes = :mes', { mes: filters.mes });
    }

    if (filters.tpRepasse) {
      baseQb.andWhere('l.tpRepasse = :tipo', { tipo: filters.tpRepasse });
    }

    if (filters.banco && filters.agencia && filters.conta) {
      baseQb.andWhere(
        'l.banco = :banco AND l.agencia = :agencia AND l.conta = :conta',
        {
          banco: filters.banco,
          agencia: filters.agencia,
          conta: filters.conta,
        },
      );
    }

    if (filters.search) {
      baseQb.andWhere(
        '(l.municipio ILIKE :search OR l.entidade ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.cnpj) {
      baseQb.andWhere('l.cnpj = :cnpj', { cnpj: filters.cnpj });
    }

    if (filters.municipio) {
      baseQb.andWhere('l.municipio ILIKE :municipio', {
        municipio: `%${filters.municipio}%`,
      });
    }

    if (filters.uf) {
      baseQb.andWhere('l.uf = :uf', { uf: filters.uf.toUpperCase() });
    }

    // Agregações gerais
    const stats = await baseQb
      .select('COUNT(*)', 'total')
      .addSelect('SUM(l.valorBruto)', 'valorTotalBruto')
      .addSelect('SUM(l.valorLiquido)', 'valorTotalLiquido')
      .getRawOne();

    // Período mais recente
    const periodoQb = this.lancamentosRepo.createQueryBuilder('l');
    if (
      ![
        UserRole.SUPER_ADMIN,
        UserRole.SUPORTE_ADMIN,
        UserRole.FINANCEIRO_ADMIN,
      ].includes(user.role)
    ) {
      periodoQb.where('l.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    // Aplicar os mesmos filtros
    if (filters.ano) {
      periodoQb.andWhere('l.ano = :ano', { ano: filters.ano });
    }
    if (filters.mes) {
      periodoQb.andWhere('l.mes = :mes', { mes: filters.mes });
    }
    if (filters.tpRepasse) {
      periodoQb.andWhere('l.tpRepasse = :tipo', { tipo: filters.tpRepasse });
    }
    if (filters.banco && filters.agencia && filters.conta) {
      periodoQb.andWhere(
        'l.banco = :banco AND l.agencia = :agencia AND l.conta = :conta',
        {
          banco: filters.banco,
          agencia: filters.agencia,
          conta: filters.conta,
        },
      );
    }
    if (filters.search) {
      periodoQb.andWhere(
        '(l.municipio ILIKE :search OR l.entidade ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.cnpj) {
      periodoQb.andWhere('l.cnpj = :cnpj', { cnpj: filters.cnpj });
    }
    if (filters.municipio) {
      periodoQb.andWhere('l.municipio ILIKE :municipio', {
        municipio: `%${filters.municipio}%`,
      });
    }
    if (filters.uf) {
      periodoQb.andWhere('l.uf = :uf', { uf: filters.uf.toUpperCase() });
    }

    const periodoMaisRecente = await periodoQb
      .select('l.ano', 'ano')
      .addSelect('l.mes', 'mes')
      .orderBy('l.ano', 'DESC')
      .addOrderBy('l.mes', 'DESC')
      .limit(1)
      .getRawOne();

    // Tipos de repasse
    const tiposQb = this.lancamentosRepo.createQueryBuilder('l');
    if (
      ![
        UserRole.SUPER_ADMIN,
        UserRole.SUPORTE_ADMIN,
        UserRole.FINANCEIRO_ADMIN,
      ].includes(user.role)
    ) {
      tiposQb.where('l.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    // Aplicar filtros
    if (filters.ano) {
      tiposQb.andWhere('l.ano = :ano', { ano: filters.ano });
    }
    if (filters.mes) {
      tiposQb.andWhere('l.mes = :mes', { mes: filters.mes });
    }
    if (filters.banco && filters.agencia && filters.conta) {
      tiposQb.andWhere(
        'l.banco = :banco AND l.agencia = :agencia AND l.conta = :conta',
        {
          banco: filters.banco,
          agencia: filters.agencia,
          conta: filters.conta,
        },
      );
    }
    if (filters.search) {
      tiposQb.andWhere(
        '(l.municipio ILIKE :search OR l.entidade ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.cnpj) {
      tiposQb.andWhere('l.cnpj = :cnpj', { cnpj: filters.cnpj });
    }
    if (filters.municipio) {
      tiposQb.andWhere('l.municipio ILIKE :municipio', {
        municipio: `%${filters.municipio}%`,
      });
    }
    if (filters.uf) {
      tiposQb.andWhere('l.uf = :uf', { uf: filters.uf.toUpperCase() });
    }

    const tiposRepasse = await tiposQb
      .select('l.tpRepasse', 'tipo')
      .addSelect('COUNT(*)', 'total')
      .groupBy('l.tpRepasse')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    // Contas bancárias
    const contasQb = this.lancamentosRepo.createQueryBuilder('l');
    if (
      ![
        UserRole.SUPER_ADMIN,
        UserRole.SUPORTE_ADMIN,
        UserRole.FINANCEIRO_ADMIN,
      ].includes(user.role)
    ) {
      contasQb.where('l.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    // Aplicar filtros
    if (filters.ano) {
      contasQb.andWhere('l.ano = :ano', { ano: filters.ano });
    }
    if (filters.mes) {
      contasQb.andWhere('l.mes = :mes', { mes: filters.mes });
    }
    if (filters.tpRepasse) {
      contasQb.andWhere('l.tpRepasse = :tipo', { tipo: filters.tpRepasse });
    }
    if (filters.search) {
      contasQb.andWhere(
        '(l.municipio ILIKE :search OR l.entidade ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.cnpj) {
      contasQb.andWhere('l.cnpj = :cnpj', { cnpj: filters.cnpj });
    }
    if (filters.municipio) {
      contasQb.andWhere('l.municipio ILIKE :municipio', {
        municipio: `%${filters.municipio}%`,
      });
    }
    if (filters.uf) {
      contasQb.andWhere('l.uf = :uf', { uf: filters.uf.toUpperCase() });
    }

    const contas = await contasQb
      .select('l.banco', 'banco')
      .addSelect('l.agencia', 'agencia')
      .addSelect('l.conta', 'conta')
      .addSelect('COUNT(*)', 'total')
      .where('l.banco IS NOT NULL')
      .groupBy('l.banco')
      .addGroupBy('l.agencia')
      .addGroupBy('l.conta')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    // Anos disponíveis (não aplica filtros de ano/mês para manter todas as opções)
    const anosQb = this.lancamentosRepo.createQueryBuilder('l');
    if (
      ![
        UserRole.SUPER_ADMIN,
        UserRole.SUPORTE_ADMIN,
        UserRole.FINANCEIRO_ADMIN,
      ].includes(user.role)
    ) {
      anosQb.where('l.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    // Aplicar apenas filtros não temporais
    if (filters.tpRepasse) {
      anosQb.andWhere('l.tpRepasse = :tipo', { tipo: filters.tpRepasse });
    }
    if (filters.banco && filters.agencia && filters.conta) {
      anosQb.andWhere(
        'l.banco = :banco AND l.agencia = :agencia AND l.conta = :conta',
        {
          banco: filters.banco,
          agencia: filters.agencia,
          conta: filters.conta,
        },
      );
    }
    if (filters.search) {
      anosQb.andWhere(
        '(l.municipio ILIKE :search OR l.entidade ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.cnpj) {
      anosQb.andWhere('l.cnpj = :cnpj', { cnpj: filters.cnpj });
    }
    if (filters.municipio) {
      anosQb.andWhere('l.municipio ILIKE :municipio', {
        municipio: `%${filters.municipio}%`,
      });
    }
    if (filters.uf) {
      anosQb.andWhere('l.uf = :uf', { uf: filters.uf.toUpperCase() });
    }

    const anosRaw = await anosQb
      .select('DISTINCT l.ano', 'ano')
      .orderBy('l.ano', 'DESC')
      .getRawMany();

    const anos = anosRaw.map((a) => parseInt(a.ano));

    return {
      totalLancamentos: parseInt(stats?.total || '0'),
      valorTotalBruto: parseFloat(stats?.valorTotalBruto || '0'),
      valorTotalLiquido: parseFloat(stats?.valorTotalLiquido || '0'),
      periodoMaisRecente: periodoMaisRecente || { ano: 0, mes: 0 },
      anos,
      tiposRepasse: tiposRepasse || [],
      contasBancarias: contas || [],
    };
  }

  private mapToResponseDto(lancamento: Lancamento): LancamentoResponseDto {
    return {
      id: lancamento.id,
      tenantId: lancamento.tenantId,
      cnpj: lancamento.cnpj,
      nuProcesso: lancamento.nuProcesso,
      nuPortaria: lancamento.nuPortaria,
      dtPortaria: lancamento.dtPortaria,
      ano: lancamento.ano,
      mes: lancamento.mes,
      nuCompetencia: lancamento.nuCompetencia,
      diaPagamento: lancamento.diaPagamento,
      tpRepasse: lancamento.tpRepasse,
      nuOb: lancamento.nuOb,
      coTipoRecurso: lancamento.coTipoRecurso,
      tpRecursoProp: lancamento.tpRecursoProp,
      recursoCOVIDOUNormal: lancamento.recursoCOVIDOUNormal,
      uf: lancamento.uf,
      coMunicipioIbge: lancamento.coMunicipioIbge,
      municipio: lancamento.municipio,
      entidade: lancamento.entidade,
      bloco: lancamento.bloco,
      componente: lancamento.componente,
      programa: lancamento.programa,
      nuProposta: lancamento.nuProposta,
      banco: lancamento.banco,
      agencia: lancamento.agencia,
      conta: lancamento.conta,
      valorBruto: Number(lancamento.valorBruto),
      desconto: Number(lancamento.desconto),
      valorLiquido: Number(lancamento.valorLiquido),
      dtSaldoConta: lancamento.dtSaldoConta,
      vlSaldoConta: lancamento.vlSaldoConta ? Number(lancamento.vlSaldoConta) : undefined,
      marcadorEmendaCOVID: lancamento.marcadorEmendaCOVID,
      criadoEm: lancamento.criadoEm,
      criadoPor: lancamento.criadoPor,
      atualizadoEm: lancamento.atualizadoEm,
      atualizadoPor: lancamento.atualizadoPor,
    };
  }
}
