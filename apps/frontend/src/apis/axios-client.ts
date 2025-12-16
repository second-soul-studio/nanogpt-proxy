import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utilities/cookies.utilities';
import { API_BASE_URL } from './api.ts';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: ((token: string | null) => void)[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && getRefreshToken()) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          new Error('No refresh token');
        }

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

        isRefreshing = false;
        queue.forEach((callback) => callback(data.accessToken));
        queue = [];

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        isRefreshing = false;
        queue.forEach((cb) => cb(null));
        queue = [];
        clearAuthCookies();
        window.location.href = '/';
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  },
);
