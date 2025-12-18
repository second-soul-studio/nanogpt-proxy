import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentService, RedisService } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { TokenService } from './token.service';
import { JWT_TYPE } from '@nanogpt-monorepo/core/dist/enums/jwt-type';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

describe('TokenService', () => {
  let service: TokenService;
  let redis: jest.Mocked<RedisService>;
  let env: Partial<EnvironmentService> & {
    jwtSecret: string;
    jwtExpiresIn: string | number;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string | number;
    jwtBlacklistTtlSeconds: number;
  };

  const user: UserEntity = {
    email: 'user@example.com',
    password: 'hashed',
    api_key: 'encrypted',
    role: 'ADMIN',
    enabled: true,
  };

  beforeEach(async () => {
    redis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    env = {
      jwtSecret: 'access-secret',
      jwtExpiresIn: '1h',
      jwtRefreshSecret: 'refresh-secret',
      jwtRefreshExpiresIn: '7d',
      jwtBlacklistTtlSeconds: 86_400,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: RedisService, useValue: redis },
        { provide: EnvironmentService, useValue: env },
      ],
    }).compile();

    service = module.get(TokenService);
  });

  it('createAccessToken - should generate a token with correct fields', async () => {
    /* Act */
    const token = service.createAccessToken({ email: user.email, role: user.role });
    const decoded = jwt.verify(token, env.jwtSecret) as any;

    /* Assert */
    expect(decoded.sub).toBe(user.email);
    expect(decoded.r).toEqual([user.role]);
    expect(decoded.type).toBe(JWT_TYPE.ACCESS);
    expect(typeof decoded.jti).toBe('string');
  });

  it('verifyAccessToken - should return payload when token is valid', async () => {
    /* Act */
    const token = service.createAccessToken({ email: user.email, role: user.role });
    const payload = service.verifyAccessToken(token);

    /* Assert */
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(user.email);
    expect(payload?.type).toBe(JWT_TYPE.ACCESS);
  });

  it('verifyAccessToken - should throw UnauthorizedException when token type is not ACCESS', () => {
    /* Act */
    const badToken = jwt.sign({ sub: user.email, type: JWT_TYPE.REFRESH }, env.jwtSecret, {
      expiresIn: '1h',
    });

    /* Assert */
    expect(() => service.verifyAccessToken(badToken)).toThrow(UnauthorizedException);
  });

  it('verifyAccessToken - should throw UnauthorizedException with "Token expired" when token is expired', () => {
    /* Arrange */
    const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new TokenExpiredError('jwt expired', new Date());
    });

    /* Act */
    let caught: unknown;
    try {
      service.verifyAccessToken('expired-token');
    } catch (err) {
      caught = err;
    }

    /* Assert */
    expect(caught).toBeInstanceOf(UnauthorizedException);
    expect((caught as UnauthorizedException).message).toBe('Token expired');

    verifySpy.mockRestore();
  });

  it('verifyAccessToken - should rethrow non TokenExpiredError errors', () => {
    /* Act */
    const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('boom');
    });

    /* Assert */
    expect(() => service.verifyAccessToken('bad-token')).toThrow('boom');

    verifySpy.mockRestore();
  });

  it('createRefreshToken - should store the token in Redis with TTL', async () => {
    /* Act */
    redis.set.mockResolvedValueOnce(undefined);
    const token = await service.createRefreshToken(user);

    /* Assert */
    expect(typeof token).toBe('string');
    expect(redis.set).toHaveBeenCalledTimes(1);
    const [key, storedToken, ttl] = redis.set.mock.calls[0];
    expect(key).toContain('jwt:nanogpt:refresh:');
    expect(storedToken).toBe(token);
    expect(ttl).toBeGreaterThan(0);
  });

  it('verifyRefreshToken - should return payload if token is valid and matches Redis', async () => {
    /* Act */
    const token = await service.createRefreshToken(user);
    redis.get.mockResolvedValueOnce(token);

    /* Assert */
    const payload = await service.verifyRefreshToken(token);
    expect(payload.sub).toBe(user.email);
    expect(payload.type).toBe(JWT_TYPE.REFRESH);
  });

  it('verifyRefreshToken - should throw BadRequestException if type is not REFRESH', async () => {
    /* Act */
    const badToken = jwt.sign({ sub: user.email, type: JWT_TYPE.ACCESS }, env.jwtRefreshSecret);

    /* Act & Assert */
    await expect(service.verifyRefreshToken(badToken)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('verifyRefreshToken - should throw UnauthorizedException if token not found or mismatch in Redis', async () => {
    /* Act */
    const token = await service.createRefreshToken(user);
    redis.get.mockResolvedValueOnce(null);

    /* Act & Assert */
    await expect(service.verifyRefreshToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotateTokens - should return both access and refresh tokens', async () => {
    /* Arrange */
    const spyCreateAccess = jest.spyOn(service, 'createAccessToken');
    const spyCreateRefresh = jest.spyOn(service, 'createRefreshToken');

    /* Act */
    const { accessToken, refreshToken } = await service.rotateTokens(user);

    /* Assert */
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    expect(spyCreateAccess).toHaveBeenCalled();
    expect(spyCreateRefresh).toHaveBeenCalled();
  });

  it('blacklistAccessToken - should add jti to blacklist in Redis', async () => {
    /* Arrange */
    redis.set.mockResolvedValueOnce(undefined);

    /* Act */
    await service.blacklistAccessToken('jti-123', undefined);

    /* Assert */
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('jwt:nanogpt:blacklist:'),
      '1',
      env.jwtBlacklistTtlSeconds,
    );
  });

  it('blacklistAccessToken - should use remaining time when expUnixSeconds is smaller than default TTL', async () => {
    /* Arrange */
    redis.set.mockResolvedValueOnce(undefined);

    const nowSeconds = 1_000;
    jest.spyOn(Date, 'now').mockReturnValue(nowSeconds * 1000);

    const expUnixSeconds = nowSeconds + 1800; // 30 minutes
    /* Act */
    await service.blacklistAccessToken('jti-short', expUnixSeconds);

    /* Assert */
    expect(redis.set).toHaveBeenCalledWith('jwt:nanogpt:blacklist:jti-short', '1', 1800);
  });

  it('isBlacklisted - should return true if Redis contains "1"', async () => {
    /* Arrange */
    redis.get.mockResolvedValueOnce('1');

    /* Act */
    const result = await service.isBlacklisted('jti-x');

    /* Assert */
    expect(redis.get).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('isBlacklisted - should return false if key is missing or not "1"', async () => {
    /* Arrange */
    redis.get.mockResolvedValueOnce(null);

    /* Act */
    const result = await service.isBlacklisted('jti-x');

    /* Assert */
    expect(result).toBe(false);
  });

  it('revokeRefreshForUser - should delete refresh key from Redis', async () => {
    /* Arrange */
    redis.del.mockResolvedValueOnce(undefined);

    /* Act */
    await service.revokeRefreshForUser(user.email);

    /* Assert */
    expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('jwt:nanogpt:refresh:'));
  });

  it('private helpers - should build keys and TTL correctly', () => {
    /* Act */
    const anyService = service as any;

    /* Assert */
    expect(anyService.blacklistKeyFor('abc')).toBe('jwt:nanogpt:blacklist:abc');
    expect(anyService.refreshKeyFor('USER@Example.com')).toBe(
      'jwt:nanogpt:refresh:user@example.com',
    );
    expect(anyService.refreshTtlSeconds()).toBe(7 * 24 * 60 * 60);
  });
});
