import { describe, it, expect, beforeEach } from 'vitest';
import {
  setAuthCookies,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
} from '../cookies.utilities.ts';

describe('cookies.utilities', () => {
  beforeEach(() => {
    document.cookie = '';
  });

  it('setAuthCookies stores access and refresh tokens that can be read back', () => {
    /* Act */
    setAuthCookies({
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
    });

    /* Assert */
    expect(getAccessToken()).toBe('access-token-value');
    expect(getRefreshToken()).toBe('refresh-token-value');

    expect(document.cookie).toContain('nanogpt_access_token=');
    expect(document.cookie).toContain('nanogpt_refresh_token=');
  });

  it('clearAuthCookies removes both access and refresh tokens', () => {
    /* Act */
    setAuthCookies({
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
    });

    clearAuthCookies();

    /* Assert */
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('getAccessToken returns null when no cookie is set', () => {
    /* Assert */
    expect(getAccessToken()).toBeNull();
  });

  it('getRefreshToken returns null when no cookie is set', () => {
    /* Assert */
    expect(getRefreshToken()).toBeNull();
  });
});
