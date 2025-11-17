import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
    constructor(private readonly config: ConfigService) { }

    get dbEncryptionKey(): string {
        return this.config.get<string>('DB_ENCRYPTION_KEY')!;
    }

    get proxyPort(): number {
        return this.config.get<number>('PROXY_PORT', 3000);
    }
}
