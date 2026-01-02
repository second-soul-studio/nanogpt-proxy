import type { PageDto, PaginationParams } from '../components/elements/tables/pagination-types.ts';
import type { UserDto } from '../dtos/userDto.ts';
import { api } from './axios-client.ts';

export async function fetchUsersPage(
  baseUrl: string,
  token: string,
  params: PaginationParams,
): Promise<PageDto<UserDto>> {
  const url = `${baseUrl}/v1/users`;

  const response = await api.get<PageDto<UserDto>>(url, {
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
