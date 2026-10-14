import { SeedService } from './seed.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hash-mock'),
}));

/**
 * Tests del gating de seed introducido para Render (decisiones 3 del task
 * deploy-render): SEED_ENABLED y contraseñas desde env.
 */
describe('SeedService', () => {
  let service: SeedService;
  let categoriesService: { count: jest.Mock; create: jest.Mock; findAll: jest.Mock };
  let usersService: { count: jest.Mock; create: jest.Mock; findByEmail: jest.Mock };
  let transactionsService: { count: jest.Mock; create: jest.Mock };
  let goalsService: { findAll: jest.Mock; create: jest.Mock };
  let recommendationsService: { count: jest.Mock; create: jest.Mock };
  let dataSource: { getRepository: jest.Mock };
  let logSpy: ReturnType<typeof jest.spyOn>;
  let warnSpy: ReturnType<typeof jest.spyOn>;

  const originalEnv = process.env;

  const buildService = () =>
    new SeedService(
      categoriesService as any,
      usersService as any,
      transactionsService as any,
      goalsService as any,
      recommendationsService as any,
      dataSource as any,
    );

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['SEED_ENABLED'];
    delete process.env['SEED_ADMIN_PASSWORD'];
    delete process.env['SEED_USER_PASSWORD'];

    categoriesService = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn().mockResolvedValue([]),
    };
    usersService = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(undefined),
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    transactionsService = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(undefined),
    };
    goalsService = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(undefined),
    };
    recommendationsService = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      getRepository: jest.fn().mockReturnValue({
        count: jest.fn().mockResolvedValue(0),
        save: jest.fn().mockResolvedValue(undefined),
      }),
    };

    (bcrypt.hash as jest.Mock).mockClear();
    service = buildService();
    logSpy = jest.spyOn((service as any).logger, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('SEED_ENABLED', () => {
    it('con SEED_ENABLED=false no ejecuta ningún seed', async () => {
      process.env['SEED_ENABLED'] = 'false';

      await service.onModuleInit();

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('SEED_ENABLED=false'));
      expect(categoriesService.count).not.toHaveBeenCalled();
      expect(usersService.count).not.toHaveBeenCalled();
      expect(dataSource.getRepository).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('sin SEED_ENABLED ejecuta el seed completo', async () => {
      await service.onModuleInit();

      expect(categoriesService.count).toHaveBeenCalled();
      expect(dataSource.getRepository).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('contraseñas del seed de usuarios', () => {
    it('en desarrollo usa los defaults actuales Admin1234!/User1234!', async () => {
      await service.onModuleInit();

      expect(bcrypt.hash).toHaveBeenCalledWith('Admin1234!', 12);
      expect(bcrypt.hash).toHaveBeenCalledWith('User1234!', 12);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledTimes(2);
    });

    it('en producción sin contraseñas advierte y omite SOLO el seed de usuarios', async () => {
      process.env['NODE_ENV'] = 'production';
      process.env['SEED_ENABLED'] = 'true';

      await service.onModuleInit();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('SEED_ADMIN_PASSWORD'));
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      // El resto del seed sí corre (categorías y reglas).
      expect(categoriesService.count).toHaveBeenCalled();
      expect(dataSource.getRepository).toHaveBeenCalled();
    });

    it('en producción con SEED_ADMIN_PASSWORD/SEED_USER_PASSWORD las usa', async () => {
      process.env['NODE_ENV'] = 'production';
      process.env['SEED_ADMIN_PASSWORD'] = 'ProdAdmin#1';
      process.env['SEED_USER_PASSWORD'] = 'ProdUser#1';

      await service.onModuleInit();

      expect(bcrypt.hash).toHaveBeenCalledWith('ProdAdmin#1', 12);
      expect(bcrypt.hash).toHaveBeenCalledWith('ProdUser#1', 12);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledTimes(2);
    });

    it('las env tienen prioridad sobre los defaults también fuera de producción', async () => {
      process.env['SEED_ADMIN_PASSWORD'] = 'CustomAdmin1';
      process.env['SEED_USER_PASSWORD'] = 'CustomUser1';

      await service.onModuleInit();

      expect(bcrypt.hash).toHaveBeenCalledWith('CustomAdmin1', 12);
      expect(bcrypt.hash).toHaveBeenCalledWith('CustomUser1', 12);
      expect(bcrypt.hash).not.toHaveBeenCalledWith('Admin1234!', 12);
    });
  });
});
