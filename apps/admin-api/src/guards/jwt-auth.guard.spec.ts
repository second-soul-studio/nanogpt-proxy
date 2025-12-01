import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService } from '../security/token.service';
import { AuthenticatedRequest } from '../types/authenticated-request';
import type { Role } from '../decorators/roles.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let tokenService: jest.Mocked<TokenService>;
  let request: AuthenticatedRequest;
  let context: ExecutionContext;

  beforeEach(() => {
    tokenService = {
      verifyAccessToken: jest.fn(),
      isBlacklisted: jest.fn(),
      createAccessToken: jest.fn(),
      createRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      rotateTokens: jest.fn(),
      blacklistAccessToken: jest.fn(),
      revokeRefreshForUser: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    guard = new JwtAuthGuard(tokenService);

    request = {
      headers: {},
    } as unknown as AuthenticatedRequest;

    context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  });

  it('should throw when Authorization header is missing', async () => {
    request.headers = {};

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should throw when Authorization header does not start with Bearer', async () => {
    request.headers = {
      authorization: 'Token abc',
    } as any;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should throw when token is invalid or expired (verifyAccessToken returns null)', async () => {
    request.headers = {
      authorization: 'Bearer invalid.token',
    } as any;

    // @ts-ignore
    tokenService.verifyAccessToken.mockReturnValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('invalid.token');
  });

  it('should throw when token is blacklisted', async () => {
    const payload = {
      sub: 'user@example.com',
      r: ['ADMIN'] as Role[],
      jti: 'jti-123',
      type: 'ACCESS',
    };

    request.headers = {
      authorization: 'Bearer valid.token',
    } as any;

    tokenService.verifyAccessToken.mockReturnValue(payload as any);
    tokenService.isBlacklisted.mockResolvedValue(true);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);

    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('valid.token');
    expect(tokenService.isBlacklisted).toHaveBeenCalledWith('jti-123');
  });

  it('should attach user to request and return true for a valid non-revoked token', async () => {
    const payload = {
      sub: 'admin@example.com',
      r: ['ADMIN'] as Role[],
      jti: 'jti-456',
      type: 'ACCESS',
    };

    request.headers = {
      authorization: 'Bearer valid.token',
    } as any;

    tokenService.verifyAccessToken.mockReturnValue(payload as any);
    tokenService.isBlacklisted.mockResolvedValue(false);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('valid.token');
    expect(tokenService.isBlacklisted).toHaveBeenCalledWith('jti-456');

    expect(request.user).toEqual({
      sub: 'admin@example.com',
      r: ['ADMIN'],
      jti: 'jti-456',
    });
  });
});
