import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

vi.mock('../../utilities/cookies.utilities', () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn(),
}));

type Mock = ReturnType<typeof vi.fn>;

type RequestConfigLike = {
  headers?: Record<string, unknown>;
};

type RequestHandler = (config: RequestConfigLike) => RequestConfigLike;

type ResponseRejectedHandler = (error: unknown) => Promise<unknown>;

type AxiosInterceptorsIntrospection = {
  interceptors: {
    request: {
      handlers: Array<{ fulfilled?: RequestHandler }>;
    };
    response: {
      handlers: Array<{ rejected?: ResponseRejectedHandler }>;
    };
  };
};

type AxiosDefaultsWithAdapter = typeof axios.defaults & {
  adapter?: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;
};

type AxiosLikeError = {
  response?: { status: number };
  config?: Record<string, unknown>;
};

let api: AxiosInstance;
let getAccessTokenMock: Mock;
let getRefreshTokenMock: Mock;
let setAuthCookiesMock: Mock;
let clearAuthCookiesMock: Mock;

function getRequestInterceptor(apiInstance: AxiosInstance): RequestHandler {
  const introspected = apiInstance as unknown as AxiosInterceptorsIntrospection;
  const handler = introspected.interceptors.request.handlers[0]?.fulfilled;
  if (!handler) {
    throw new Error('No request interceptor found');
  }
  return handler;
}

function getResponseRejectedInterceptor(apiInstance: AxiosInstance): ResponseRejectedHandler {
  const introspected = apiInstance as unknown as AxiosInterceptorsIntrospection;
  const handler = introspected.interceptors.response.handlers[0]?.rejected;
  if (!handler) {
    throw new Error('No response rejected interceptor found');
  }
  return handler;
}

beforeEach(async () => {
  vi.resetModules();
  vi.restoreAllMocks();

  const mod = await import('../axios-client');
  api = mod.api;

  const cookies = await import('../../utilities/cookies.utilities');
  getAccessTokenMock = cookies.getAccessToken as unknown as Mock;
  getRefreshTokenMock = cookies.getRefreshToken as unknown as Mock;
  setAuthCookiesMock = cookies.setAuthCookies as unknown as Mock;
  clearAuthCookiesMock = cookies.clearAuthCookies as unknown as Mock;

  (api.defaults as AxiosDefaultsWithAdapter).adapter = vi.fn(
    async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }),
  );
});

describe('axios api client', () => {
  it('adds Authorization header when access token exists', () => {
    /* Arrange */
    getAccessTokenMock.mockReturnValue('access-123');

    /* Act */
    const requestInterceptor = getRequestInterceptor(api);

    const config = requestInterceptor({ headers: {} });

    /* Assert */
    expect(config.headers?.Authorization).toBe('Bearer access-123');
  });

  it('does not add Authorization header when access token is missing', () => {
    /* Arrange */
    getAccessTokenMock.mockReturnValue(null);

    /* Act */
    const requestInterceptor = getRequestInterceptor(api);

    const config = requestInterceptor({ headers: {} });

    /* Assert */
    expect(config.headers?.Authorization).toBeUndefined();
  });

  it('response interceptor – returns rejected promise when there is no response', async () => {
    /* Act */
    const responseRejected = getResponseRejectedInterceptor(api);

    type NetworkError = Error & { config?: Record<string, unknown> };
    const error: NetworkError = Object.assign(new Error('Network error'), { config: {} });

    /* Assert */
    await expect(responseRejected(error)).rejects.toBe(error);
  });

  it('response interceptor – rejects when status is not 401', async () => {
    /* Act */
    const responseRejected = getResponseRejectedInterceptor(api);

    getRefreshTokenMock.mockReturnValue('some-refresh');

    const error: AxiosLikeError = {
      response: { status: 403 },
      config: {},
    };

    /* Assert */
    await expect(responseRejected(error)).rejects.toEqual(error);
  });

  it('response interceptor – rejects when no refresh token is available (pre-check)', async () => {
    /* Act */
    const responseRejected = getResponseRejectedInterceptor(api);

    getRefreshTokenMock.mockReturnValue(null);

    const error: AxiosLikeError = {
      response: { status: 401 },
      config: {},
    };

    /* Assert */
    await expect(responseRejected(error)).rejects.toEqual(error);
    expect(clearAuthCookiesMock).not.toHaveBeenCalled();
  });

  it('response interceptor – performs refresh and retries request on 401', async () => {
    /* Arrange */
    const responseRejected = getResponseRejectedInterceptor(api);

    getRefreshTokenMock.mockReturnValue('valid-refresh');

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse<{ accessToken: string; refreshToken: string }>);

    const error: AxiosLikeError = {
      response: { status: 401 },
      config: { url: '/protected', headers: {} },
    };

    /* Act */
    const resultUnknown = await responseRejected(error);
    const result = resultUnknown as AxiosResponse<{ ok: boolean }>;

    /* Assert */
    const adapterMock = (api.defaults as AxiosDefaultsWithAdapter).adapter as Mock;
    expect(adapterMock).toHaveBeenCalledTimes(1);

    expect(postSpy).toHaveBeenCalledWith(expect.stringMatching(/\/v1\/auth\/refresh\/$/), null, {
      withCredentials: true,
      headers: { 'x-refresh-token': 'valid-refresh' },
    });

    expect(setAuthCookiesMock).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    expect(result.data).toEqual({ ok: true });
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('OK');
    expect(result.config).toBeDefined();
  });

  it('response interceptor – clears cookies and redirects when refresh fails', async () => {
    /* Arrange */
    const responseRejected = getResponseRejectedInterceptor(api);

    getRefreshTokenMock.mockReturnValue('refresh-token');

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh failed'));

    const error: AxiosLikeError = {
      response: { status: 401 },
      config: {},
    };

    /* Act & Assert */
    await expect(responseRejected(error)).rejects.toThrow('Refresh failed');

    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
  });

  it('queues requests when refresh is already in progress and retries them with new token', async () => {
    /* Arrange */
    const responseRejected = getResponseRejectedInterceptor(api);

    getRefreshTokenMock.mockReturnValue('refresh-token');

    let resolveRefresh: (() => void) | undefined;

    vi.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise<AxiosResponse<{ accessToken: string; refreshToken: string }>>((resolve) => {
          resolveRefresh = () =>
            resolve({
              data: {
                accessToken: 'new-access',
                refreshToken: 'new-refresh',
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {} as InternalAxiosRequestConfig,
            });
        }),
    );

    const error1: AxiosLikeError = {
      response: { status: 401 },
      config: { url: '/first', headers: {} },
    };
    const error2: AxiosLikeError = {
      response: { status: 401 },
      config: { url: '/second', headers: {} },
    };

    const p1 = responseRejected(error1);
    const p2 = responseRejected(error2);

    if (resolveRefresh) {
      resolveRefresh();
    }

    /* Act */
    await Promise.all([p1, p2]);

    /* Assert */
    const adapterMock = (api.defaults as AxiosDefaultsWithAdapter).adapter as Mock;
    expect(adapterMock).toHaveBeenCalledTimes(2);
  });
});
