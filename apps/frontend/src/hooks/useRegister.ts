import type { RegisterRequestDto } from '../dtos/register-request.dto.ts';
import type { RegisterResponseDto } from '../dtos/register-response.dto.ts';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { API_BASE_URL } from '../apis/api.ts';
import { api } from '../apis/axios-client.ts';

async function registerRequest(payload: RegisterRequestDto): Promise<RegisterResponseDto> {
  const url = `${API_BASE_URL}/v1/auth/register/`;
  const { data } = await api.post<RegisterResponseDto>(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });
  return data;
}

export function useRegister(
  options?: UseMutationOptions<RegisterResponseDto, Error, RegisterRequestDto>,
) {
  return useMutation<RegisterResponseDto, Error, RegisterRequestDto>({
    mutationKey: ['register'],
    mutationFn: registerRequest,
    ...options,
  });
}
