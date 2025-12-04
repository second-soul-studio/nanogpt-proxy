import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useLogin } from '../useLogin.ts';
import { renderWithProviders } from '../../__tests__/utilities/test.utilities.tsx';

vi.mock('axios');
const mockedAxiosPost = axios.post as unknown as Mock;

function TestComponent(props: {
  onSuccess?: (data: unknown) => void;
  onError?: (err: Error) => void;
}) {
  const { onSuccess, onError } = props;
  const { mutate } = useLogin({ onSuccess, onError });

  return (
    <button
      type="button"
      onClick={() =>
        mutate({
          email: 'user@example.com',
          password: 'secret123',
        })
      }
    >
      Trigger login
    </button>
  );
}

describe('useLogin hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls axios with correct arguments and triggers onSuccess when login succeeds', async () => {
    /* Arrange */
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const fakeResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    mockedAxiosPost.mockResolvedValueOnce({ data: fakeResponse });

    /* Act */
    renderWithProviders(<TestComponent onSuccess={onSuccess} onError={onError} />);

    const button = screen.getByRole('button', { name: /trigger login/i });
    fireEvent.click(button);

    /* Assert */
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(fakeResponse);
    });

    expect(onError).not.toHaveBeenCalled();

    // Vérifie l’appel axios
    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/auth\/login\/$/),
      {
        email: 'user@example.com',
        password: 'secret123',
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('triggers onError when login fails', async () => {
    /* Arrange */
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const error = new Error('Login failed');
    mockedAxiosPost.mockRejectedValueOnce(error);

    /* Act */
    renderWithProviders(<TestComponent onSuccess={onSuccess} onError={onError} />);

    const button = screen.getByRole('button', { name: /trigger login/i });
    fireEvent.click(button);

    /* Assert */
    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
