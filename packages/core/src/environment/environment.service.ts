import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Secret, SignOptions } from 'jsonwebtoken';

@Injectable()
export class EnvironmentService {
  constructor(private readonly config: ConfigService) {}

  private getRequired<T = string>(key: string): T {
    const value = this.config.get<T>(key);
    if (value === undefined || value === null) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private getOptional<T = string>(key: string, defaultValue?: T): T {
    const value = this.config.get<T>(key);
    return (value ?? defaultValue) as T;
  }

  get adminEmail(): string {
    return this.getRequired<string>('ADMIN_EMAIL');
  }

  get adminPassword(): string {
    return this.getRequired<string>('ADMIN_PASSWORD');
  }

  get dbEncryptionKey(): string {
    return this.getRequired<string>('DB_ENCRYPTION_KEY');
  }

  get jwtBlacklistTtlSeconds(): number {
    return Number(this.config.get<number>('JWT_BLACKLIST_TTL_SECONDS', 86400));
  }

  get jwtExpiresIn(): SignOptions['expiresIn'] {
    return this.getRequired<string>('JWT_EXPIRES_IN') as SignOptions['expiresIn'];
  }

  get jwtRefreshExpiresIn(): SignOptions['expiresIn'] {
    return this.getRequired('JWT_REFRESH_EXPIRES_IN') as SignOptions['expiresIn'];
  }

  get jwtRefreshSecret(): Secret {
    return this.getRequired<string>('JWT_REFRESH_SECRET');
  }

  get jwtSecret(): Secret {
    return this.getRequired<string>('JWT_SECRET');
  }

  get proxyPort(): number {
    return this.getOptional<number>('PROXY_PORT', 3000);
  }
}
