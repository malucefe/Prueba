import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { Role } from '../../users/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const payload = {
    sub: 'user-uuid-123',
    email: 'juan@email.com',
    role: Role.USER,
  };

  const mockUser = {
    id: payload.sub,
    nombre: 'Juan Pérez',
    email: payload.email,
    passwordHash: 'hashed-password',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
  } as any;

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
    };

    strategy = new JwtStrategy(configService, usersService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load the user from the database and return the request user', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue(mockUser);

    const result = await strategy.validate(payload);

    expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
    expect(result).toEqual({
      userId: mockUser.id,
      email: mockUser.email,
      role: Role.USER,
    });
  });

  it('should throw UnauthorizedException when the account is suspended', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(strategy.validate(payload)).rejects.toThrow(
      'Tu cuenta está suspendida. Contacta al administrador.',
    );
  });

  it('should throw UnauthorizedException when the user no longer exists', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
