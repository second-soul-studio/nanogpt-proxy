import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../axios-client.ts';
import { fetchUsersPage } from '../users-api';
import type { Mock } from 'vitest';
import type { PageDto, PaginationParams } from '../../components/elements/tables/pagination-types';
import type { UserDto } from '../../dtos/userDto.ts';

vi.mock('../axios-client.ts', () => {
  return {
    api: {
      get: vi.fn(),
    },
  };
});

describe('fetchUsersPage', () => {
  let getMock: Mock;

  beforeEach(() => {
    getMock = api.get as unknown as Mock;
    getMock.mockReset();
  });

  it('calls api.get with the correct URL, params and headers and returns the page', async () => {
    /* Arrange */
    const baseUrl = 'https://api.example.com';
    const token = 'test-token';

    const params = {
      page: 2,
      limit: 25,
      sortBy: 'email',
      sortDir: 'ASC',
    } as const;

    const mockPage: PageDto<UserDto> = {
      data: [
        {
          email: 'user1@example.com',
          enabled: true,
          role: 'USER',
          password: 'So-Secure!',
          api_key: '',
        },
        {
          email: 'admin@example.com',
          enabled: true,
          role: 'ADMIN',
          password: 'So-Secure!',
          api_key: '',
        },
      ],
      meta: {
        page: 2,
        limit: 25,
        totalItems: 50,
        totalPages: 2,
      },
    };

    getMock.mockResolvedValue({ data: mockPage });

    /* Act */
    const result = await fetchUsersPage(baseUrl, token, params);

    /* Assert */
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(`${baseUrl}/v1/users`, {
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

    expect(result).toEqual(mockPage);
  });

  it('propagates errors from api.get', async () => {
    /* Arrange */
    const baseUrl = 'https://api.example.com';
    const token = 'test-token';

    const params = {
      page: 1,
      limit: 10,
    } as PaginationParams;

    const error = new Error('Network error');
    getMock.mockRejectedValue(error);

    /* Act & Assert */
    expect(fetchUsersPage(baseUrl, token, params)).rejects.toThrow('Network error');
  });
});
