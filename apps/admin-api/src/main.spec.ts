import { bootstrap } from './main';
import { NestFactory } from '@nestjs/core';
import { EnvironmentService } from '@nanogpt-monorepo/core';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

const mockEnableCors = jest.fn();
const mockListen = jest.fn();
const mockGet = jest.fn();

describe('bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (NestFactory.create as jest.Mock).mockResolvedValue({
      enableCors: mockEnableCors,
      listen: mockListen,
      get: mockGet,
    });

    delete process.env.CORS_ORIGINS;
  });

  it('configure CORS avec les fallback origins et écoute sur le adminPort', async () => {
    /* Arrange */
    mockGet.mockImplementation((token) => {
      if (token === EnvironmentService) {
        return { adminPort: 3001 };
      }
      return undefined;
    });

    /* Act */
    await bootstrap();

    /* Assert */
    expect(NestFactory.create).toHaveBeenCalled();

    expect(mockEnableCors).toHaveBeenCalledTimes(1);
    const corsOptions = mockEnableCors.mock.calls[0][0];

    expect(corsOptions.credentials).toBe(true);
    expect(corsOptions.methods).toEqual([
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
    ]);
    expect(corsOptions.allowedHeaders).toEqual([
      'Content-Type',
      'Authorization',
      'x-refresh-token',
    ]);

    /* Testing origin branches */
    const originFn = corsOptions.origin as (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void;

    const cbNoOrigin = jest.fn();
    originFn(undefined, cbNoOrigin);
    expect(cbNoOrigin).toHaveBeenCalledWith(null, true);

    const cbAllowed = jest.fn();
    originFn('http://localhost:5173', cbAllowed);
    expect(cbAllowed).toHaveBeenCalledWith(null, true);

    const cbBlocked = jest.fn();
    originFn('http://evil.com', cbBlocked);
    expect(cbBlocked.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(cbBlocked.mock.calls[0][1]).toBe(false);

    expect(mockGet).toHaveBeenCalledWith(EnvironmentService);
    expect(mockListen).toHaveBeenCalledWith(3001);
  });

  it('utilise CORS_ORIGINS quand la variable est définie', async () => {
    /* Arrange */
    process.env.CORS_ORIGINS = 'http://foo.com, http://bar.com';

    mockGet.mockImplementation((token) => {
      if (token === EnvironmentService) {
        return { adminPort: 4000 };
      }
      return undefined;
    });

    /* Act */
    await bootstrap();

    /* Assert */
    expect(mockEnableCors).toHaveBeenCalledTimes(1);
    const corsOptions = mockEnableCors.mock.calls[0][0];

    const originFn = corsOptions.origin as (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void;

    /* Authorized origin (present in CORS_ORIGINS) */
    const cbFoo = jest.fn();
    originFn('http://foo.com', cbFoo);
    expect(cbFoo).toHaveBeenCalledWith(null, true);

    /* Unauthorized origin */
    const cbLocalhost = jest.fn();
    originFn('http://localhost:5173', cbLocalhost);
    expect(cbLocalhost.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(cbLocalhost.mock.calls[0][1]).toBe(false);

    expect(mockListen).toHaveBeenCalledWith(4000);
  });
});
