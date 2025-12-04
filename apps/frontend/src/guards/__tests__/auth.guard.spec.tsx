import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  clearAuthCookies,
  setAuthCookies,
} from '../../utilities/cookies.utilities';
import { isJwtExpired } from '../../utilities/jwt.utilities';
import { renderWithProviders } from '../../__tests__/utilities/test.utilities.tsx';
import { Route, Routes } from 'react-router';
import { AuthGuard } from '../auth.guard.tsx';

vi.mock('axios');

vi.mock('../../utilities/cookies.utilities', () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearAuthCookies: vi.fn(),
  setAuthCookies: vi.fn(),
}));

// On mock l’utilitaire JWT
vi.mock('../../utilities/jwt.utilities', () => ({
  isJwtExpired: vi.fn(),
}));

const mockedAxiosPost = axios.post as unknown as Mock;
const mockedGetAccessToken = getAccessToken as unknown as Mock;
const mockedGetRefreshToken = getRefreshToken as unknown as Mock;
const mockedClearAuthCookies = clearAuthCookies as unknown as Mock;
const mockedSetAuthCookies = setAuthCookies as unknown as Mock;
const mockedIsJwtExpired = isJwtExpired as unknown as Mock;

describe('<AuthGuard />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderProtected(initialEntries: string[] = ['/admin']) {
    return renderWithProviders(
      <Routes>
        <Route path="/" element={<div>Public page</div>} />
        <Route element={<AuthGuard />}>
          <Route path="/admin" element={<div>Protected content</div>} />
        </Route>
      </Routes>,
      initialEntries,
    );
  }

  it('redirects to "/" when there is no access token', async () => {
    /* Arrange */
    mockedGetAccessToken.mockReturnValue(null);
    mockedGetRefreshToken.mockReturnValue(null);

    /* Act */
    renderProtected(['/admin']);

    /* Assert */
    await waitFor(() => {
      expect(screen.getByText('Public page')).toBeInTheDocument();
    });

    expect(mockedClearAuthCookies).not.toHaveBeenCalled();
  });

  it('clears cookies and redirects when there is no refresh token', async () => {
    /* Arrange */
    mockedGetAccessToken.mockReturnValue('dummy-access');
    mockedGetRefreshToken.mockReturnValue(null);

    /* Act */
    renderProtected(['/admin']);

    /* Assert */
    await waitFor(() => {
      expect(screen.getByText('Public page')).toBeInTheDocument();
    });

    expect(mockedClearAuthCookies).toHaveBeenCalledTimes(1);
  });

  it('renders protected content when access token is valid and not expired', async () => {
    /* Arrange */
    mockedGetAccessToken.mockReturnValue('valid-access');
    mockedGetRefreshToken.mockReturnValue('refresh-token');
    mockedIsJwtExpired.mockReturnValue(false);

    /* Act */
    renderProtected(['/admin']);

    /* Assert */
    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    expect(mockedClearAuthCookies).not.toHaveBeenCalled();
    expect(mockedAxiosPost).not.toHaveBeenCalled();
  });

  it('tries to refresh token when access token is expired and refresh succeeds', async () => {
    /* Arrange */
    mockedGetAccessToken.mockReturnValue('expired-access');
    mockedGetRefreshToken.mockReturnValue('valid-refresh');
    mockedIsJwtExpired.mockReturnValue(true);

    mockedAxiosPost.mockResolvedValue({
      data: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      },
    });

    /* Act */
    renderProtected(['/admin']);

    /* Assert */
    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/auth\/refresh$/),
      { refreshToken: 'valid-refresh' },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    expect(mockedSetAuthCookies).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    expect(mockedClearAuthCookies).not.toHaveBeenCalled();
  });

  it('clears cookies and redirects when refresh fails', async () => {
    /* Arrange */
    mockedGetAccessToken.mockReturnValue('expired-access');
    mockedGetRefreshToken.mockReturnValue('valid-refresh');
    mockedIsJwtExpired.mockReturnValue(true);
    mockedAxiosPost.mockRejectedValue(new Error('Refresh failed'));

    /* Act */
    renderProtected(['/admin']);

    /* Arrange */
    await waitFor(() => {
      expect(screen.getByText('Public page')).toBeInTheDocument();
    });

    expect(mockedClearAuthCookies).toHaveBeenCalledTimes(1);
  });
});
