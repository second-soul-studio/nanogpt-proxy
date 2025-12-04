import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { DeleteUserDto } from '../dtos/delete-user.dto';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    createUser: jest.fn(),
    getAll: jest.fn(),
    updateUser: jest.fn(),
    upsertKey: jest.fn(),
    deleteUser: jest.fn(),
  } satisfies Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should delegate to UsersService.createUser', async () => {
      const dto: CreateUserDto = {
        email: 'user@example.com',
        password: 'secret',
        api_key: 'some-key',
      };

      await controller.createUser(dto);

      expect(usersServiceMock.createUser).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.createUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('listUsers', () => {
    it('should return result from UsersService.getAll', async () => {
      const users: Omit<UserEntity, 'password'>[] = [
        {
          enabled: true,
          email: 'user@example.com',
          api_key: 'encrypted',
          role: 'ADMIN',
        },
      ];

      usersServiceMock.getAll.mockResolvedValue(users);

      const result = await controller.listUsers();

      expect(usersServiceMock.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });
  });

  describe('updateUser', () => {
    it('should delegate to UsersService.updateUser', async () => {
      const dto: UpdateUserDto = {
        email: 'user@example.com',
        password: 'new-secret',
        api_key: 'new-key',
        role: 'USER',
        enabled: true,
      };

      await controller.updateUser(dto);

      expect(usersServiceMock.updateUser).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.updateUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('upsertKey', () => {
    it('should delegate to UsersService.upsertKey', async () => {
      const dto: UpdateUserDto = {
        email: 'user@example.com',
        api_key: 'rotated-key',
      };

      await controller.upsertKey(dto);

      expect(usersServiceMock.upsertKey).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.upsertKey).toHaveBeenCalledWith(dto);
    });
  });

  describe('deleteUser', () => {
    it('should delegate to UsersService.deleteUser', async () => {
      const dto: DeleteUserDto = {
        email: 'user@example.com',
      };

      await controller.deleteUser(dto);

      expect(usersServiceMock.deleteUser).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.deleteUser).toHaveBeenCalledWith(dto);
    });
  });
});
