import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isJwtExpired } from '../jwt.utilities.ts';

function createJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

  const headerPart = encode(header);
  const payloadPart = encode(payload);
  const signaturePart = 'signature';

  return `${headerPart}.${payloadPart}.${signaturePart}`;
}

describe('isJwtExpired', () => {
  const fixedNow = new Date('2025-01-01T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when token exp is in the future', () => {
    /* Act */
    const nowSeconds = Math.floor(fixedNow.getTime() / 1000);
    const token = createJwt({ exp: nowSeconds + 60 });

    /* Assert */
    expect(isJwtExpired(token)).toBe(false);
  });

  it('returns true when token exp is in the past', () => {
    /* Act */
    const nowSeconds = Math.floor(fixedNow.getTime() / 1000);
    const token = createJwt({ exp: nowSeconds - 10 });

    /* Assert */
    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns true when token exp is exactly now', () => {
    /* Act */
    const nowSeconds = Math.floor(fixedNow.getTime() / 1000);
    const token = createJwt({ exp: nowSeconds });

    /* Assert */
    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns true when token has no exp claim', () => {
    /* Act */
    const token = createJwt({}); // no exp

    /* Assert */
    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns true when token has an invalid structure (not enough parts)', () => {
    /* Act */
    const token = 'invalid-token-without-dots';

    /* Assert */
    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns true when payload is not valid base64/json', () => {
    /* Act */
    const token = 'aaa.@@@.bbb';

    /* Assert */
    expect(isJwtExpired(token)).toBe(true);
  });
});
