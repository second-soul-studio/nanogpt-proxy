import type { AuthRole } from '../utilities/auth-user.utilities,ts.ts';

export type AuthUser = {
  email: string;
  role: AuthRole;
};
