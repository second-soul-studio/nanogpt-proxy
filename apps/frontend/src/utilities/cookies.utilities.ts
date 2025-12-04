const ACCESS_TOKEN_COOKIE = 'nanogpt_access_token';
const REFRESH_TOKEN_COOKIE = 'nanogpt_refresh_token';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export function setAuthCookies(tokens: AuthTokens) {
  const maxAge = 7 * 24 * 60 * 60; // Should match admin-api config (7 days)

  setCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, { maxAge });
  setCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, { maxAge });
}

export function clearAuthCookies() {
  setCookie(ACCESS_TOKEN_COOKIE, '', { maxAge: 0 });
  setCookie(REFRESH_TOKEN_COOKIE, '', { maxAge: 0 });
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE);
}

type CookieOptions = {
  maxAge?: number;
  secure?: boolean;
  sameSite?: SameSite;
};

type SameSite = 'lax' | 'strict' | 'none';

function setCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, 'path=/'];

  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`);
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === ''; // cas de tests/jsdom

  let secure = options.secure;
  if (secure === undefined) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    secure = !isLocalhost && isHttps;
  }

  const sameSite: SameSite = options.sameSite ?? 'lax';

  if (sameSite === 'none' && !secure) {
    secure = true;
  }

  parts.push(`SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`);

  if (secure) {
    parts.push('Secure');
  }

  document.cookie = parts.join('; ');
}

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';').map((c) => c.trim());

  for (const cookie of cookies) {
    if (!cookie) {
      continue;
    }
    const [key, ...rest] = cookie.split('=');
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}
