import { JwtType } from '../enums/jwt-type';

export interface JwtRefreshTokenPayload {
  sub: string;
  jti: string;
  type: JwtType.REFRESH;
}
