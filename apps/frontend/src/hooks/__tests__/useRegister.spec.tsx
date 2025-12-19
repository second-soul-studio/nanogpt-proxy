import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useRegister } from '../useRegister';
import { API_BASE_URL } from '../../apis/api.ts';
import type { RegisterRequestDto } from '../../dtos/register-request.dto.ts';
import type { RegisterResponseDto } from '../../dtos/register-response.dto.ts';
import { api } from '../../apis/axios-client.ts';

vi.mock('../../apis/axios-client.ts', () => ({
  api: {
    post: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useRegister', () => {
  const payload: RegisterRequestDto = {
    email: 'user@example.com',
    password: 'Abcdef1!',
  };

  const mockResponse: RegisterResponseDto = {
    email: 'user@example.com',
    role: 'USER',
    pendingReview: false,
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
  };

  let postMock: Mock;

  beforeEach(() => {
    postMock = api.post as unknown as Mock;
    postMock.mockReset();
  });

  it('calls the API /v1/auth/register/ with the correct parameters and exposes the response', async () => {
    /* Arrange */
    postMock.mockResolvedValueOnce({ data: mockResponse });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRegister(), { wrapper });

    /* Act */
    result.current.mutate(payload);

    /* Assert */
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(`${API_BASE_URL}/v1/auth/register/`, payload, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    expect(result.current.data).toEqual(mockResponse);
  });

  it('propagates the onSuccess option and calls it with the correct arguments', async () => {
    /* Arrange */
    postMock.mockResolvedValueOnce({ data: mockResponse });

    const onSuccess = vi.fn();
    const wrapper = createWrapper();

    const { result } = renderHook(
      () =>
        useRegister({
          onSuccess,
        }),
      { wrapper },
    );

    /* Act */
    result.current.mutate(payload);

    /* Assert */
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);

    const [dataArg, variablesArg] = onSuccess.mock.calls[0];

    expect(dataArg).toEqual(mockResponse);
    expect(variablesArg).toEqual(payload);
  });

  it('displays an error when the request fails', async () => {
    /* Arrange */
    const error = new Error('Registration failed');
    postMock.mockRejectedValueOnce(error);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useRegister(), { wrapper });

    /* Act */
    result.current.mutate(payload);

    /* Assert */
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
