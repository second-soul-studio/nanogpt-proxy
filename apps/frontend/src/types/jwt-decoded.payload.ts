import { JwtType } from '../../../../packages/core/src/enums/jwt-type';

export type JwtDecodedPayload = {
  sub?: string;
  r?: string[];
  jti?: string;
  type?: JwtType.ACCESS | JwtType.REFRESH;
  exp?: number;
};
