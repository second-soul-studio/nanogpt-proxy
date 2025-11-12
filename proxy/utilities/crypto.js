import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const algorithm = 'aes-256-ctr';
const iv = Buffer.alloc(16, 0);

function getSecret() {
    const key = process.env.DB_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('⚠️ Missing DB_ENCRYPTION_KEY');
    }
    return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(text) {
    const secret = getSecret();
    const cipher = crypto.createCipheriv(algorithm, secret, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);
    return encrypted.toString('hex');
}

export function decrypt(enc) {
    const secret = getSecret();
    const encryptedBuffer = Buffer.from(enc, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secret, iv);
    const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}
