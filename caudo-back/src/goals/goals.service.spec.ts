import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './entities/goal.entity';
import { NotFoundException } from '@nestjs/common';

describe('GoalsService', () => {
  let service: GoalsService;
  let repo: jest.Mocked<Partial<Repository<Goal>>>;

  const mockUserId = 'user-uuid-123';
  const mockGoalId = 'goal-uuid-001';

  const mockGoal: Partial<Goal> = {
    id: mockGoalId,
    userId: mockUserId,
    nombre: 'Fondo de emergencia',
    montoObjetivo: 5000000,
    montoActual: 0,
    fechaLimite: new Date('2026-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: getRepositoryToken(Goal), useValue: repo },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Fondo de emergencia',
      montoObjetivo: 5000000,
      fechaLimite: '2026-12-31',
    };

    it('should create a goal with userId', async () => {
      (repo.create as jest.Mock).mockReturnValue(mockGoal);
      (repo.save as jest.Mock).mockResolvedValue(mockGoal);

      const result = await service.create(mockUserId, createDto);

      expect(repo.create).toHaveBeenCalledWith({
        ...createDto,
        userId: mockUserId,
      });
      expect(repo.save).toHaveBeenCalledWith(mockGoal);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('findAll', () => {
    it('should return goals filtered by userId, ordered by fechaLimite ASC', async () => {
      const mockGoals = [mockGoal];
      (repo.find as jest.Mock).mockResolvedValue(mockGoals);

      const result = await service.findAll(mockUserId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { fechaLimite: 'ASC' },
      });
      expect(result).toEqual(mockGoals);
    });
  });

  describe('findOne', () => {
    it('should return goal by id and userId', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockGoal);

      const result = await service.findOne(mockUserId, mockGoalId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockGoalId, userId: mockUserId },
      });
      expect(result).toEqual(mockGoal);
    });

    it('should throw NotFoundException when goal not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findOne(mockUserId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(mockUserId, 'non-existent'),
      ).rejects.toThrow('Meta no encontrada');
    });
  });

  describe('update', () => {
    it('should update goal fields', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockGoal);
      (repo.save as jest.Mock).mockResolvedValue({
        ...mockGoal,
        montoActual: 1500000,
      });

      const updateDto = { montoActual: 1500000 };

      const result = await service.update(mockUserId, mockGoalId, updateDto);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockGoalId, userId: mockUserId },
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockGoal, montoActual: 1500000 });
    });
  });

  describe('remove', () => {
    it('should delete a goal', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockGoal);
      (repo.remove as jest.Mock).mockResolvedValue(mockGoal);

      await service.remove(mockUserId, mockGoalId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: mockGoalId, userId: mockUserId },
      });
      expect(repo.remove).toHaveBeenCalledWith(mockGoal);
    });
  });
});
