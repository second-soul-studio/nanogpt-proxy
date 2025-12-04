import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import { useLogout } from '../../../hooks/useLogout.ts';
import { useNavigate } from 'react-router';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities.tsx';
import NavBar from '../nav-bar.tsx';

vi.mock('../../../hooks/useLogout.ts');
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockedUseLogout = useLogout as unknown as MockedFunction<typeof useLogout>;
const mockedUseNavigate = useNavigate as unknown as MockedFunction<typeof useNavigate>;

type UseLogoutResult = ReturnType<typeof useLogout>;

describe('<NavBar />', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const navigateMock = vi.fn();
    mockedUseNavigate.mockReturnValue(navigateMock);

    mockedUseLogout.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as Partial<UseLogoutResult> as UseLogoutResult);
  });

  it('renders version and navigation links', () => {
    /* Act */
    renderWithProviders(<NavBar />);

    /* Assert */
    expect(screen.getByText('v0.0.1')).toBeInTheDocument();
    expect(screen.getByText('Administer')).toBeInTheDocument();
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('navigates when clicking a nav link and sets it active', () => {
    /* Arrange */
    const navigateMock = vi.fn();
    mockedUseNavigate.mockReturnValue(navigateMock);

    /* Act */
    renderWithProviders(<NavBar />);

    const administerLink = screen.getByText('Administer').closest('a')!;
    const apiKeysLink = screen.getByText('API Keys').closest('a')!;

    /* Assert */
    expect(administerLink).toHaveAttribute('data-active');

    fireEvent.click(apiKeysLink);

    expect(navigateMock).toHaveBeenCalledWith('/admin/apikey');
    expect(apiKeysLink).toHaveAttribute('data-active');
  });

  it('calls logout mutation when clicking Logout', () => {
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

    const logoutLink = screen.getByText('Logout').closest('a')!;
    fireEvent.click(logoutLink);

    /* Assert */
    expect(logoutMutateMock).toHaveBeenCalledTimes(1);
  });
});
