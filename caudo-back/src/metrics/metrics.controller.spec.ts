import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: jest.Mocked<Partial<MetricsService>>;

  const emptyMetrics = {
    desde: '',
    hasta: '',
    usuariosTotales: 0,
    usuariosActivos: 0,
    transacciones: { total: 0, ingresos: 0, egresos: 0 },
    recomendacionesGeneradas: 0,
    transaccionesPorDia: [],
  };

  const handler = (key: string) => (MetricsController.prototype as any)[key];

  const guardsFor = (key: string) =>
    Reflect.getMetadata(GUARDS_METADATA, handler(key)) as any[];

  const rolesFor = (key: string) => Reflect.getMetadata(ROLES_KEY, handler(key));

  beforeEach(async () => {
    metricsService = { getMetrics: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsController,
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('route guards', () => {
    it('GET /metrics should be protected by JwtAuthGuard and RolesGuard', () => {
      const guards = guardsFor('getMetrics');
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('GET /metrics should require the ADMIN role', () => {
      expect(rolesFor('getMetrics')).toEqual([Role.ADMIN]);
    });
  });

  describe('date validation', () => {
    it('should reject a desde that does not match YYYY-MM-DD', async () => {
      await expect(
        controller.getMetrics('2026/10/01', '2026-10-14'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getMetrics('2026/10/01', '2026-10-14'),
      ).rejects.toThrow('Parámetro "desde" inválido');
      expect(metricsService.getMetrics).not.toHaveBeenCalled();
    });

    it('should reject an hasta that does not match YYYY-MM-DD', async () => {
      await expect(
        controller.getMetrics('2026-10-01', 'ayer'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getMetrics('2026-10-01', 'ayer'),
      ).rejects.toThrow('Parámetro "hasta" inválido');
      expect(metricsService.getMetrics).not.toHaveBeenCalled();
    });

    it('should reject a value that matches the pattern but is not a real date', async () => {
      await expect(
        controller.getMetrics('2026-02-31', '2026-10-14'),
      ).rejects.toThrow('Parámetro "desde" inválido');
      await expect(
        controller.getMetrics('2026-13-45', '2026-10-14'),
      ).rejects.toThrow('Parámetro "desde" inválido');
      expect(metricsService.getMetrics).not.toHaveBeenCalled();
    });

    it('should reject desde later than hasta', async () => {
      await expect(
        controller.getMetrics('2026-10-14', '2026-10-01'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getMetrics('2026-10-14', '2026-10-01'),
      ).rejects.toThrow('"desde" no puede ser posterior a "hasta"');
      expect(metricsService.getMetrics).not.toHaveBeenCalled();
    });

    it('should accept an inclusive same-day period', async () => {
      (metricsService.getMetrics as jest.Mock).mockResolvedValue(emptyMetrics);

      await controller.getMetrics('2026-10-14', '2026-10-14');

      expect(metricsService.getMetrics).toHaveBeenCalledWith(
        '2026-10-14',
        '2026-10-14',
      );
    });
  });

  describe('period defaults', () => {
    it('should default desde to the first day of the current month and hasta to today', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 9, 14, 12, 0, 0));
      (metricsService.getMetrics as jest.Mock).mockResolvedValue(emptyMetrics);

      await controller.getMetrics(undefined, undefined);

      expect(metricsService.getMetrics).toHaveBeenCalledWith(
        '2026-10-01',
        '2026-10-14',
      );
    });

    it('should default hasta to today when only desde is sent', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 0, 5, 9, 30, 0));
      (metricsService.getMetrics as jest.Mock).mockResolvedValue(emptyMetrics);

      await controller.getMetrics('2025-12-20', undefined);

      expect(metricsService.getMetrics).toHaveBeenCalledWith(
        '2025-12-20',
        '2026-01-05',
      );
    });
  });

  describe('getMetrics', () => {
    it('should pass the validated period to the service and return its result', async () => {
      const expected = {
        ...emptyMetrics,
        desde: '2026-09-01',
        hasta: '2026-09-30',
        usuariosTotales: 8,
      };
      (metricsService.getMetrics as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getMetrics('2026-09-01', '2026-09-30');

      expect(metricsService.getMetrics).toHaveBeenCalledWith(
        '2026-09-01',
        '2026-09-30',
      );
      expect(result).toEqual(expected);
    });
  });
});
