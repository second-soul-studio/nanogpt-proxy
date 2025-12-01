import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { extractAccessToken } from './access-token.decorator';

describe('AccessToken decorator logic (extractAccessToken)', () => {
  const createMockContext = (headers: Record<string, string | undefined>): ExecutionContext => {
    const req = {
      headers,
    } as unknown as Request;

    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  };

  it('should extract the bearer token when header is valid', () => {
    const ctx = createMockContext({
      authorization: 'Bearer my.jwt.token',
    });

    const result = extractAccessToken(ctx);

    expect(result).toBe('my.jwt.token');
  });

  it('should throw if Authorization header is missing', () => {
    const ctx = createMockContext({});

    const call = () => extractAccessToken(ctx);

    expect(call).toThrow(UnauthorizedException);
    expect(call).toThrow('Missing or invalid Authorization header');
  });

  it('should throw if Authorization header does not start with Bearer', () => {
    const ctx = createMockContext({
      authorization: 'Basic abcdef',
    });

    const call = () => extractAccessToken(ctx);

    expect(call).toThrow(UnauthorizedException);
    expect(call).toThrow('Missing or invalid Authorization header');
  });
});
