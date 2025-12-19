import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useConfiguration } from '../useConfiguration';
import type { ConfigurationDto } from '../../dtos/configuration.dto';
import { api } from '../../apis/axios-client';
import { getAccessToken } from '../../utilities/cookies.utilities';

vi.mock('../../apis/api', () => ({
  API_BASE_URL: 'https://test.local',
}));

vi.mock('../../apis/axios-client', () => {
  return {
    api: {
      get: vi.fn(),
      put: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

vi.mock('../../utilities/cookies.utilities', () => ({
  getAccessToken: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { Wrapper, queryClient };
}

describe('useConfiguration', () => {
  const mockedApi = api as unknown as {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  const mockedGetAccessToken = getAccessToken as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches configuration on mount and exposes it as config', async () => {
    /* Arrange */
    const mockConfig = { allowRegistration: true } as unknown as ConfigurationDto;

    mockedApi.get.mockResolvedValueOnce({ data: mockConfig });

    const { Wrapper } = createWrapper();

    /* Act */
    const { result } = renderHook(() => useConfiguration(), {
      wrapper: Wrapper,
    });

    /* Assert */
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      'https://test.local/v1/configuration',
      expect.objectContaining({
        withCredentials: true,
      }),
    );

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBeNull();
  });

  it('updateConfig calls PUT with the bearer token and updates the cache', async () => {
    /* Arrange */
    const initialConfig = { allowRegistration: false } as unknown as ConfigurationDto;
    const updatedConfig = { allowRegistration: true } as unknown as ConfigurationDto;

    mockedApi.get.mockResolvedValueOnce({ data: initialConfig });
    mockedGetAccessToken.mockReturnValue('access-token-123');
    mockedApi.put.mockResolvedValueOnce({ data: updatedConfig });

    const { Wrapper } = createWrapper();

    /* Act */
    const { result } = renderHook(() => useConfiguration(), {
      wrapper: Wrapper,
    });

    /* Assert */
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.updateConfig({ allowRegistration: true } as Partial<ConfigurationDto>);
    });

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    const [url, payload, config] = mockedApi.put.mock.calls[0];

    expect(url).toBe('https://test.local/v1/configuration');
    expect(payload).toEqual({ allowRegistration: true });
    expect(config).toEqual(
      expect.objectContaining({
        withCredentials: true,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token-123',
        }),
      }),
    );

    await waitFor(() => {
      expect(result.current.config).toEqual(updatedConfig);
    });
  });

  it('updateConfigAsync rejects if no access token is available', async () => {
    /* Arrange */
    const initialConfig = { allowRegistration: false } as unknown as ConfigurationDto;

    mockedApi.get.mockResolvedValueOnce({ data: initialConfig });
    mockedGetAccessToken.mockReturnValue(null); // Pas de token

    const { Wrapper } = createWrapper();

    /* Act */
    const { result } = renderHook(() => useConfiguration(), {
      wrapper: Wrapper,
    });

    /* Assert */
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      result.current.updateConfigAsync({ allowRegistration: true } as Partial<ConfigurationDto>),
    ).rejects.toThrow('No access token available. Please sign in again.');

    // Dans ce cas, pas d’appel PUT
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it('expose isUpdating when the mutation is in progress', async () => {
    /* Arrange */
    const initialConfig = { allowRegistration: false } as unknown as ConfigurationDto;
    mockedApi.get.mockResolvedValueOnce({ data: initialConfig });
    mockedGetAccessToken.mockReturnValue('access-token-123');

    let resolvePut: ((value: unknown) => void) | null = null;
    const putPromise = new Promise((resolve) => {
      resolvePut = resolve;
    });

    mockedApi.put.mockReturnValueOnce(
      putPromise.then(() => ({ data: initialConfig })) as unknown as Promise<{
        data: ConfigurationDto;
      }>,
    );

    const { Wrapper } = createWrapper();

    /* Act */
    const { result } = renderHook(() => useConfiguration(), { wrapper: Wrapper });

    /* Assert */
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateConfig({ allowRegistration: false } as Partial<ConfigurationDto>);
    });

    await waitFor(() => {
      expect(result.current.isUpdating).toBe(true);
    });

    await act(async () => {
      resolvePut?.(undefined);
    });

    await waitFor(() => {
      expect(result.current.isUpdating).toBe(false);
    });
  });
});
