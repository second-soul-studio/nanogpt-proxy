import { Request } from 'express';
import type { Role } from '../decorators/roles.decorator';

export interface AuthenticatedUser {
  sub: string;
  r: Role[];
  jti: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
