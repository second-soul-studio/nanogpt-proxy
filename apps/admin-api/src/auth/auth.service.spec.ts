import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { SecurityService } from '../security/security.service';
import { TokenService } from '../security/token.service';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { LoginDto } from '../dtos/login.dto';
import { UsersService } from '../users/users.service';
import { ConfigurationTypes } from '../configuration/configuration.types';
import { RegisterUserDto } from '../dtos/register-user.dto';
import jwt from 'jsonwebtoken';

const makeUserRepoMock = () => ({
  getUser: jest.fn<Promise<UserEntity | null>, [string]>(),
  saveUser: jest.fn<Promise<void>, [UserEntity]>(),
});

const makeSecurityMock = () => ({
  hashPassword: jest.fn<Promise<string>, [string]>(),
  verifyPassword: jest.fn<Promise<boolean>, [string, string]>(),
});

const makeTokenMock = () => ({
  rotateTokens: jest.fn<Promise<{ accessToken: string; refreshToken: string }>, [UserEntity]>(),
  verifyRefreshToken: jest.fn<Promise<{ sub: string }>, [string]>(),
  blacklistAccessToken: jest.fn<Promise<void>, [string, number?]>(),
  revokeRefreshForUser: jest.fn<Promise<void>, [string]>(),
});

const makeEnvMock = () =>
  ({
    adminEmail: 'admin@example.com',
    adminPassword: 'bootstrap-secret',
  }) as Partial<EnvironmentService>;

const makeUsersServiceMock = () => ({
  createUser: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof makeUserRepoMock>;
  let security: ReturnType<typeof makeSecurityMock>;
  let tokens: ReturnType<typeof makeTokenMock>;
  let env: Partial<EnvironmentService>;
  let usersService: ReturnType<typeof makeUsersServiceMock>;

  beforeEach(async () => {
    userRepo = makeUserRepoMock();
    security = makeSecurityMock();
    tokens = makeTokenMock();
    env = makeEnvMock();
    usersService = makeUsersServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepo },
        { provide: SecurityService, useValue: security },
        { provide: TokenService, useValue: tokens },
        { provide: EnvironmentService, useValue: env },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('ensureBootstrapAdmin (indirect)', () => {
    it('should create bootstrap admin if adminEmail/adminPassword are set and no admin exists yet', async () => {
      /* Arrange */
      userRepo.getUser.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      security.hashPassword.mockResolvedValue('hashed-bootstrap');

      /* Act */
      await expect(
        service.login({ email: 'admin@example.com', password: 'whatever' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      /* Assert */
      expect(userRepo.getUser).toHaveBeenCalledWith('admin@example.com');
      expect(security.hashPassword).toHaveBeenCalledWith('bootstrap-secret');
      expect(userRepo.saveUser).toHaveBeenCalledWith(
        expect.objectContaining<UserEntity>({
          email: 'admin@example.com',
          role: 'ADMIN',
          enabled: true,
          password: 'hashed-bootstrap',
          api_key: '',
        }),
      );
    });

    it('should NOT create bootstrap admin when adminEmail/adminPassword are missing', async () => {
      /* Arrange */
      (env as any).adminEmail = undefined;
      (env as any).adminPassword = undefined;

      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      userRepo.getUser.mockResolvedValue(null);

      /* Act */
      await expect(
        service.login({ email: 'someone@example.com', password: 'pw' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      /* Assert */
      expect(warnSpy).toHaveBeenCalledWith(
        "ADMIN_EMAIL / ADMIN_PASSWORD not configured – admin bootstrap won't be created.",
      );
      expect(userRepo.saveUser).not.toHaveBeenCalled();
      expect(security.hashPassword).not.toHaveBeenCalled();
    });

    it('should not recreate admin if an ADMIN user already exists', async () => {
      /* Arrange */
      const existingAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser
        // ensureBootstrapAdmin
        .mockResolvedValueOnce(existingAdmin)
        // login
        .mockResolvedValueOnce(existingAdmin);

      security.verifyPassword.mockResolvedValue(true);
      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      /* Act */
      const result = await service.login({
        email: 'admin@example.com',
        password: 'secret',
      } as LoginDto);

      /* Assert */
      expect(userRepo.saveUser).not.toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });
  });

  describe('login', () => {
    it('should throw Unauthorized if user is not found or not enabled', async () => {
      /* Arrange */
      const bootstrapAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'x',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser.mockResolvedValueOnce(bootstrapAdmin).mockResolvedValueOnce(null);

      /* Act */
      await expect(
        service.login({ email: 'someone@example.com', password: 'pw' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      /* Assert */
      expect(security.verifyPassword).not.toHaveBeenCalled();
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
    });

    it('should throw Unauthorized if password is invalid', async () => {
      /* Arrange*/
      const bootstrapAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'x',
        api_key: '',
        role: 'ADMIN',
      };

      const loginUser: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser.mockResolvedValueOnce(bootstrapAdmin).mockResolvedValueOnce(loginUser);

      security.verifyPassword.mockResolvedValue(false);

      /* Act */
      await expect(
        service.login({ email: 'admin@example.com', password: 'bad' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      /* Assert */
      expect(security.verifyPassword).toHaveBeenCalledWith('bad', 'hashed');
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
    });

    it('should return tokens and user info when credentials are valid', async () => {
      /* Arrange */
      const bootstrapAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'x',
        api_key: '',
        role: 'ADMIN',
      };

      const loginUser: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser.mockResolvedValueOnce(bootstrapAdmin).mockResolvedValueOnce(loginUser);

      security.verifyPassword.mockResolvedValue(true);
      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      /* Act */
      const result = await service.login({
        email: 'admin@example.com',
        password: 'good',
      } as LoginDto);

      /* Assert */
      expect(tokens.rotateTokens).toHaveBeenCalledWith(loginUser);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });
  });

  describe('refresh', () => {
    it('should return new tokens if refresh token is valid and user is active', async () => {
      /* Arrange */
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'user@example.com' });

      const user: UserEntity = {
        enabled: true,
        email: 'user@example.com',
        password: 'hashed',
        api_key: 'enc-key',
        role: 'USER',
      };

      userRepo.getUser.mockResolvedValue(user);

      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      /* Act */
      const result = await service.refresh('refresh-token');

      /* Assert */
      expect(tokens.verifyRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(userRepo.getUser).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should throw Unauthorized if user is not found or disabled', async () => {
      /* Arrange */
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'ghost@example.com' });
      userRepo.getUser.mockResolvedValue(null);

      /* Act & Assert */
      await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);

      const disabledUser: UserEntity = {
        enabled: false,
        email: 'user@example.com',
        password: 'x',
        api_key: 'y',
        role: 'USER',
      };
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'user@example.com' });
      userRepo.getUser.mockResolvedValue(disabledUser);

      await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register', () => {
    const baseConfig: ConfigurationTypes = {
      forgetPassword: false,
      registration: true,
      reviewPendingRegistration: false,
    };

    it('should register an enabled user and return tokens when reviewPendingRegistration is false', async () => {
      /* Arrange */
      const dto: RegisterUserDto = {
        email: 'user@example.com',
        password: 'secret',
      };

      const config: ConfigurationTypes = {
        ...baseConfig,
        reviewPendingRegistration: false,
      };

      const user: UserEntity = {
        enabled: true,
        email: 'user@example.com',
        password: 'hashed',
        api_key: '',
        role: 'USER',
      };

      usersService.createUser.mockResolvedValue(undefined);
      userRepo.getUser.mockResolvedValue(user);
      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      /* Act */
      const result = await service.register(dto, config);

      /* Assert */
      expect(usersService.createUser).toHaveBeenCalledWith(
        {
          email: 'user@example.com',
          password: 'secret',
          api_key: '',
        },
        { enabled: true, role: 'USER' },
      );

      expect(tokens.rotateTokens).toHaveBeenCalledWith(user);
      expect(result).toEqual({
        email: 'user@example.com',
        role: 'USER',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should return pendingReview=true when reviewPendingRegistration is true', async () => {
      /* Arrange */
      const dto: RegisterUserDto = {
        email: 'user2@example.com',
        password: 'secret2',
      };

      const config: ConfigurationTypes = {
        ...baseConfig,
        reviewPendingRegistration: true,
      };

      const user: UserEntity = {
        enabled: false,
        email: 'user2@example.com',
        password: 'hashed2',
        api_key: '',
        role: 'USER',
      };

      usersService.createUser.mockResolvedValue(undefined);
      userRepo.getUser.mockResolvedValue(user);

      /* Act */
      const result = await service.register(dto, config);

      /* Assert */
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
      expect(result).toEqual({
        email: 'user2@example.com',
        role: 'USER',
        pendingReview: true,
      });
    });

    it('should throw InternalServerErrorException when user is not found after createUser', async () => {
      /* Arrange */
      const dto: RegisterUserDto = {
        email: 'ghost@example.com',
        password: 'secret',
      };

      const config: ConfigurationTypes = {
        ...baseConfig,
        reviewPendingRegistration: false,
      };

      usersService.createUser.mockResolvedValue(undefined);
      userRepo.getUser.mockResolvedValue(null);

      /* Act */
      await expect(service.register(dto, config)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      /* Assert */
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    const decodeSpy = jest.spyOn(jwt, 'decode');

    afterEach(() => {
      decodeSpy.mockReset();
    });

    it('should blacklist access token and revoke refresh token when payload is valid', async () => {
      /* Arrange */
      decodeSpy.mockReturnValue({
        sub: 'user@example.com',
        jti: 'jti-123',
        exp: 1234567890,
      });

      /* Act */
      await service.logout('access-token-value');

      /* Assert */
      expect(tokens.blacklistAccessToken).toHaveBeenCalledWith('jti-123', 1234567890);
      expect(tokens.revokeRefreshForUser).toHaveBeenCalledWith('user@example.com');
    });

    it('should do nothing if token is invalid or missing sub/jti', async () => {
      /* Arrange */
      decodeSpy.mockReturnValue(null);

      /* Act */
      await service.logout('bad-token');

      /* Assert */
      expect(tokens.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokens.revokeRefreshForUser).not.toHaveBeenCalled();

      decodeSpy.mockReturnValue({ sub: 'user@example.com' });
      await service.logout('another-token');

      expect(tokens.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokens.revokeRefreshForUser).not.toHaveBeenCalled();
    });
  });
});
