import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { EnvironmentService } from '../environment/environment.service';

@Injectable()
export class CryptorService {
    private readonly key: Buffer;

    constructor(env: EnvironmentService) {
        this.key = Buffer.from(env.dbEncryptionKey, 'hex');
    }

    encrypt(data: string | Buffer): string {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
        const iv = crypto.randomBytes(12);

        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([cipher.update(buf), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([iv, tag, encrypted]).toString('base64');
    }

    decrypt(payload: string): string {
        const blob = Buffer.from(payload, 'base64');
        const iv = blob.subarray(0, 12);
        const tag = blob.subarray(12, 28);
        const data = blob.subarray(28);

        const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    }
}
