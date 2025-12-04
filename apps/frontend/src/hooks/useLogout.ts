import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import type { LogoutResponseDto } from '../dtos/logout-response.dto';
import { getAccessToken } from '../utilities/cookies.utilities';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function logoutRequest(): Promise<LogoutResponseDto> {
  const url = `${API_BASE_URL}/v1/auth/logout/`;

  const headers: Record<string, string> = {};

  const accessToken = getAccessToken?.();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const { data } = await axios.post<LogoutResponseDto>(url, undefined, {
    withCredentials: true,
    headers,
  });

  return data;
}

type UseLogoutOptions = {
  onSuccess?: (data: LogoutResponseDto) => void;
  onError?: (error: Error) => void;
};

export function useLogout(options?: UseLogoutOptions) {
  return useMutation<LogoutResponseDto, Error, void>({
    mutationFn: logoutRequest,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
