import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentService, RedisService } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { TokenService } from './token.service';
import { JwtType } from '@nanogpt-monorepo/core/dist/enums/jwt-type';
import jwt from 'jsonwebtoken';

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
    const token = service.createAccessToken({ email: user.email, role: user.role });
    const decoded = jwt.verify(token, env.jwtSecret) as any;

    expect(decoded.sub).toBe(user.email);
    expect(decoded.r).toEqual([user.role]);
    expect(decoded.type).toBe(JwtType.ACCESS);
    expect(typeof decoded.jti).toBe('string');
  });

  it('verifyAccessToken - should return payload when token is valid', async () => {
    const token = service.createAccessToken({ email: user.email, role: user.role });
    const payload = service.verifyAccessToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(user.email);
    expect(payload?.type).toBe(JwtType.ACCESS);
  });

  it('createRefreshToken - should store the token in Redis with TTL', async () => {
    redis.set.mockResolvedValueOnce(undefined);
    const token = await service.createRefreshToken(user);

    expect(typeof token).toBe('string');
    expect(redis.set).toHaveBeenCalledTimes(1);
    const [key, storedToken, ttl] = redis.set.mock.calls[0];
    expect(key).toContain('jwt:nanogpt:refresh:');
    expect(storedToken).toBe(token);
    expect(ttl).toBeGreaterThan(0);
  });

  it('verifyRefreshToken - should return payload if token is valid and matches Redis', async () => {
    const token = await service.createRefreshToken(user);
    redis.get.mockResolvedValueOnce(token);

    const payload = await service.verifyRefreshToken(token);
    expect(payload.sub).toBe(user.email);
    expect(payload.type).toBe(JwtType.REFRESH);
  });

  it('verifyRefreshToken - should throw BadRequestException if type is not REFRESH', async () => {
    const badToken = jwt.sign({ sub: user.email, type: JwtType.ACCESS }, env.jwtRefreshSecret);
    await expect(service.verifyRefreshToken(badToken)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('verifyRefreshToken - should throw BadRequestException if token not found or mismatch in Redis', async () => {
    const token = await service.createRefreshToken(user);
    redis.get.mockResolvedValueOnce(null);

    await expect(service.verifyRefreshToken(token)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rotateTokens - should return both access and refresh tokens', async () => {
    const spyCreateAccess = jest.spyOn(service, 'createAccessToken');
    const spyCreateRefresh = jest.spyOn(service, 'createRefreshToken');

    const { accessToken, refreshToken } = await service.rotateTokens(user);

    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    expect(spyCreateAccess).toHaveBeenCalled();
    expect(spyCreateRefresh).toHaveBeenCalled();
  });

  it('blacklistAccessToken - should add jti to blacklist in Redis', async () => {
    redis.set.mockResolvedValueOnce(undefined);
    await service.blacklistAccessToken('jti-123', undefined);

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('jwt:nanogpt:blacklist:'),
      '1',
      env.jwtBlacklistTtlSeconds,
    );
  });

  it('isBlacklisted - should return true if Redis contains "1"', async () => {
    redis.get.mockResolvedValueOnce('1');
    const result = await service.isBlacklisted('jti-x');

    expect(redis.get).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('isBlacklisted - should return false if key is missing or not "1"', async () => {
    redis.get.mockResolvedValueOnce(null);
    const result = await service.isBlacklisted('jti-x');

    expect(result).toBe(false);
  });

  it('revokeRefreshForUser - should delete refresh key from Redis', async () => {
    redis.del.mockResolvedValueOnce(undefined);
    await service.revokeRefreshForUser(user.email);

    expect(redis.del).toHaveBeenCalledWith(expect.stringContaining('jwt:nanogpt:refresh:'));
  });
});
