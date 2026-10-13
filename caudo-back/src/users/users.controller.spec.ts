import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const mockAdminId = 'admin-uuid-456';
  const mockUserId = 'user-uuid-123';

  const mockUser = {
    id: mockUserId,
    nombre: 'Juan Pérez',
    email: 'juan@email.com',
    passwordHash: 'hashed-password',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminReq = { user: { userId: mockAdminId, role: Role.ADMIN } };

  const handler = (key: string) => (UsersController.prototype as any)[key];

  const guardsFor = (key: string) =>
    Reflect.getMetadata(GUARDS_METADATA, handler(key)) as any[];

  const rolesFor = (key: string) =>
    Reflect.getMetadata(ROLES_KEY, handler(key));

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      suspend: jest.fn(),
      reactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersController,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('route guards', () => {
    const adminRoutes = [
      { key: 'findAll', label: 'GET /users' },
      { key: 'create', label: 'POST /users' },
      { key: 'update', label: 'PATCH /users/:id' },
      { key: 'suspend', label: 'PATCH /users/:id/suspend' },
      { key: 'reactivate', label: 'PATCH /users/:id/reactivate' },
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

    it('profile routes should stay available to any authenticated user', () => {
      expect(guardsFor('getProfile')).toContain(JwtAuthGuard);
      expect(guardsFor('getProfile')).not.toContain(RolesGuard);
      expect(rolesFor('getProfile')).toBeUndefined();
      expect(guardsFor('updateProfile')).toContain(JwtAuthGuard);
      expect(guardsFor('updateProfile')).not.toContain(RolesGuard);
      expect(rolesFor('updateProfile')).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should delegate to the service and strip the password hash', async () => {
      (usersService.createUser as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      const result = await controller.create({
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
        password: 'Password1!',
      });

      expect(usersService.createUser).toHaveBeenCalledWith({
        nombre: 'Juan Pérez',
        email: 'juan@email.com',
        password: 'Password1!',
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('role', Role.USER);
      expect(result).toHaveProperty('isActive', true);
    });
  });

  describe('update', () => {
    it('should pass the authenticated admin id to the service', async () => {
      (usersService.updateUser as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      const result = await controller.update(
        mockUserId,
        { nombre: 'María López' },
        adminReq,
      );

      expect(usersService.updateUser).toHaveBeenCalledWith(
        mockUserId,
        { nombre: 'María López' },
        mockAdminId,
      );
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('suspend', () => {
    it('should pass the authenticated admin id to the service', async () => {
      (usersService.suspend as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      const result = await controller.suspend(mockUserId, adminReq);

      expect(usersService.suspend).toHaveBeenCalledWith(
        mockUserId,
        mockAdminId,
      );
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.isActive).toBe(false);
    });

    it('should let NotFoundException propagate as 404', async () => {
      (usersService.suspend as jest.Mock).mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      await expect(controller.suspend('unknown-id', adminReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reactivate', () => {
    it('should delegate to the service and strip the password hash', async () => {
      (usersService.reactivate as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      const result = await controller.reactivate(mockUserId);

      expect(usersService.reactivate).toHaveBeenCalledWith(mockUserId);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
