import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';

import { getAccessToken } from '../../utilities/cookies.utilities';
import type { LogoutResponseDto } from '../../dtos/logout-response.dto';
import { useLogout } from '../useLogout.ts';
import { renderWithProviders } from '../../__tests__/utilities/test.utilities.tsx';

vi.mock('axios');
vi.mock('../../utilities/cookies.utilities', () => ({
  getAccessToken: vi.fn(),
}));

const mockedAxiosPost = axios.post as unknown as Mock;
const mockedGetAccessToken = getAccessToken as unknown as Mock;

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

  it('calls axios with bearer header when access token exists and triggers onSuccess', async () => {
    /* Arrange */
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const fakeResponse: LogoutResponseDto = { success: true };

    mockedGetAccessToken.mockReturnValue('access-token-value');
    mockedAxiosPost.mockResolvedValueOnce({ data: fakeResponse });

    /* Act */
    renderWithProviders(<TestComponent onSuccess={onSuccess} onError={onError} />);

    const button = screen.getByRole('button', { name: /trigger logout/i });
    fireEvent.click(button);

    /* Assert */
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(fakeResponse);
    });

    expect(onError).not.toHaveBeenCalled();

    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
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

  it('calls axios without Authorization header when there is no access token', async () => {
    /* Arrange */
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const fakeResponse: LogoutResponseDto = { success: true };

    mockedGetAccessToken.mockReturnValue(null);
    mockedAxiosPost.mockResolvedValueOnce({ data: fakeResponse });

    /* Act */
    renderWithProviders(<TestComponent onSuccess={onSuccess} onError={onError} />);

    const button = screen.getByRole('button', { name: /trigger logout/i });
    fireEvent.click(button);

    /* Assert */
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(fakeResponse);
    });

    expect(onError).not.toHaveBeenCalled();

    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
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
    mockedAxiosPost.mockRejectedValueOnce(error);

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
