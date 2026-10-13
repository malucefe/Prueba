import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { ApiKeyGuard } from './guards/api-key.guard';

describe('InternalController', () => {
  let controller: InternalController;
  let internalService: jest.Mocked<Partial<InternalService>>;

  const mockRules = [
    {
      id: 'rule-uuid-1',
      key: 'regla1',
      nombre: 'Concentración de gasto por categoría',
      parametros: { umbralPorcentaje: 30 },
      plantilla: 'Tu gasto en ${cat} supera el umbral configurado.',
      activa: true,
    },
  ];

  beforeEach(async () => {
    internalService = {
      getRecentTransactions: jest.fn(),
      getCurrentMonthIncome: jest.fn(),
      batchCreateRecommendations: jest.fn(),
      getActiveRules: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalController,
        { provide: InternalService, useValue: internalService },
        // The class-level ApiKeyGuard is instantiated by the testing module:
        // it needs a ConfigService providing N8N_API_KEY.
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('secret-n8n-key') },
        },
      ],
    }).compile();

    controller = module.get<InternalController>(InternalController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('route guards', () => {
    it('should protect every internal route with the ApiKeyGuard', () => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, InternalController);
      expect(guards).toContain(ApiKeyGuard);
    });
  });

  describe('getActiveRules', () => {
    it('should delegate to the service', async () => {
      (internalService.getActiveRules as jest.Mock).mockResolvedValue(
        mockRules as any,
      );

      const result = await controller.getActiveRules();

      expect(internalService.getActiveRules).toHaveBeenCalled();
      expect(result).toEqual(mockRules);
    });
  });

  describe('ApiKeyGuard', () => {
    const buildContext = (headers: Record<string, string>) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ headers }),
        }),
      }) as unknown as ExecutionContext;

    let guard: ApiKeyGuard;

    beforeEach(() => {
      const config = {
        getOrThrow: jest.fn().mockReturnValue('secret-n8n-key'),
      } as unknown as ConfigService;
      guard = new ApiKeyGuard(config);
    });

    it('should reject requests without an API key', () => {
      expect(() => guard.canActivate(buildContext({}))).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(buildContext({}))).toThrow(
        'API key inválida',
      );
    });

    it('should reject requests with a wrong API key', () => {
      expect(() =>
        guard.canActivate(buildContext({ 'x-api-key': 'wrong-key' })),
      ).toThrow(UnauthorizedException);
    });

    it('should allow requests carrying the configured API key', () => {
      expect(
        guard.canActivate(buildContext({ 'x-api-key': 'secret-n8n-key' })),
      ).toBe(true);
    });
  });
});
