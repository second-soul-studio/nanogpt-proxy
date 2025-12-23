import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CryptorService, EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { UsersService } from './users.service';
import { SecurityService } from '../security/security.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { DeleteUserDto } from '../dtos/delete-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

jest.mock('../mappers/user.mapper', () => ({
  toNewUserEntity: jest.fn(),
  toUpdatedUserEntity: jest.fn(),
}));

jest.mock('@nanogpt-monorepo/core/dist/utilities/masking.utils', () => ({
  maskEmail: jest.fn((email: string) => `masked:${email}`),
}));

import { toNewUserEntity, toUpdatedUserEntity } from '../mappers/user.mapper';
import { maskEmail } from '@nanogpt-monorepo/core/dist/utilities/masking.utils';
import { mockUsers } from '../__tests__/user.dto.mock';
import { PaginationQueryDto } from '@nanogpt-monorepo/core/dist/pagination/pagination-query.dto';
import { UsersDto } from '../dtos/users.dto';

describe('UsersService', () => {
  let service: UsersService;
  let cryptor: jest.Mocked<CryptorService>;
  let env: { adminEmail: string } & Partial<EnvironmentService>;
  let repo: jest.Mocked<UserRepository>;
  let security: jest.Mocked<SecurityService>;

  const baseUser: UserEntity = {
    email: 'user@example.com',
    password: 'hashed',
    api_key: 'encrypted-key',
    role: 'USER',
    enabled: true,
  };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  beforeEach(async () => {
    cryptor = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as unknown as jest.Mocked<CryptorService>;

    env = {
      adminEmail: 'admin@example.com',
    };

    repo = {
      getUser: jest.fn(),
      saveUser: jest.fn(),
      deleteUser: jest.fn(),
      upsertApiKey: jest.fn(),
      getAllUsers: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    security = {
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
    } as unknown as jest.Mocked<SecurityService>;

    (toNewUserEntity as jest.Mock).mockReset();
    (toUpdatedUserEntity as jest.Mock).mockReset();
    (maskEmail as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: CryptorService, useValue: cryptor },
        { provide: EnvironmentService, useValue: env },
        { provide: UserRepository, useValue: repo },
        { provide: SecurityService, useValue: security },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('createUser - create a new user', async () => {
    const dto: CreateUserDto = {
      email: 'new@example.com',
      password: 'plain',
      api_key: 'plain-key',
    };

    repo.getUser.mockResolvedValueOnce(null);
    security.hashPassword.mockResolvedValueOnce('hashed-pass');
    cryptor.encrypt.mockReturnValueOnce('encrypted-key');
    (toNewUserEntity as jest.Mock).mockReturnValueOnce({
      ...baseUser,
      email: dto.email,
      password: 'hashed-pass',
      api_key: 'encrypted-key',
    });

    await service.createUser(dto);

    expect(repo.getUser).toHaveBeenCalledWith(dto.email);
    expect(security.hashPassword).toHaveBeenCalledWith(dto.password);
    expect(cryptor.encrypt).toHaveBeenCalledWith(dto.api_key);
    expect(toNewUserEntity).toHaveBeenCalledWith(dto, {
      passwordHash: 'hashed-pass',
      apiKeyEncrypted: 'encrypted-key',
      defaultRole: 'USER',
      enabled: true,
    });
    expect(repo.saveUser).toHaveBeenCalledTimes(1);
    expect(maskEmail).toHaveBeenCalledWith(dto.email);
  });

  it('createUser - raise ConflictException if user exists', async () => {
    const dto: CreateUserDto = {
      email: baseUser.email,
      password: 'x',
      api_key: 'y',
    };
    repo.getUser.mockResolvedValueOnce(baseUser);

    await expect(service.createUser(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(repo.saveUser).not.toHaveBeenCalled();
  });

  it('deleteUser - raise BadRequest if user does not exists', async () => {
    const dto: DeleteUserDto = { email: 'ghost@example.com' };
    repo.getUser.mockResolvedValueOnce(null);

    await expect(service.deleteUser(dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deleteUser - raise BadRequest if user is the admin bootstrap', async () => {
    const dto: DeleteUserDto = { email: env.adminEmail };
    const adminUser: UserEntity = {
      ...baseUser,
      email: env.adminEmail,
      role: 'ADMIN',
    };
    repo.getUser.mockResolvedValueOnce(adminUser);

    await expect(service.deleteUser(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.deleteUser).not.toHaveBeenCalled();
  });

  it('deleteUser - delete an user', async () => {
    const dto: DeleteUserDto = { email: baseUser.email };
    repo.getUser.mockResolvedValueOnce(baseUser);

    await service.deleteUser(dto);

    expect(repo.deleteUser).toHaveBeenCalledWith(dto.email);
    expect(maskEmail).toHaveBeenCalledWith(dto.email);
  });

  it('updateUser - raise BadRequest if user does not exists', async () => {
    const dto: UpdateUserDto = { email: 'nope@example.com' };
    repo.getUser.mockResolvedValueOnce(null);

    await expect(service.updateUser(dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateUser - cannot downgrade admin bootstrap', async () => {
    const dto: UpdateUserDto = {
      email: env.adminEmail,
      role: 'USER',
    };
    const adminUser: UserEntity = {
      ...baseUser,
      email: env.adminEmail,
      role: 'ADMIN',
    };
    repo.getUser.mockResolvedValueOnce(adminUser);

    await expect(service.updateUser(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.saveUser).not.toHaveBeenCalled();
  });

  it('updateUser - update password and api key', async () => {
    const dto: UpdateUserDto = {
      email: baseUser.email,
      password: 'new-pass',
      api_key: 'new-key',
      role: 'ADMIN',
      enabled: false,
    };

    repo.getUser.mockResolvedValueOnce(baseUser);
    security.hashPassword.mockResolvedValueOnce('new-hash');
    cryptor.encrypt.mockReturnValueOnce('new-encrypted');
    (toUpdatedUserEntity as jest.Mock).mockReturnValueOnce({
      ...baseUser,
      password: 'new-hash',
      api_key: 'new-encrypted',
      role: 'ADMIN',
      enabled: false,
    });

    await service.updateUser(dto);

    expect(security.hashPassword).toHaveBeenCalledWith('new-pass');
    expect(cryptor.encrypt).toHaveBeenCalledWith('new-key');
    expect(toUpdatedUserEntity).toHaveBeenCalledWith(dto, baseUser, {
      passwordHash: 'new-hash',
      apiKeyEncrypted: 'new-encrypted',
    });
    expect(repo.saveUser).toHaveBeenCalledTimes(1);
    expect(maskEmail).toHaveBeenCalledWith(dto.email);
  });

  it('updateUser - partial update (without password / api key)', async () => {
    const dto: UpdateUserDto = {
      email: baseUser.email,
      enabled: false,
    };

    repo.getUser.mockResolvedValueOnce(baseUser);
    (toUpdatedUserEntity as jest.Mock).mockReturnValueOnce({
      ...baseUser,
      enabled: false,
    });

    await service.updateUser(dto);

    expect(security.hashPassword).not.toHaveBeenCalled();
    expect(cryptor.encrypt).not.toHaveBeenCalled();
    expect(toUpdatedUserEntity).toHaveBeenCalledWith(dto, baseUser, {
      passwordHash: undefined,
      apiKeyEncrypted: undefined,
    });
    expect(repo.saveUser).toHaveBeenCalledTimes(1);
  });

  it('upsertKey - raise BadRequest if user does not exists', async () => {
    const dto: UpdateUserDto = { email: 'ghost@example.com', api_key: 'x' };
    repo.getUser.mockResolvedValueOnce(null);

    await expect(service.upsertKey(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.upsertApiKey).not.toHaveBeenCalled();
  });

  it('upsertKey - raise BadRequest if api key is missing', async () => {
    const dto: UpdateUserDto = { email: baseUser.email };
    repo.getUser.mockResolvedValueOnce(baseUser);

    await expect(service.upsertKey(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.upsertApiKey).not.toHaveBeenCalled();
  });

  it('upsertKey - should update when user and api key is valid', async () => {
    const dto: UpdateUserDto = { email: baseUser.email, api_key: 'raw-key' };
    repo.getUser.mockResolvedValueOnce(baseUser);

    await service.upsertKey(dto);

    expect(repo.upsertApiKey).toHaveBeenCalledWith(dto.email, dto.api_key);
    expect(maskEmail).toHaveBeenCalledWith(dto.email);
  });

  describe('listUsers', () => {
    const asUserEntities = (dtos: UsersDto[]): Omit<UserEntity, 'password'>[] =>
      dtos.map((u) => ({
        email: u.email,
        role: u.role,
        enabled: u.enabled,
        api_key: '',
      }));

    it('should return all users in a single page with default pagination', async () => {
      /* Arrange */
      const userEntities = asUserEntities(mockUsers);
      repo.getAllUsers.mockResolvedValue(userEntities);

      const query = {} as PaginationQueryDto;

      /* Act */
      const result = await service.listUsers(query);

      /* Assert */
      expect(repo.getAllUsers).toHaveBeenCalledTimes(1);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalItems).toBe(9);
      expect(result.meta.totalPages).toBe(1);

      expect(result.data).toHaveLength(9);

      const emails = result.data.map((u) => u.email);
      expect(emails).toEqual([
        'admin@second-soul.io',
        'ani@second-soul.io',
        'anina@second-soul.io',
        'brian@second-soul.io',
        'chris@second-soul.io',
        'jill@second-soul.io',
        'lauren@second-soul.io',
        'laurie@second-soul.io',
        'patrick@second-soul.io',
      ]);
    });

    it('should return the correct slice for page 2 with limit 3', async () => {
      /* Arrange */
      const userEntities = asUserEntities(mockUsers);
      repo.getAllUsers.mockResolvedValue(userEntities);

      const query: PaginationQueryDto = {
        page: 2,
        limit: 3,
      } as PaginationQueryDto;

      /* Act */
      const result = await service.listUsers(query);

      /* Assert */
      expect(repo.getAllUsers).toHaveBeenCalledTimes(1);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(3);
      expect(result.meta.totalItems).toBe(9);
      expect(result.meta.totalPages).toBe(3);

      const emails = result.data.map((u) => u.email);
      expect(emails).toEqual([
        'brian@second-soul.io',
        'chris@second-soul.io',
        'jill@second-soul.io',
      ]);
    });

    it('should fallback to defaults when page/limit are invalid', async () => {
      /* Arrange */
      const userEntities = asUserEntities(mockUsers);
      repo.getAllUsers.mockResolvedValue(userEntities);

      const query: any = {
        page: 0,
        limit: -10,
      };

      /* Act */
      const result = await service.listUsers(query);

      /* Assert */
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalItems).toBe(9);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
