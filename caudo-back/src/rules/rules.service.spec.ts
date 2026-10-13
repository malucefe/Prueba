import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RecommendationRule } from './entities/recommendation-rule.entity';

describe('RulesService', () => {
  let service: RulesService;
  let repo: jest.Mocked<Partial<{
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  }>>;

  const mockRule = {
    id: 'rule-uuid-1',
    key: 'regla1',
    nombre: 'Concentración de gasto por categoría',
    parametros: { umbralPorcentaje: 30 },
    plantilla:
      'Tu gasto en ${cat} representa el ${porcentaje.toFixed(1)}% de tus ingresos.',
    activa: true,
  } as RecommendationRule;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesService,
        { provide: getRepositoryToken(RecommendationRule), useValue: repo },
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return every rule ordered by key', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockRule]);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({ order: { key: 'ASC' } });
      expect(result).toEqual([mockRule]);
    });
  });

  describe('findActive', () => {
    it('should return only active rules ordered by key', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockRule]);

      const result = await service.findActive();

      expect(repo.find).toHaveBeenCalledWith({
        where: { activa: true },
        order: { key: 'ASC' },
      });
      expect(result).toEqual([mockRule]);
    });
  });

  describe('update', () => {
    it('should update the given partial fields and return the rule', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockRule);
      (repo.save as jest.Mock).mockImplementation((r) => Promise.resolve(r));

      const result = await service.update(mockRule.id, {
        parametros: { umbralPorcentaje: 45 },
        plantilla: 'Nueva plantilla personalizada',
        activa: false,
      });

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockRule.id },
      });
      expect(result.parametros).toEqual({ umbralPorcentaje: 45 });
      expect(result.plantilla).toBe('Nueva plantilla personalizada');
      expect(result.activa).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockRule.id }),
      );
    });

    it('should leave untouched fields unchanged', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockRule);
      (repo.save as jest.Mock).mockImplementation((r) => Promise.resolve(r));

      const result = await service.update(mockRule.id, { activa: false });

      expect(result.nombre).toBe(mockRule.nombre);
      expect(result.plantilla).toBe(mockRule.plantilla);
      expect(result.parametros).toEqual(mockRule.parametros);
    });

    it('should throw NotFoundException for an unknown id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { activa: false }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('unknown-id', { activa: false }),
      ).rejects.toThrow('Regla no encontrada');
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
