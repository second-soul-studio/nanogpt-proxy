import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { extractRefreshTokenFromContext } from './refresh-token.decorator';

const createMockContext = (
  headers: Record<string, string | string[] | undefined>,
): ExecutionContext => {
  const req = {
    headers,
  } as unknown as Request;

  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
};

describe('extractRefreshTokenFromContext', () => {
  it('should return the refresh token when header is a single string', () => {
    const ctx = createMockContext({
      'x-refresh-token': 'my.refresh.token',
    });

    const result = extractRefreshTokenFromContext(ctx);

    expect(result).toBe('my.refresh.token');
  });

  it('should return the first non-empty token when header is an array', () => {
    const ctx = createMockContext({
      'x-refresh-token': ['', 'first.token', 'other.token'],
    });

    const result = extractRefreshTokenFromContext(ctx);

    expect(result).toBe('first.token');
  });

  it('should throw when x-refresh-token header is missing', () => {
    const ctx = createMockContext({});

    const call = () => extractRefreshTokenFromContext(ctx);

    expect(call).toThrow(UnauthorizedException);
    expect(call).toThrow('Missing refresh token');
  });

  it('should throw when x-refresh-token header is an empty array', () => {
    const ctx = createMockContext({
      'x-refresh-token': ['', ''],
    });

    const call = () => extractRefreshTokenFromContext(ctx);

    expect(call).toThrow(UnauthorizedException);
    expect(call).toThrow('Missing refresh token');
  });
});
