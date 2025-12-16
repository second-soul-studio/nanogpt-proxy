import axios from 'axios';
import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utilities/cookies.utilities';
import type { AuthUser } from '../types/auth-user';
import { API_BASE_URL } from '../apis/api';
import { userFromAccessToken } from '../utilities/auth-user.utilities';
import { isJwtExpired } from '../utilities/jwt.utilities';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  setSession: (params: { accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const accessToken = getAccessToken();
    if (!accessToken || isJwtExpired(accessToken)) {
      return null;
    }
    return userFromAccessToken(accessToken);
  });

  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearAuthCookies();
    setUser(null);
  }, []);

  const setSession = useCallback(
    ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
      setAuthCookies({ accessToken, refreshToken });

      const nextUser = userFromAccessToken(accessToken);
      setUser(nextUser);
    },
    [],
  );

  const tryRefresh = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return null;
    }

    try {
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${API_BASE_URL}/v1/auth/refresh/`, null, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return userFromAccessToken(data.accessToken);
    } catch (e) {
      clearSession();
      return null;
    }
  }, [clearSession, setSession]);

  useEffect(() => {
    const init = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      if (!isJwtExpired(accessToken)) {
        const existingUser = userFromAccessToken(accessToken);
        setUser(existingUser);
        setIsLoading(false);
        return;
      }

      await tryRefresh();
      setIsLoading(false);
    };

    void init();
  }, [tryRefresh]);

  const value: AuthContextValue = {
    user,
    isLoading,
    setSession,
    clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
