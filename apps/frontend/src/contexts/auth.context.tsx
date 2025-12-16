import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utilities/cookies.utilities';

import axios from 'axios';
import type { AuthUser } from '../types/auth-user.ts';
import { API_BASE_URL } from '../apis/api.ts';
import { userFromAccessToken } from '../utilities/auth-user.utilities,ts.ts';
import { isJwtExpired } from '../utilities/jwt.utilities.ts';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const performLogout = useCallback(() => {
    clearAuthCookies();
    setUser(null);
  }, []);

  const tryRefresh = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      performLogout();
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

      setAuthCookies({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      const refreshedUser = userFromAccessToken(data.accessToken);
      setUser(refreshedUser);
      return refreshedUser;
    } catch (e) {
      performLogout();
      return null;
    }
  }, [performLogout]);

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
    setUser,
    logout: performLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
