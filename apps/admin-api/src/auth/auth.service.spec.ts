import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { SecurityService } from '../security/security.service';
import { TokenService } from '../security/token.service';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import jwt from 'jsonwebtoken';
import { LoginDto } from '../dtos/login.dto';

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

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof makeUserRepoMock>;
  let security: ReturnType<typeof makeSecurityMock>;
  let tokens: ReturnType<typeof makeTokenMock>;
  let env: Partial<EnvironmentService>;

  beforeEach(async () => {
    userRepo = makeUserRepoMock();
    security = makeSecurityMock();
    tokens = makeTokenMock();
    env = makeEnvMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepo },
        { provide: SecurityService, useValue: security },
        { provide: TokenService, useValue: tokens },
        { provide: EnvironmentService, useValue: env },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('ensureBootstrapAdmin (indirect)', () => {
    it('should create bootstrap admin if adminEmail/adminPassword are set and no admin exists yet', async () => {
      userRepo.getUser.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      security.hashPassword.mockResolvedValue('hashed-bootstrap');

      await expect(
        service.login({ email: 'admin@example.com', password: 'whatever' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

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

    it('should not recreate admin if an ADMIN user already exists', async () => {
      const existingAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'hashed',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser.mockResolvedValueOnce(existingAdmin).mockResolvedValueOnce(existingAdmin);

      security.verifyPassword.mockResolvedValue(true);
      tokens.rotateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.login({
        email: 'admin@example.com',
        password: 'secret',
      } as LoginDto);

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
    it('should throw Unauthorized if user is not found or not an ADMIN', async () => {
      const bootstrapAdmin: UserEntity = {
        enabled: true,
        email: 'admin@example.com',
        password: 'x',
        api_key: '',
        role: 'ADMIN',
      };

      userRepo.getUser.mockResolvedValueOnce(bootstrapAdmin).mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'someone@example.com', password: 'pw' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(security.verifyPassword).not.toHaveBeenCalled();
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
    });

    it('should throw Unauthorized if password is invalid', async () => {
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

      await expect(
        service.login({ email: 'admin@example.com', password: 'bad' } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(security.verifyPassword).toHaveBeenCalledWith('bad', 'hashed');
      expect(tokens.rotateTokens).not.toHaveBeenCalled();
    });

    it('should return tokens and user info when credentials are valid', async () => {
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

      const result = await service.login({
        email: 'admin@example.com',
        password: 'good',
      } as LoginDto);

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

      const result = await service.refresh('refresh-token');

      expect(tokens.verifyRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(userRepo.getUser).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should throw Unauthorized if user is not found or disabled', async () => {
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'ghost@example.com' });
      userRepo.getUser.mockResolvedValue(null);

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

  describe('logout', () => {
    const decodeSpy = jest.spyOn(jwt, 'decode');

    afterEach(() => {
      decodeSpy.mockReset();
    });

    it('should blacklist access token and revoke refresh token when payload is valid', async () => {
      decodeSpy.mockReturnValue({
        sub: 'user@example.com',
        jti: 'jti-123',
        exp: 1234567890,
      });

      await service.logout('access-token-value');

      expect(tokens.blacklistAccessToken).toHaveBeenCalledWith('jti-123', 1234567890);
      expect(tokens.revokeRefreshForUser).toHaveBeenCalledWith('user@example.com');
    });

    it('should do nothing if token is invalid or missing sub/jti', async () => {
      decodeSpy.mockReturnValue(null);

      await service.logout('bad-token');

      expect(tokens.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokens.revokeRefreshForUser).not.toHaveBeenCalled();

      decodeSpy.mockReturnValue({ sub: 'user@example.com' });
      await service.logout('another-token');

      expect(tokens.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokens.revokeRefreshForUser).not.toHaveBeenCalled();
    });
  });
});
