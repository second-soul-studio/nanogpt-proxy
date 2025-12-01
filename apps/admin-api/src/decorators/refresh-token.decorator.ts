import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export function extractRefreshTokenFromContext(ctx: ExecutionContext): string {
  const req = ctx.switchToHttp().getRequest<Request>();

  const headerValue: string | string[] | undefined = req.headers['x-refresh-token'];

  if (!headerValue) {
    throw new UnauthorizedException('Missing refresh token');
  }

  if (Array.isArray(headerValue)) {
    const first = headerValue.find(Boolean);
    if (!first) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return first;
  }

  return headerValue;
}

export const RefreshToken = createParamDecorator((_data: unknown, ctx: ExecutionContext): string =>
  extractRefreshTokenFromContext(ctx),
);
