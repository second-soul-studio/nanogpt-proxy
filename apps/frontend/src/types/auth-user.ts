import type { AuthRole } from '../utilities/auth-user.utilities.ts';

export type AuthUser = {
  email: string;
  roles: AuthRole;
};
