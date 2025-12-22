import type { PageDto, PaginationParams } from '../components/elements/tables/pagination-types.ts';
import type { UsersDto } from '../dtos/users.dto.ts';
import { api } from './axios-client.ts';

export async function fetchUsersPage(
  baseUrl: string,
  token: string,
  params: PaginationParams,
): Promise<PageDto<UsersDto>> {
  const url = `${baseUrl}/v1/users`;

  const response = await api.get<PageDto<UsersDto>>(url, {
    params: {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
