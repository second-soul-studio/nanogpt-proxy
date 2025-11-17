import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface UserEntity {
    email: string;
    api_key: string;
}

const PREFIX = 'usermapping:nanogpt:simple';

@Injectable()
export class UserRepository {
    constructor(private readonly redis: RedisService) { }

    async getUser(email: string): Promise<UserEntity | null> {
        const key = this.keyFor(email);
        const data = await this.redis.getHash(key);
        if (!data) return null;

        return {
            email: data.email,
            api_key: data.api_key,
        };
    }

    async saveUser(user: UserEntity) {
        const key = this.keyFor(user.email);
        await this.redis.setHash(key, {
            email: user.email,
            api_key: user.api_key,
        });
    }

    async deleteUser(email: string) {
        const key = this.keyFor(email);
        await this.redis.del(key);
    }

    async getAllUsers(): Promise<UserEntity[]> {
        const keys = await this.redis.scan(`${PREFIX}:*`);
        const out: UserEntity[] = [];

        for (const key of keys) {
            const data = await this.redis.getHash(key);
            if (data) {
                out.push({
                    email: data.email,
                    api_key: data.api_key,
                });
            }
        }

        return out;
    }

    private keyFor(email: string) {
        return `${PREFIX}:${this.canonical(email)}`;
    }

    private canonical(email: string) {
        return email.trim().toLowerCase();
    }
}
