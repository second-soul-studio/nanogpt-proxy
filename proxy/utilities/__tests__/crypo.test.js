import { encrypt } from '../crypto.js';
import { decrypt } from 'dotenv';

describe('Crypto Utils', () => {
  const plainText = 'hello-world';
  const originalEnvKey = process.env.DB_ENCRYPTION_KEY;

  beforeAll(() => {
    // Set a test encryption key if not already defined
    if (!process.env.DB_ENCRYPTION_KEY) {
      process.env.DB_ENCRYPTION_KEY = 'test-secret-key';
    }
  });

  afterAll(() => {
    process.env.DB_ENCRYPTION_KEY = originalEnvKey;
  });

  it('should encrypt and decrypt a string back to original', () => {
    const encrypted = encrypt(plainText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plainText);
  });

  it('should return a hex string when encrypted', () => {
    const encrypted = encrypt(plainText);
    expect(encrypted).toMatch(/^[0-9a-f]+$/);
  });

  it('should produce different encrypted output for different input', () => {
    const encrypted1 = encrypt('foo');
    const encrypted2 = encrypt('bar');
    expect(encrypted1).not.toBe(encrypted2);
  });
});