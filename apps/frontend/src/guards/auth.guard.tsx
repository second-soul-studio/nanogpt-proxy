import axios from 'axios';
import { useEffect, useState } from 'react';
import { Center, Loader } from '@mantine/core';
import { Navigate, Outlet, useLocation } from 'react-router';
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from '../utilities/cookies.utilities.ts';
import { isJwtExpired } from '../utilities/jwt.utilities.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type AuthStatus = 'checking' | 'authorized' | 'unauthorized';

export function AuthGuard() {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken) {
        setStatus('unauthorized');
        return;
      }

      if (!refreshToken) {
        clearAuthCookies();
        setStatus('unauthorized');
        return;
      }

      if (!isJwtExpired(accessToken)) {
        setStatus('authorized');
        return;
      }

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (cancelled) return;

        setAuthCookies({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        setStatus('authorized');
      } catch {
        if (cancelled) return;
        clearAuthCookies();
        setStatus('unauthorized');
      }
    };

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
