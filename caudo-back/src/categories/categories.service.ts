import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async findAll(includeInactive = false): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: includeInactive ? {} : { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findByType(
    tipo: CategoryType,
    includeInactive = false,
  ): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: includeInactive ? { tipo } : { tipo, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoriesRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Category>): Promise<Category> {
    const category = this.categoriesRepository.create(data);
    return this.categoriesRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const transactionsCount = await this.transactionsRepository.count({
      where: { categoriaId: id },
    });
    if (transactionsCount > 0) {
      // CA esc.2 (HU-20): no se puede borrar una categoría con historial;
      // se sugiere desactivarla para ocultarla del selector.
      throw new ConflictException(
        'La categoría tiene transacciones asociadas y no puede eliminarse. Te sugerimos desactivarla en su lugar para ocultarla del selector.',
      );
    }

    await this.categoriesRepository.delete(id);
  }

  async count(): Promise<number> {
    return this.categoriesRepository.count();
  }
}
