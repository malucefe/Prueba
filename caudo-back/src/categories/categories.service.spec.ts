import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category, CategoryType } from './entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: jest.Mocked<Partial<{
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  }>>;
  let txRepo: jest.Mocked<Partial<{ count: jest.Mock }>>;

  const mockCategory = {
    id: 'cat-uuid-1',
    nombre: 'Transporte',
    tipo: CategoryType.EGRESO,
    icono: '🚌',
    activo: true,
  } as Category;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    txRepo = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: repo },
        { provide: getRepositoryToken(Transaction), useValue: txRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should only return active categories by default', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { activo: true },
        order: { nombre: 'ASC' },
      });
      expect(result).toEqual([mockCategory]);
    });

    it('should return every category when includeInactive is true', async () => {
      (repo.find as jest.Mock).mockResolvedValue([
        mockCategory,
        { ...mockCategory, id: 'cat-uuid-2', nombre: 'Ropa', activo: false },
      ]);

      const result = await service.findAll(true);

      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        order: { nombre: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByType', () => {
    it('should filter by tipo and only active categories', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockCategory]);

      await service.findByType(CategoryType.EGRESO);

      expect(repo.find).toHaveBeenCalledWith({
        where: { tipo: CategoryType.EGRESO, activo: true },
        order: { nombre: 'ASC' },
      });
    });

    it('should include inactive categories when requested', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockCategory]);

      await service.findByType(CategoryType.EGRESO, true);

      expect(repo.find).toHaveBeenCalledWith({
        where: { tipo: CategoryType.EGRESO },
        order: { nombre: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('should create and save the category', async () => {
      (repo.create as jest.Mock).mockReturnValue(mockCategory);
      (repo.save as jest.Mock).mockResolvedValue(mockCategory);

      const result = await service.create({
        nombre: 'Transporte',
        tipo: CategoryType.EGRESO,
        icono: '🚌',
      });

      expect(repo.create).toHaveBeenCalledWith({
        nombre: 'Transporte',
        tipo: CategoryType.EGRESO,
        icono: '🚌',
      });
      expect(repo.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update the given partial fields and return the category', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockCategory);
      (repo.save as jest.Mock).mockImplementation((c) => Promise.resolve(c));

      const result = await service.update(mockCategory.id, {
        nombre: 'Transporte Urbano',
        icono: '🚍',
        activo: false,
      });

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(result.nombre).toBe('Transporte Urbano');
      expect(result.icono).toBe('🚍');
      expect(result.activo).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockCategory.id }),
      );
    });

    it('should throw NotFoundException for an unknown id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { nombre: 'X' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('unknown-id', { nombre: 'X' }),
      ).rejects.toThrow('Categoría no encontrada');
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a category without transactions', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockCategory);
      (txRepo.count as jest.Mock).mockResolvedValue(0);
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(mockCategory.id);

      expect(txRepo.count).toHaveBeenCalledWith({
        where: { categoriaId: mockCategory.id },
      });
      expect(repo.delete).toHaveBeenCalledWith(mockCategory.id);
    });

    it('should block the deletion with a conflict when the category has transactions, suggesting deactivation instead', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockCategory);
      (txRepo.count as jest.Mock).mockResolvedValue(3);

      await expect(service.remove(mockCategory.id)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.remove(mockCategory.id)).rejects.toThrow(
        /desactivarla/i,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for an unknown id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('unknown-id')).rejects.toThrow(
        'Categoría no encontrada',
      );
      expect(txRepo.count).not.toHaveBeenCalled();
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
