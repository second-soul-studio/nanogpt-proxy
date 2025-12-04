import i18nTest from '../../../i18ntest.ts';
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import LoginForm from '../login-form.tsx';
import { useLogin } from '../../../hooks/useLogin.ts';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities.tsx';

vi.mock('../../../hooks/useLogin.ts');

const mockedUseLogin = useLogin as unknown as MockedFunction<typeof useLogin>;

type UseLoginResult = ReturnType<typeof useLogin>;

describe('<LoginForm />', () => {
  beforeEach(async () => {
    await i18nTest.changeLanguage('en');

    mockedUseLogin.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as Partial<UseLoginResult> as UseLoginResult);
  });

  it('renders', () => {
    /* Act */
    renderWithProviders(<LoginForm />);

    /* Assert */
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders form validation errors', () => {
    /* Act */
    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    /* Assert */
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('call form mutation', () => {
    /* Arrange */
    const mutateMock = vi.fn();

    mockedUseLogin.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      error: null,
    } as Partial<UseLoginResult> as UseLoginResult);

    /* Act */
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    fireEvent.click(submitButton);

    /* Assert */
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  it('should display alert if login failed', () => {
    /* Arrange */
    const error = new Error('Login failed');

    mockedUseLogin.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error,
    } as Partial<UseLoginResult> as UseLoginResult);

    /* Act */
    renderWithProviders(<LoginForm />);

    /* Assert */
    expect(screen.getByText('Login failed')).toBeInTheDocument();
  });
});
