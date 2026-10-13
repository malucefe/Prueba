import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationsRepository: Repository<Recommendation>,
  ) {}

  async findAll(userId: string, soloNoLeidas = false) {
    const where: any = { userId };
    if (soloNoLeidas) {
      where.leida = false;
    }
    return this.recommendationsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Recommendation> {
    const rec = await this.recommendationsRepository.findOne({
      where: { id, userId },
    });
    if (!rec) {
      throw new NotFoundException('Recomendación no encontrada');
    }
    return rec;
  }

  async markAsRead(userId: string, id: string): Promise<Recommendation> {
    const rec = await this.findOne(userId, id);
    rec.leida = true;
    return this.recommendationsRepository.save(rec);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.recommendationsRepository.update(
      { userId, leida: false },
      { leida: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.recommendationsRepository.count({
      where: { userId, leida: false },
    });
  }

  async count(): Promise<number> {
    return this.recommendationsRepository.count();
  }

  async create(data: Partial<Recommendation>): Promise<Recommendation> {
    const rec = this.recommendationsRepository.create(data);
    return this.recommendationsRepository.save(rec);
  }
}
