import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Recommendation, RecommendationType } from '../recommendations/entities/recommendation.entity';
import { RecommendationRule } from '../rules/entities/recommendation-rule.entity';

@Injectable()
export class InternalService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Recommendation)
    private readonly recommendationsRepository: Repository<Recommendation>,
    @InjectRepository(RecommendationRule)
    private readonly rulesRepository: Repository<RecommendationRule>,
  ) {}

  async getActiveRules() {
    return this.rulesRepository.find({
      where: { activa: true },
      order: { key: 'ASC' },
    });
  }

  async getRecentTransactions(userId: string, limit = 30) {
    return this.transactionsRepository.find({
      where: { userId },
      relations: ['category'],
      order: { fecha: 'DESC' },
      take: limit,
    });
  }

  async getCurrentMonthIncome(userId: string) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.monto), 0)', 'total_ingresos')
      .where('t.userId = :userId', { userId })
      .andWhere('t.tipo = :tipo', { tipo: 'ingreso' })
      .andWhere('t.fecha BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .getRawOne();

    return { total_ingresos: Number(result?.total_ingresos || 0) };
  }

  async batchCreateRecommendations(recommendations: Array<{
    user_id: string;
    contenido: string;
    tipo: string;
    leida?: boolean;
  }>) {
    const entities = recommendations.map(r =>
      this.recommendationsRepository.create({
        userId: r.user_id,
        contenido: r.contenido,
        tipo: r.tipo as RecommendationType,
        leida: r.leida ?? false,
      }),
    );
    return this.recommendationsRepository.save(entities);
  }
}
