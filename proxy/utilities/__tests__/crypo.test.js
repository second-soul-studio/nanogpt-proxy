import { encrypt, decrypt } from '../crypto.js';

describe('crypto.js', () => {
  const plainText = 'Hello world!';

  beforeAll(() => {
    process.env.DB_ENCRYPTION_KEY = 'test-secret-key';
  });

  afterAll(() => {
    delete process.env.DB_ENCRYPTION_KEY;
  });

  it('should return a hex string when encrypted', () => {
    const encrypted = encrypt(plainText);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).toMatch(/^[0-9a-f]+$/i);
  });

  it('should produce different encrypted output for different input', () => {
    const encrypted1 = encrypt('text1');
    const encrypted2 = encrypt('text2');
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should encrypt and decrypt a string back to original', () => {
    const encrypted = encrypt(plainText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plainText);
  });
});