import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export function extractAccessToken(ctx: ExecutionContext): string {
  const req = ctx.switchToHttp().getRequest<Request>();
  const auth = req.headers['authorization'];

  if (!auth || !auth.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid Authorization header');
  }

  return auth.slice('Bearer '.length).trim();
}

export const AccessToken = createParamDecorator((_data: unknown, ctx: ExecutionContext): string =>
  extractAccessToken(ctx),
);
