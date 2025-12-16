import { useMutation } from '@tanstack/react-query';
import type { LoginRequestDto } from '../dtos/login-request.dto.ts';
import type { LoginResponseDto } from '../dtos/login-response.dto.ts';
import { API_BASE_URL } from '../apis/api.ts';
import { api } from '../apis/axios-client.ts';

async function loginRequest(payload: LoginRequestDto): Promise<LoginResponseDto> {
  const url = `${API_BASE_URL}/v1/auth/login/`;

  const { data } = await api.post<LoginResponseDto>(url, payload, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return data;
}

type UseLoginOptions = {
  onSuccess?: (data: LoginResponseDto) => void;
  onError?: (error: Error) => void;
};

export function useLogin(options?: UseLoginOptions) {
  return useMutation<LoginResponseDto, Error, LoginRequestDto>({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
