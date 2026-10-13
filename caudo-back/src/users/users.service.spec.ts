import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './entities/user.entity';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Partial<Repository<User>>>;

  const mockUserId = 'user-uuid-123';
  const mockAdminId = 'admin-uuid-456';

  const mockUser = {
    id: mockUserId,
    nombre: 'Juan Pérez',
    email: 'juan@email.com',
    passwordHash: 'hashed-password',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockAdmin = {
    id: mockAdminId,
    nombre: 'Admin Caudo',
    email: 'admin@caudo.dev',
    passwordHash: 'admin-hash',
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createDto = {
      nombre: 'María López',
      email: 'maria@email.com',
      password: 'Password1!',
    };

    it('should hash the password, default the role to user and create an active account', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      (repo.create as jest.Mock).mockImplementation((data) => ({
        ...mockUser,
        ...data,
      }));
      (repo.save as jest.Mock).mockImplementation((user) =>
        Promise.resolve(user),
      );

      const result = await service.createUser(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password1!', 12);
      expect(repo.create).toHaveBeenCalledWith({
        nombre: 'María López',
        email: 'maria@email.com',
        passwordHash: 'new-hash',
        role: Role.USER,
        isActive: true,
      });
      expect(result.role).toBe(Role.USER);
      expect(result.isActive).toBe(true);
    });

    it('should create an admin account when the admin requests the admin role', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      (repo.create as jest.Mock).mockImplementation((data) => ({
        ...mockUser,
        ...data,
      }));
      (repo.save as jest.Mock).mockImplementation((user) =>
        Promise.resolve(user),
      );

      const result = await service.createUser({
        ...createDto,
        role: Role.ADMIN,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.ADMIN }),
      );
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should throw ConflictException when the email already exists', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.createUser(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createUser(createDto)).rejects.toThrow(
        'Ya existe una cuenta con este email',
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update the given partial fields and return the user', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockAdmin);
      (repo.update as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      await service.updateUser(
        mockUserId,
        { nombre: 'María L. López' },
        mockAdminId,
      );

      expect(repo.update).toHaveBeenCalledWith(mockUserId, {
        nombre: 'María L. López',
      });
    });

    it('should allow the admin to change a role', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (repo.update as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      await service.updateUser(mockUserId, { role: Role.ADMIN }, mockAdminId);

      expect(repo.update).toHaveBeenCalledWith(mockUserId, {
        role: Role.ADMIN,
      });
    });

    it('should throw ForbiddenException when the admin tries to change their own role', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockAdmin);

      await expect(
        service.updateUser(mockAdminId, { role: Role.USER }, mockAdminId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateUser(mockAdminId, { role: Role.USER }, mockAdminId),
      ).rejects.toThrow('No puedes cambiar tu propio rol');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should allow the admin to edit their own name and email', async () => {
      (repo.findOne as jest.Mock).mockImplementation((options: any) =>
        Promise.resolve(options.where.email ? null : mockAdmin),
      );
      (repo.update as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      await service.updateUser(
        mockAdminId,
        { nombre: 'Admin Principal', email: 'root@caudo.dev' },
        mockAdminId,
      );

      expect(repo.update).toHaveBeenCalledWith(mockAdminId, {
        nombre: 'Admin Principal',
        email: 'root@caudo.dev',
      });
    });

    it('should throw NotFoundException for an unknown id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateUser('unknown-id', { nombre: 'X' }, mockAdminId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateUser('unknown-id', { nombre: 'X' }, mockAdminId),
      ).rejects.toThrow('Usuario no encontrado');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the email belongs to another user', async () => {
      (repo.findOne as jest.Mock).mockImplementation((options: any) =>
        Promise.resolve(options.where.email === mockAdmin.email ? mockAdmin : mockUser),
      );

      await expect(
        service.updateUser(
          mockUserId,
          { email: mockAdmin.email },
          mockAdminId,
        ),
      ).rejects.toThrow(ConflictException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('suspend', () => {
    it('should set isActive to false and return the updated user', async () => {
      const stored = { ...mockUser };
      (repo.findOne as jest.Mock).mockImplementation(() => Promise.resolve(stored));
      (repo.update as jest.Mock).mockImplementation((_id, data) => {
        Object.assign(stored, data);
        return Promise.resolve({ affected: 1, raw: [] });
      });

      const result = await service.suspend(mockUserId, mockAdminId);

      expect(repo.update).toHaveBeenCalledWith(mockUserId, { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should be idempotent when the account is already suspended', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as User);
      (repo.update as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.suspend(mockUserId, mockAdminId)).resolves.toEqual(
        expect.objectContaining({ isActive: false }),
      );
      await expect(service.suspend(mockUserId, mockAdminId)).resolves.toEqual(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw ForbiddenException when the admin tries to suspend themselves', async () => {
      await expect(service.suspend(mockAdminId, mockAdminId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.suspend(mockAdminId, mockAdminId)).rejects.toThrow(
        'No puedes suspender tu propia cuenta',
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for an unknown id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.suspend('unknown-id', mockAdminId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('reactivate', () => {
    it('should set isActive to true and return the updated user', async () => {
      const stored = { ...mockUser, isActive: false } as User;
      (repo.findOne as jest.Mock).mockImplementation(() => Promise.resolve(stored));
      (repo.update as jest.Mock).mockImplementation((_id, data) => {
        Object.assign(stored, data);
        return Promise.resolve({ affected: 1, raw: [] });
      });

      const result = await service.reactivate(mockUserId);

      expect(repo.update).toHaveBeenCalledWith(mockUserId, { isActive: true });
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException for an unknown id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.reactivate('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should keep role and isActive and strip the password hash', async () => {
      (repo.find as jest.Mock).mockResolvedValue([mockUser, mockAdmin]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(result[0]).toHaveProperty('role', Role.USER);
      expect(result[0]).toHaveProperty('isActive', true);
      expect(result[1]).toHaveProperty('role', Role.ADMIN);
    });
  });
});
