import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from '../useLogin';
import { api } from '../../apis/axios-client.ts';
import type { LoginResponseDto } from '../../dtos/login-response.dto.ts';
import type { ReactNode } from 'react';

vi.mock('../../apis/axios-client.ts', () => ({
  api: {
    post: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockedApi = api as unknown as {
  post: ReturnType<typeof vi.fn>;
};

describe('useLogin', () => {
  beforeEach(() => {
    mockedApi.post.mockReset();
  });

  it('calls /v1/auth/login/ and returns data on success', async () => {
    /* Arrange */
    const response: LoginResponseDto = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      email: 'admin@example.com',
      role: 'ADMIN',
    };

    mockedApi.post.mockResolvedValueOnce({ data: response });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper });

    /* Act */
    await act(async () => {
      result.current.mutate({
        email: 'admin@example.com',
        password: 'secret',
      });
    });

    /* Assert */
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/login/'),
      {
        email: 'admin@example.com',
        password: 'secret',
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('calls onSuccess callback when login succeeds', async () => {
    /* Arrange */
    const response: LoginResponseDto = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      email: 'admin@example.com',
      role: 'ADMIN',
    };

    mockedApi.post.mockResolvedValueOnce({ data: response });

    const onSuccess = vi.fn();
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLogin({ onSuccess }), { wrapper });

    /* Act */
    await act(async () => {
      result.current.mutate({
        email: 'admin@example.com',
        password: 'secret',
      });
    });

    /* Assert */
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(response);
  });

  it('calls onError callback when login fails', async () => {
    /* Arrange */
    const error = new Error('Login failed');

    mockedApi.post.mockRejectedValueOnce(error);

    const onError = vi.fn();
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLogin({ onError }), { wrapper });

    /* Act */
    await act(async () => {
      result.current.mutate({
        email: 'admin@example.com',
        password: 'wrong',
      });
    });

    /* Assert */
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
  });
});
