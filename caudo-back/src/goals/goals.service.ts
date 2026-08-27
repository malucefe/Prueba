import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
  ) {}

  async create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalsRepository.create({
      ...dto,
      userId,
    });
    return this.goalsRepository.save(goal);
  }

  async findAll(userId: string): Promise<Goal[]> {
    return this.goalsRepository.find({
      where: { userId },
      order: { fechaLimite: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id, userId },
    });
    if (!goal) {
      throw new NotFoundException('Meta no encontrada');
    }
    return goal;
  }

  async update(userId: string, id: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findOne(userId, id);
    Object.assign(goal, dto);
    return this.goalsRepository.save(goal);
  }

  async remove(userId: string, id: string): Promise<void> {
    const goal = await this.findOne(userId, id);
    await this.goalsRepository.remove(goal);
  }
}
