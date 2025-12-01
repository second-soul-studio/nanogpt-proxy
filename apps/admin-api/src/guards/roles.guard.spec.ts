import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role, ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';

type ReflectorMock = {
  getAllAndOverride: jest.MockedFunction<Reflector['getAllAndOverride']>;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: ReflectorMock;
  let context: ExecutionContext;
  let request: AuthenticatedRequest;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new RolesGuard(reflector as unknown as Reflector);

    request = {
      user: {
        sub: 'user@example.com',
        r: ['USER'],
        jti: 'jti-123',
      },
    } as unknown as AuthenticatedRequest;

    context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined as unknown as Role[]);

    const result = guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    expect(result).toBe(true);
  });

  it('should allow access when user has at least one required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'USER']);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user has no roles array', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    request.user = {
      sub: 'user@example.com',
      r: [],
      jti: 'jti-123',
    };

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user roles do not include any required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when multiple roles are required and user has one of them', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'USER']);

    request.user = {
      sub: 'user@example.com',
      r: ['USER'],
      jti: 'jti-123',
    };

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});
