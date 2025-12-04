import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import App from '../app.tsx';
import i18nTest from '../i18ntest.ts';
import { renderWithProviders } from './utilities/test.utilities.tsx';

describe('<App />', () => {
  beforeEach(async () => {
    window.history.pushState({}, '', '/');
    await i18nTest.changeLanguage('en');
  });

  it('renders with route "/"', () => {
    /* Act */
    renderWithProviders(<App />, ['/']);

    /* Assert */
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should display not found if specified route does not exists', () => {
    /* Act */
    renderWithProviders(<App />, ['/doesnt-exists']);

    /* Assert */
    expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
  });
});
