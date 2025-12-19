import i18nTest from '../../../i18ntest.ts';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities.tsx';
import RegistrationForm from '../registration-form.tsx';
import type { RegisterRequestDto } from '../../../dtos/register-request.dto.ts';
import type { RegisterResponseDto } from '../../../dtos/register-response.dto.ts';

const navigateMock: Mock = vi.fn();
const setAuthCookiesMock: Mock = vi.fn();
const mutateSpy: Mock = vi.fn();

let currentIsPending = false;
let currentIsSuccess = false;
let currentData: RegisterResponseDto | null = null;
let currentError: Error | null = null;
let currentOnSuccessPayload: RegisterResponseDto | null = null;

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

type UseRegisterMockReturn = {
  mutate: (values: RegisterRequestDto) => void;
  isPending: boolean;
  isSuccess: boolean;
  data: RegisterResponseDto | null;
  error: Error | null;
};

vi.mock('../../../hooks/useRegister.ts', () => ({
  useRegister: (opts?: {
    onSuccess?: (result: RegisterResponseDto) => void;
  }): UseRegisterMockReturn => ({
    mutate: (values: RegisterRequestDto) => {
      mutateSpy(values);
      if (currentOnSuccessPayload && opts?.onSuccess) {
        opts.onSuccess(currentOnSuccessPayload);
      }
    },
    isPending: currentIsPending,
    isSuccess: currentIsSuccess,
    data: currentData,
    error: currentError,
  }),
}));

vi.mock('../../../utilities/cookies.utilities.ts', async () => {
  const actual = await vi.importActual<typeof import('../../../utilities/cookies.utilities.ts')>(
    '../../../utilities/cookies.utilities.ts',
  );

  return {
    ...actual,
    setAuthCookies: (...args: Parameters<(typeof actual)['setAuthCookies']>) => {
      setAuthCookiesMock(...args);
    },
  };
});

vi.mock('../../../utilities/password-validation.utilities.ts', () => ({
  validatePasswordRaw: (value: string) => ({
    valid: value.length >= 6,
    failedRule: value.length >= 6 ? null : 'min',
  }),
}));

describe('<RegistrationForm />', () => {
  beforeEach(async () => {
    await i18nTest.changeLanguage('en');

    vi.useFakeTimers();

    navigateMock.mockReset();
    setAuthCookiesMock.mockReset();
    mutateSpy.mockReset();

    currentIsPending = false;
    currentIsSuccess = false;
    currentData = null;
    currentError = null;
    currentOnSuccessPayload = null;
  });

  it('renders first step with email input and navigation buttons', () => {
    /* Act */
    renderWithProviders(<RegistrationForm />);

    /* Assert */
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();

    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: /back/i });
    const nextButton = screen.getByRole('button', { name: /next/i });

    expect(backButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('disables Next when email is empty and enables it when email is valid', () => {
    /* Act */
    renderWithProviders(<RegistrationForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const nextButton = screen.getByRole('button', { name: /Next/i });

    /* Assert */
    expect(nextButton).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    expect(nextButton).not.toBeDisabled();
  });

  it('moves to password step when email is valid and Next is clicked', () => {
    /* Arrange */
    renderWithProviders(<RegistrationForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const nextButton = screen.getByRole('button', { name: /next/i });

    /* Act */
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.blur(emailInput);
    fireEvent.click(nextButton);

    /* Assert – on est rendu sur l’étape Password */
    expect(screen.getByText(/choose a secure password/i)).toBeInTheDocument();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it('calls register (mutate) with form values when password is valid and Create account is clicked', () => {
    /* Act */
    renderWithProviders(<RegistrationForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const nextButton = screen.getByRole('button', { name: /Next/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(nextButton);

    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: 'Abcdef1!' } });

    const createButton = screen.getByRole('button', { name: /Create account/i });
    fireEvent.click(createButton);

    /* Assert */
    expect(mutateSpy).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Abcdef1!',
    } satisfies RegisterRequestDto);
  });

  it('navigates to /admin and sets auth cookies when registration succeeds with tokens (no pendingReview)', () => {
    /* Arrange */
    currentOnSuccessPayload = {
      pendingReview: false,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      email: 'user@example.com',
      role: 'ADMIN',
    } as RegisterResponseDto;
    currentIsSuccess = true;
    currentData = currentOnSuccessPayload;

    /* Act */
    renderWithProviders(<RegistrationForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const nextButton = screen.getByRole('button', { name: /Next/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(nextButton);

    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: 'Abcdef1!' } });

    const createButton = screen.getByRole('button', { name: /Create account/i });
    fireEvent.click(createButton);

    vi.advanceTimersByTime(800);

    /* Assert */
    expect(setAuthCookiesMock).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true });
  });

  it('navigates to / (home) when registration succeeds with pendingReview', () => {
    /* Arrange */
    currentOnSuccessPayload = {
      pendingReview: true,
      email: 'user@example.com',
      role: 'USER',
    } as RegisterResponseDto;
    currentIsSuccess = true;
    currentData = currentOnSuccessPayload;

    /* Act */
    renderWithProviders(<RegistrationForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const nextButton = screen.getByRole('button', { name: /Next/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(nextButton);

    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: 'Abcdef1!' } });

    const createButton = screen.getByRole('button', { name: /Create account/i });
    fireEvent.click(createButton);

    vi.advanceTimersByTime(3500);

    /* Assert */
    expect(setAuthCookiesMock).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('Back button on first step navigates back to home (/)', () => {
    /* Act */
    renderWithProviders(<RegistrationForm />);

    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    /* Assert */
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('back button on password step only goes back to email step without navigation', () => {
    /* Arrange */
    renderWithProviders(<RegistrationForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const nextButton = screen.getByRole('button', { name: /next/i });
    const backButton = screen.getByRole('button', { name: /back/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.blur(emailInput);
    fireEvent.click(nextButton);

    expect(screen.getByText(/choose a secure password/i)).toBeInTheDocument();

    /* Act – on clique Back depuis l’étape Password */
    fireEvent.click(backButton);

    /* Assert – retour à l’étape Email, sans navigation */
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith('/', { replace: true });
  });

  it('renders error alert when useRegister returns an error', () => {
    /* Arrange */
    currentError = new Error('Registration failed');

    renderWithProviders(<RegistrationForm />);

    /* Act */
    const emailInput = screen.getByLabelText(/Email/i);
    const nextButton = screen.getByRole('button', { name: /Next/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(nextButton);

    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: 'Abcdef1!' } });

    /* Assert */
    expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
  });
});
