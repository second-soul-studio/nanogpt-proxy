import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { EnvironmentService, RedisService } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { JwtAccessTokenPayload } from '@nanogpt-monorepo/core/dist/types/jwt-access-token-payload';
import { JwtType } from '@nanogpt-monorepo/core/dist/enums/jwt-type';
import { JwtRefreshTokenPayload } from '@nanogpt-monorepo/core/dist/types/jwt-refresh-token-payload';

const PREFIX = 'jwt:nanogpt';

@Injectable()
export class TokenService {
  constructor(
    private readonly env: EnvironmentService,
    private readonly redis: RedisService,
  ) {}

  createAccessToken(user: Pick<UserEntity, 'email' | 'role'>): string {
    const payload: JwtAccessTokenPayload = {
      sub: user.email,
      r: [user.role],
      jti: randomUUID(),
      type: JwtType.ACCESS,
    };

    return jwt.sign(payload, this.env.jwtSecret, {
      expiresIn: this.env.jwtExpiresIn,
    });
  }

  verifyAccessToken(token: string): JwtAccessTokenPayload {
    const payload = jwt.verify(token, this.env.jwtSecret) as JwtAccessTokenPayload;

    if (payload.type !== JwtType.ACCESS) {
      throw new BadRequestException('Invalid token type');
    }

    return payload;
  }

  async createRefreshToken(user: UserEntity): Promise<string> {
    const payload: JwtRefreshTokenPayload = {
      sub: user.email,
      jti: randomUUID(),
      type: JwtType.REFRESH,
    };

    const options: SignOptions = {
      expiresIn: this.env.jwtRefreshExpiresIn,
    };

    const token = jwt.sign(payload, this.env.jwtRefreshSecret, options);

    const key = this.refreshKeyFor(user.email);
    await this.redis.set(key, token, this.refreshTtlSeconds());

    return token;
  }

  async verifyRefreshToken(token: string): Promise<JwtRefreshTokenPayload> {
    const payload = jwt.verify(token, this.env.jwtRefreshSecret) as JwtRefreshTokenPayload;
    if (payload.type !== JwtType.REFRESH) {
      throw new BadRequestException('Invalid token type');
    }

    const key = this.refreshKeyFor(payload.sub);
    const stored = await this.redis.get(key);

    if (!stored || stored !== token) {
      throw new BadRequestException('Refresh token revoked or not found');
    }

    return payload;
  }

  async rotateTokens(user: UserEntity): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);
    return { accessToken, refreshToken };
  }

  async blacklistAccessToken(jti: string, expUnixSeconds?: number): Promise<void> {
    const key = this.blacklistKeyFor(jti);

    let ttl = this.env.jwtBlacklistTtlSeconds;
    if (expUnixSeconds) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = expUnixSeconds - now;
      if (remaining > 0) {
        ttl = Math.min(remaining, this.env.jwtBlacklistTtlSeconds);
      }
    }

    await this.redis.set(key, '1', ttl);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const key = this.blacklistKeyFor(jti);
    const val = await this.redis.get(key);
    return val === '1';
  }

  async revokeRefreshForUser(email: string): Promise<void> {
    const key = this.refreshKeyFor(email);
    await this.redis.del(key);
  }

  private blacklistKeyFor(jti: string) {
    return `${PREFIX}:blacklist:${jti}`;
  }

  private refreshKeyFor(email: string) {
    return `${PREFIX}:refresh:${email.trim().toLowerCase()}`;
  }

  private refreshTtlSeconds(): number {
    return 7 * 24 * 60 * 60;
  }
}
