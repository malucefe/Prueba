import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';

describe('RulesController', () => {
  let controller: RulesController;
  let rulesService: jest.Mocked<Partial<RulesService>>;

  const mockRule = {
    id: 'rule-uuid-1',
    key: 'regla1',
    nombre: 'Concentración de gasto por categoría',
    parametros: { umbralPorcentaje: 30 },
    plantilla: 'Tu gasto en ${cat} supera el umbral configurado.',
    activa: true,
  };

  const handler = (key: string) => (RulesController.prototype as any)[key];

  const guardsFor = (key: string) =>
    Reflect.getMetadata(GUARDS_METADATA, handler(key)) as any[];

  const rolesFor = (key: string) =>
    Reflect.getMetadata(ROLES_KEY, handler(key));

  beforeEach(async () => {
    rulesService = {
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesController,
        { provide: RulesService, useValue: rulesService },
      ],
    }).compile();

    controller = module.get<RulesController>(RulesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('route guards', () => {
    const adminRoutes = [
      { key: 'findAll', label: 'GET /rules' },
      { key: 'update', label: 'PATCH /rules/:id' },
    ];

    it.each(adminRoutes)(
      '$label should be protected by JwtAuthGuard and RolesGuard',
      ({ key }) => {
        const guards = guardsFor(key);
        expect(guards).toContain(JwtAuthGuard);
        expect(guards).toContain(RolesGuard);
      },
    );

    it.each(adminRoutes)('$label should require the ADMIN role', ({ key }) => {
      expect(rolesFor(key)).toEqual([Role.ADMIN]);
    });
  });

  describe('findAll', () => {
    it('should delegate to the service', async () => {
      (rulesService.findAll as jest.Mock).mockResolvedValue([mockRule as any]);

      const result = await controller.findAll();

      expect(rulesService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockRule]);
    });
  });

  describe('update', () => {
    it('should pass the id and dto to the service', async () => {
      (rulesService.update as jest.Mock).mockResolvedValue({
        ...mockRule,
        activa: false,
      } as any);

      const result = await controller.update(mockRule.id, { activa: false });

      expect(rulesService.update).toHaveBeenCalledWith(mockRule.id, {
        activa: false,
      });
      expect(result).toHaveProperty('activa', false);
    });
  });
});
