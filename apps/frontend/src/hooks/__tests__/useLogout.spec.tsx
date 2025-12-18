import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import type { LogoutResponseDto } from '../../dtos/logout-response.dto';
import { useLogout } from '../useLogout.ts';
import { renderWithProviders } from '../../__tests__/utilities/test.utilities.tsx';

// 1️⃣ Mock du client axios "api"
vi.mock('../../apis/axios-client.ts', () => ({
  api: {
    post: vi.fn(),
  },
}));

// 2️⃣ Mock de cookies.utilities, mais en gardant les autres exports réels
vi.mock('../../utilities/cookies.utilities', async () => {
  const actual = await vi.importActual<typeof import('../../utilities/cookies.utilities')>(
    '../../utilities/cookies.utilities',
  );

  return {
    ...actual,
    getAccessToken: vi.fn(), // 👈 on override juste celle-là
  };
});

// 3️⃣ On importe les mocks APRÈS les vi.mock
import { api } from '../../apis/axios-client.ts';
import { getAccessToken } from '../../utilities/cookies.utilities';

// Helpers typés
const mockedApi = api as unknown as {
  post: ReturnType<typeof vi.fn>;
};
const mockedGetAccessToken = getAccessToken as unknown as ReturnType<typeof vi.fn>;

function TestComponent(props: {
  onSuccess?: (data: LogoutResponseDto) => void;
  onError?: (err: Error) => void;
}) {
  const { onSuccess, onError } = props;
  const { mutate } = useLogout({ onSuccess, onError });

  return (
    <button type="button" onClick={() => mutate()}>
      Trigger logout
    </button>
  );
}

describe('useLogout hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls api with bearer header when access token exists and triggers onSuccess', async () => {
    /* Arrange */
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const fakeResponse: LogoutResponseDto = { success: true };

    mockedGetAccessToken.mockReturnValue('access-token-value');
    mockedApi.post.mockResolvedValueOnce({ data: fakeResponse });

    /* Act */
    renderWithProviders(<TestComponent onSuccess={onSuccess} onError={onError} />);

    const button = screen.getByRole('button', { name: /trigger logout/i });
    fireEvent.click(button);

    /* Assert */
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(fakeResponse);
    });

    expect(onError).not.toHaveBeenCalled();

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/auth\/logout\/$/),
      undefined,
      {
        withCredentials: true,
        headers: {
          Authorization: 'Bearer access-token-value',
        },
      },
    );
  });

  it('calls api without Authorization header when there is no access token', async () => {
    /* Arrange */
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const fakeResponse: LogoutResponseDto = { success: true };

    mockedGetAccessToken.mockReturnValue(null);
    mockedApi.post.mockResolvedValueOnce({ data: fakeResponse });

    /* Act */
    renderWithProviders(<TestComponent onSuccess={onSuccess} onError={onError} />);

    const button = screen.getByRole('button', { name: /trigger logout/i });
    fireEvent.click(button);

    /* Assert */
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(fakeResponse);
    });

    expect(onError).not.toHaveBeenCalled();

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/auth\/logout\/$/),
      undefined,
      {
        withCredentials: true,
        headers: {},
      },
    );
  });

  it('triggers onError when logout request fails', async () => {
    /* Arrange */
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const error = new Error('Logout failed');

    mockedGetAccessToken.mockReturnValue('access-token-value');
    mockedApi.post.mockRejectedValueOnce(error);

    /* Act */
    renderWithProviders(<TestComponent onSuccess={onSuccess} onError={onError} />);

    const button = screen.getByRole('button', { name: /trigger logout/i });
    fireEvent.click(button);

    /* Assert */
    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
