import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import { useLogout } from '../../../hooks/useLogout.ts';
import { useNavigate } from 'react-router';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities.tsx';
import NavBar from '../nav-bar.tsx';
import i18nTest from '../../../i18ntest.ts';
import { useAuth } from '../../../hooks/useAuth.ts';

vi.mock('../../../hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../../../hooks/useLogout.ts');
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockedUseAuth = useAuth as unknown as MockedFunction<typeof useAuth>;
const mockedUseLogout = useLogout as unknown as MockedFunction<typeof useLogout>;
const mockedUseNavigate = useNavigate as unknown as MockedFunction<typeof useNavigate>;

type UseLogoutResult = ReturnType<typeof useLogout>;

describe('<NavBar />', () => {
  beforeEach(async () => {
    await i18nTest.changeLanguage('en');

    vi.clearAllMocks();

    const navigateMock = vi.fn();
    mockedUseNavigate.mockReturnValue(navigateMock);

    mockedUseLogout.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as Partial<UseLogoutResult> as UseLogoutResult);

    mockedUseAuth.mockReturnValue({
      user: {
        email: 'admin@example.com',
        roles: 'ADMIN',
      },
      isLoading: false,
      setSession: vi.fn(),
      clearSession: vi.fn(),
    });
  });

  it('renders version and navigation links', () => {
    /* Act */
    renderWithProviders(<NavBar />);

    /* Assert */
    expect(screen.getByText('v0.0.1')).toBeInTheDocument();
    expect(screen.getByText('Administer')).toBeInTheDocument();
    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('navigates when clicking a nav link', () => {
    /* Arrange */
    const navigateMock = vi.fn();
    mockedUseNavigate.mockReturnValue(navigateMock);

    /* Act */
    renderWithProviders(<NavBar />, ['/admin']);

    const apiKeysLink = screen.getByText('API Key').closest('a')!;
    fireEvent.click(apiKeysLink);

    /* Assert */
    expect(navigateMock).toHaveBeenCalledWith('/admin/apikey');
  });

  it('calls logout mutation when clicking Log out', () => {
    /* Arrange */
    const navigateMock = vi.fn();
    mockedUseNavigate.mockReturnValue(navigateMock);

    const logoutMutateMock = vi.fn();

    mockedUseLogout.mockReturnValue({
      mutate: logoutMutateMock,
      isPending: false,
      error: null,
    } as Partial<UseLogoutResult> as UseLogoutResult);

    /* Act */
    renderWithProviders(<NavBar />);

    const logoutLink = screen.getByText('Log out').closest('a')!;
    fireEvent.click(logoutLink);

    /* Assert */
    expect(logoutMutateMock).toHaveBeenCalledTimes(1);
  });
});
