import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../security/token.service';
import { AuthenticatedRequest } from '../types/authenticated-request';
import type { Role } from '../decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = req.headers['authorization'];

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = auth.slice('Bearer '.length).trim();
    const payload = this.tokenService.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const revoked = await this.tokenService.isBlacklisted(payload.jti);
    if (revoked) {
      throw new UnauthorizedException('Token revoked');
    }

    const roles = payload.r as Role[];

    req.user = {
      sub: payload.sub,
      r: roles,
      jti: payload.jti,
    };

    return true;
  }
}
