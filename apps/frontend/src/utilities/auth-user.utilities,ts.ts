import { decodeJwt } from './jwt.utilities.ts';
import type { AuthUser } from '../types/auth-user.ts';

export type AuthRole = 'ADMIN' | 'USER';

function mapRolesToAuthRole(r?: string[]): AuthRole {
  const roles = (r ?? []).map((v) => v.toLowerCase());

  if (roles.includes('admin')) {
    return 'ADMIN';
  }
  return 'USER';
}

export function userFromAccessToken(token: string | null): AuthUser | null {
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload?.sub) return null;

  const role = mapRolesToAuthRole(payload.r);

  return {
    email: payload.sub,
    role,
  };
}
