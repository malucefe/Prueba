import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOperator } from 'typeorm';
import { MetricsService } from './metrics.service';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { Recommendation } from '../recommendations/entities/recommendation.entity';
import { User } from '../users/entities/user.entity';

describe('MetricsService', () => {
  let service: MetricsService;
  let transactionsRepo: jest.Mocked<Partial<{ find: jest.Mock }>>;
  let recommendationsRepo: jest.Mocked<Partial<{ count: jest.Mock }>>;
  let usersRepo: jest.Mocked<Partial<{ count: jest.Mock }>>;

  const desde = '2026-10-01';
  const hasta = '2026-10-14';

  // Fecha ancla en UTC para que el cálculo del día no dependa de la zona horaria.
  const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

  const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
    ({
      id: 'tx-uuid-1',
      userId: 'user-uuid-1',
      tipo: TransactionType.EGRESO,
      monto: 100,
      fecha: day('2026-10-05'),
      ...overrides,
    }) as Transaction;

  beforeEach(async () => {
    transactionsRepo = { find: jest.fn() };
    recommendationsRepo = { count: jest.fn() };
    usersRepo = { count: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: getRepositoryToken(Transaction), useValue: transactionsRepo },
        { provide: getRepositoryToken(Recommendation), useValue: recommendationsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('period filtering', () => {
    it('should load transactions only between desde and hasta', async () => {
      (transactionsRepo.find as jest.Mock).mockResolvedValue([]);
      (recommendationsRepo.count as jest.Mock).mockResolvedValue(0);
      (usersRepo.count as jest.Mock).mockResolvedValue(0);

      await service.getMetrics(desde, hasta);

      expect(transactionsRepo.find).toHaveBeenCalledTimes(1);
      const options = (transactionsRepo.find as jest.Mock).mock.calls[0][0];
      expect(options.where.fecha).toBeInstanceOf(FindOperator);
      expect(options.where.fecha.type).toBe('between');
      expect(options.where.fecha.value).toEqual([new Date(desde), new Date(hasta)]);
    });

    it('should count only the recommendations created within the same period', async () => {
      (transactionsRepo.find as jest.Mock).mockResolvedValue([]);
      (recommendationsRepo.count as jest.Mock).mockResolvedValue(0);
      (usersRepo.count as jest.Mock).mockResolvedValue(0);

      await service.getMetrics(desde, hasta);

      expect(recommendationsRepo.count).toHaveBeenCalledTimes(1);
      const options = (recommendationsRepo.count as jest.Mock).mock.calls[0][0];
      expect(options.where.createdAt).toBeInstanceOf(FindOperator);
      // createdAt es timestamp (CreateDateColumn): el día "hasta" completo debe
      // contar, así que el rango termina en el inicio del día siguiente (exclusive).
      expect(options.where.createdAt.type).toBe('and');
      const [gte, lt] = options.where.createdAt.value as FindOperator<number>[];
      expect(gte.type).toBe('moreThanOrEqual');
      expect(gte.value).toEqual(day(desde));
      expect(lt.type).toBe('lessThan');
      expect(lt.value).toEqual(day('2026-10-15'));
    });
  });

  describe('aggregation', () => {
    it('should aggregate totals, active users and the per-day series', async () => {
      (transactionsRepo.find as jest.Mock).mockResolvedValue([
        buildTransaction({
          id: 'tx-3',
          userId: 'user-1',
          tipo: TransactionType.INGRESO,
          monto: 250.5,
          fecha: day('2026-10-03'),
        }),
        buildTransaction({
          id: 'tx-1',
          userId: 'user-1',
          tipo: TransactionType.INGRESO,
          monto: 1500,
          fecha: day('2026-10-01'),
        }),
        buildTransaction({
          id: 'tx-5',
          userId: 'user-2',
          tipo: TransactionType.EGRESO,
          monto: 200,
          fecha: day('2026-10-10'),
        }),
        buildTransaction({
          id: 'tx-2',
          userId: 'user-2',
          tipo: TransactionType.EGRESO,
          monto: 400,
          fecha: day('2026-10-01'),
        }),
        buildTransaction({
          id: 'tx-4',
          userId: 'user-3',
          tipo: TransactionType.EGRESO,
          monto: 75.25,
          fecha: day('2026-10-03'),
        }),
      ]);
      (recommendationsRepo.count as jest.Mock).mockResolvedValue(7);
      (usersRepo.count as jest.Mock).mockResolvedValue(12);

      const result = await service.getMetrics(desde, hasta);

      expect(result).toEqual({
        desde,
        hasta,
        usuariosTotales: 12,
        usuariosActivos: 3,
        transacciones: { total: 5, ingresos: 1750.5, egresos: 675.25 },
        recomendacionesGeneradas: 7,
        transaccionesPorDia: [
          { fecha: '2026-10-01', ingresos: 1500, egresos: 400 },
          { fecha: '2026-10-03', ingresos: 250.5, egresos: 75.25 },
          { fecha: '2026-10-10', ingresos: 0, egresos: 200 },
        ],
      });
    });

    it('should count every user once even with several transactions', async () => {
      (transactionsRepo.find as jest.Mock).mockResolvedValue([
        buildTransaction({ id: 'tx-1', userId: 'user-1', tipo: TransactionType.INGRESO, monto: 10 }),
        buildTransaction({ id: 'tx-2', userId: 'user-1', tipo: TransactionType.EGRESO, monto: 20 }),
        buildTransaction({ id: 'tx-3', userId: 'user-1', tipo: TransactionType.INGRESO, monto: 30 }),
      ]);
      (recommendationsRepo.count as jest.Mock).mockResolvedValue(0);
      (usersRepo.count as jest.Mock).mockResolvedValue(4);

      const result = await service.getMetrics(desde, hasta);

      expect(result.usuariosActivos).toBe(1);
      expect(result.transacciones.total).toBe(3);
      expect(result.transaccionesPorDia).toHaveLength(1);
    });

    it('should round money totals to two decimals', async () => {
      (transactionsRepo.find as jest.Mock).mockResolvedValue([
        buildTransaction({ id: 'tx-1', userId: 'user-1', tipo: TransactionType.INGRESO, monto: 0.1 }),
        buildTransaction({ id: 'tx-2', userId: 'user-1', tipo: TransactionType.INGRESO, monto: 0.2 }),
        buildTransaction({ id: 'tx-3', userId: 'user-1', tipo: TransactionType.EGRESO, monto: 0.1 }),
        buildTransaction({ id: 'tx-4', userId: 'user-1', tipo: TransactionType.EGRESO, monto: 0.2 }),
      ]);
      (recommendationsRepo.count as jest.Mock).mockResolvedValue(0);
      (usersRepo.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getMetrics(desde, hasta);

      expect(result.transacciones.ingresos).toBe(0.3);
      expect(result.transacciones.egresos).toBe(0.3);
      expect(result.transaccionesPorDia[0].ingresos).toBe(0.3);
      expect(result.transaccionesPorDia[0].egresos).toBe(0.3);
    });

    it('should return zeroed metrics for an empty period', async () => {
      (transactionsRepo.find as jest.Mock).mockResolvedValue([]);
      (recommendationsRepo.count as jest.Mock).mockResolvedValue(0);
      (usersRepo.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getMetrics(desde, hasta);

      expect(result).toEqual({
        desde,
        hasta,
        usuariosTotales: 5,
        usuariosActivos: 0,
        transacciones: { total: 0, ingresos: 0, egresos: 0 },
        recomendacionesGeneradas: 0,
        transaccionesPorDia: [],
      });
    });

    it('should echo the requested period in the response', async () => {
      (transactionsRepo.find as jest.Mock).mockResolvedValue([]);
      (recommendationsRepo.count as jest.Mock).mockResolvedValue(0);
      (usersRepo.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getMetrics('2026-01-15', '2026-02-20');

      expect(result.desde).toBe('2026-01-15');
      expect(result.hasta).toBe('2026-02-20');
    });
  });
});
