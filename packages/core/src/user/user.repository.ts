import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { UserEntity } from '../entities/user-entity';

const PREFIX = 'usermapping:nanogpt:simple';

@Injectable()
export class UserRepository {
  constructor(private readonly redis: RedisService) {}

  async getUser(email: string): Promise<UserEntity | null> {
    const key = this.keyFor(email);
    const user = await this.redis.getHash(key);
    if (!user) {
      return null;
    }

    return {
      enabled: user.enabled === 'true',
      email: user.email,
      password: user.password,
      api_key: user.api_key,
      role: user.role,
    };
  }

  async saveUser(user: UserEntity) {
    const key = this.keyFor(user.email);
    await this.redis.setHash(key, {
      email: user.email,
      password: user.password,
      api_key: user.api_key,
      role: user.role,
      enabled: String(user.enabled),
    });
  }

  async upsertApiKey(email: string, apiKey: string) {
    const key = this.keyFor(email);
    const existing = await this.redis.getHash(key);

    const user: UserEntity = {
      email,
      api_key: apiKey,
      password: existing?.password ?? '',
      role: existing?.role ?? 'USER',
      enabled: (existing?.enabled ?? 'true') === 'true',
    };

    await this.saveUser(user);
  }

  async deleteUser(email: string) {
    const key = this.keyFor(email);
    await this.redis.del(key);
  }

  async getAllUsers(): Promise<Omit<UserEntity, 'password'>[]> {
    const keys = await this.redis.scan(`${PREFIX}:*`);

    if (keys.length === 0) {
      return [];
    }

    const results = await Promise.all(
      keys.map(async (key) => {
        const data = await this.redis.getHash(key);

        if (!data) {
          return null;
        }

        return {
          email: data.email,
          api_key: data.api_key,
          role: data.role,
          enabled: data.enabled === 'true',
        } as Omit<UserEntity, 'password'>;
      }),
    );

    return results.filter((u): u is Omit<UserEntity, 'password'> => u !== null);
  }

  private keyFor(email: string) {
    return `${PREFIX}:${this.canonical(email)}`;
  }

  private canonical(email: string) {
    return email.trim().toLowerCase();
  }
}
