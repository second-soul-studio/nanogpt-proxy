import crypto from 'node:crypto';

const ALG = 'aes-256-gcm';
const SALT = 32;

export class Cryptor {
    #key;
    #alg;

    constructor(keyBuf, opts = {}) {
        if (!Buffer.isBuffer(keyBuf) || keyBuf.length !== 32) {
            throw new Error('Need 32 B Buffer, hun');
        }

        this.#key = keyBuf;
        this.#alg = opts.alg || ALG;

        const salt = opts.salt || crypto.randomBytes(SALT);
        this.salt = salt;
    }

    encrypt(plain) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.#alg, this.#key, iv);
        const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return [this.salt, iv, tag, ct]
            .map(b => b.toString('hex'))
            .join(':');
    }

    decrypt(blob) {
        const [saltHex, ivHex, tagHex, ctHex] = blob.split(':');
        const salt = Buffer.from(saltHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const ct = Buffer.from(ctHex, 'hex');

        const decipher = crypto.createDecipheriv(this.#alg, this.#key, iv);
        decipher.setAuthTag(tag);
        const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
        return pt.toString('utf8');
    }
}