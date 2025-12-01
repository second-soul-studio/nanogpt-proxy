import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('[Redis ERROR]', err);
    });

    this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ==== String keys (JWT, blacklist, refresh, etc.) ====

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async exists(key: string): Promise<boolean> {
    const n = await this.client.exists(key);
    return n === 1;
  }

  // ==== Hash helpers (users, etc.) ====

  async setHash(key: string, value: Record<string, string>) {
    await this.client.hSet(key, value);
  }

  async getHash(key: string): Promise<Record<string, string> | null> {
    const data = await this.client.hGetAll(key);
    return Object.keys(data).length ? data : null;
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async scan(match: string): Promise<string[]> {
    const keys: string[] = [];

    for await (const item of this.client.scanIterator({ MATCH: match }) as AsyncIterable<unknown>) {
      if (typeof item === 'string') {
        keys.push(item);
      } else if (Array.isArray(item)) {
        // Falls Redis libs mal batched output bringen
        for (const s of item) keys.push(s);
      }
    }

    return keys;
  }
}
