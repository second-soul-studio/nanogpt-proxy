import axios from 'axios';
import { API_BASE_URL } from '../apis/api.ts';
import type { ConfigurationDto } from '../dtos/configuration.dto.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchConfiguration(): Promise<ConfigurationDto> {
  const { data } = await axios.get<ConfigurationDto>(`${API_BASE_URL}/v1/configuration`, {
    withCredentials: true,
  });
  return data;
}

async function updateConfiguration(payload: Partial<ConfigurationDto>): Promise<ConfigurationDto> {
  const { data } = await axios.put<ConfigurationDto>(`${API_BASE_URL}/v1/configuration`, payload, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}

export function useConfiguration() {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['configuration'],
    queryFn: fetchConfiguration,
  });

  const mutation = useMutation({
    mutationKey: ['configuration', 'update'],
    mutationFn: (payload: Partial<ConfigurationDto>) => updateConfiguration(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['configuration'], updated);
    },
  });

  return {
    config: data,
    isLoading: isLoading || isFetching,
    error,
    updateConfig: mutation.mutate,
    updateConfigAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
