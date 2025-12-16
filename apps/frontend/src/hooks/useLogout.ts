import { useMutation } from '@tanstack/react-query';
import type { LogoutResponseDto } from '../dtos/logout-response.dto';
import { getAccessToken } from '../utilities/cookies.utilities';
import { API_BASE_URL } from '../apis/api.ts';
import { api } from '../apis/axios-client.ts';

async function logoutRequest(): Promise<LogoutResponseDto> {
  const url = `${API_BASE_URL}/v1/auth/logout/`;

  const headers: Record<string, string> = {};

  const accessToken = getAccessToken?.();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const { data } = await api.post<LogoutResponseDto>(url, undefined, {
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
