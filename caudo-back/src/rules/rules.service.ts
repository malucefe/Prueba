import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationRule } from './entities/recommendation-rule.entity';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(RecommendationRule)
    private readonly rulesRepository: Repository<RecommendationRule>,
  ) {}

  async findAll(): Promise<RecommendationRule[]> {
    return this.rulesRepository.find({ order: { key: 'ASC' } });
  }

  async findActive(): Promise<RecommendationRule[]> {
    return this.rulesRepository.find({
      where: { activa: true },
      order: { key: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateRuleDto): Promise<RecommendationRule> {
    const rule = await this.rulesRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Regla no encontrada');
    }

    Object.assign(rule, dto);
    return this.rulesRepository.save(rule);
  }
}
