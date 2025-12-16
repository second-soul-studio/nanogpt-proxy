import type { JwtDecodedPayload } from '../types/jwt-decoded.payload.ts';

export function decodeJwt(token: string): JwtDecodedPayload | null {
  try {
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) {
      return null;
    }

    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson) as JwtDecodedPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  try {
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) {
      return true;
    }

    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: number };

    if (!payload.exp) {
      return true;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSeconds;
  } catch {
    return true;
  }
}
