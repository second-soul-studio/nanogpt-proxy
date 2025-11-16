import crypto from 'node:crypto';
import dotenv from 'dotenv';

export class Environment {
    static #dotenvLoaded = false;

    #dbEncryptionKey;

    constructor() {
        if (!Environment.#dotenvLoaded) {
            dotenv.config();
            Environment.#dotenvLoaded = true;
        }

        rawKey = process.env.DB_ENCRYPTION_KEY;

        if (!rawKey) {
            throw new Error('DB_ENCRYPTION_KEY missing in environment');
        }

        this.#dbEncryptionKey = crypto.scryptSync(rawKey, '', 32);
    }

    get dbEncryptionKey() { 
        return this.#dbEncryptionKey; 
    }

    close() {
        this.#dbEncryptionKey.fill(0);
    }
}