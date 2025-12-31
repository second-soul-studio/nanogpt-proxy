import '@testing-library/jest-dom/vitest';
import { type ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useUser } from '../useUser';
import type { UsersDto, UserRole } from '../../dtos/users.dto';
import type { PageDto } from '../../components/elements/tables/pagination-types';

vi.mock('../../utilities/cookies.utilities', () => ({
  getAccessToken: vi.fn(),
}));

vi.mock('../../apis/axios-client.ts', () => ({
  api: {
    delete: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { getAccessToken } from '../../utilities/cookies.utilities';
import { api } from '../../apis/axios-client';

const getAccessTokenMock = getAccessToken as unknown as ReturnType<typeof vi.fn>;
// @ts-expect-error: mocked par vi.mock
const apiMock = api as {
  delete: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// Petit helper pour un PageDto<User>
function makePage(users: UsersDto[]): PageDto<UsersDto> {
  return {
    data: users,
    meta: {
      page: 1,
      limit: users.length,
      totalItems: users.length,
      totalPages: 1,
    },
  };
}

const makeUser = (overrides?: Partial<UsersDto>): UsersDto => ({
  email: 'john@example.com',
  enabled: true,
  role: 'USER' as UserRole,
  password: 'So-Secure!',
  api_key: '',
  ...overrides,
});

describe('useUser hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessTokenMock.mockReturnValue('test-token');
  });

  it('createUser calls POST /v1/users and invalidates users queries', async () => {
    /* Arrange */
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);

    apiMock.post.mockResolvedValueOnce({}); // on ne lit pas la réponse

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUser(), { wrapper });

    /* Act */
    await act(async () => {
      await result.current.createUserAsync({
        email: 'new@example.com',
        password: 'Secret123!',
        enabled: true,
        role: 'USER',
        api_key: undefined,
      });
    });

    /* Assert */
    expect(apiMock.post).toHaveBeenCalledTimes(1);
    expect(apiMock.post.mock.calls[0][0]).toContain('/v1/users');

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['users'],
          refetchType: 'active',
        }),
      );
    });
  });

  it('updateUser updates cache on success', async () => {
    /* Arrange */
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);

    const existingUser = makeUser({ email: 'john@example.com', enabled: true });
    const otherUser = makeUser({ email: 'jane@example.com', enabled: false });

    const initialKey = ['users', { page: 1, limit: 10 }];
    queryClient.setQueryData<PageDto<UsersDto>>(initialKey, makePage([existingUser, otherUser]));

    const updatedUser: UsersDto = { ...existingUser, enabled: false };

    apiMock.put.mockResolvedValueOnce({ data: updatedUser });

    const { result } = renderHook(() => useUser(), { wrapper });

    /* Act */
    await act(async () => {
      await result.current.updateUserAsync({
        email: 'john@example.com',
        enabled: false,
      });
    });

    /* Assert */
    expect(apiMock.put).toHaveBeenCalledTimes(1);
    expect(apiMock.put.mock.calls[0][0]).toContain('/v1/users');

    await waitFor(() => {
      const cached = queryClient.getQueryData<PageDto<UsersDto>>(initialKey);
      expect(cached).toBeDefined();
      expect(cached!.data.find((u) => u.email === 'john@example.com')!.enabled).toBe(false);
      expect(cached!.data.find((u) => u.email === 'jane@example.com')!.enabled).toBe(false);
    });
  });

  it('toggleEnabled calls update mutation with inverted enabled flag', async () => {
    /* Arrange */
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);

    const user = makeUser({ email: 'toggle@example.com', enabled: true });
    const updatedUser: UsersDto = { ...user, enabled: false };

    apiMock.put.mockResolvedValueOnce({ data: updatedUser });

    const { result } = renderHook(() => useUser(), { wrapper });

    /* Act */
    await act(async () => {
      result.current.toggleEnabled(user);
    });

    /* Assert */
    expect(apiMock.put).toHaveBeenCalledTimes(1);
    const [, payload] = apiMock.put.mock.calls[0];
    expect((payload as any).data ?? payload).toBeDefined();

    expect(payload).toEqual(
      expect.objectContaining({
        email: 'toggle@example.com',
        enabled: false,
      }),
    );
  });

  it('deleteUser removes user from cache and decrements totalItems', async () => {
    /* Arrange */
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);

    const user1 = makeUser({ email: 'user1@example.com' });
    const user2 = makeUser({ email: 'user2@example.com' });

    const key = ['users', { page: 1, limit: 10 }];
    queryClient.setQueryData<PageDto<UsersDto>>(key, makePage([user1, user2]));

    apiMock.delete.mockResolvedValueOnce({});

    const { result } = renderHook(() => useUser(), { wrapper });

    /* Act */
    await act(async () => {
      await result.current.deleteUser({ email: 'user2@example.com' });
    });

    /* Assert */
    expect(apiMock.delete).toHaveBeenCalledTimes(1);
    expect(apiMock.delete.mock.calls[0][0]).toContain('/v1/users');

    await waitFor(() => {
      const cached = queryClient.getQueryData<PageDto<UsersDto>>(key);
      expect(cached).toBeDefined();
      expect(cached!.data.map((u) => u.email)).toEqual(['user1@example.com']);
      expect(cached!.meta.totalItems).toBe(1);
    });
  });

  it('bulkEnable sets enabled=true for non-admin users and leaves admins untouched', async () => {
    /* Arrange */
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);

    const user1 = makeUser({ email: 'user1@example.com', enabled: false, role: 'USER' });
    const user2 = makeUser({ email: 'admin@example.com', enabled: false, role: 'ADMIN' });
    const user3 = makeUser({ email: 'user2@example.com', enabled: false, role: 'USER' });

    const key = ['users', { page: 1, limit: 10 }];
    queryClient.setQueryData<PageDto<UsersDto>>(key, makePage([user1, user2, user3]));

    const serverUpdated: UsersDto[] = [
      { ...user1, enabled: true },
      { ...user2, enabled: false },
      { ...user3, enabled: true },
    ];

    apiMock.put.mockResolvedValueOnce({ data: serverUpdated });

    const { result } = renderHook(() => useUser(), { wrapper });

    /* Act */
    await act(async () => {
      result.current.bulkEnable([user1, user2, user3]);
    });

    /* Assert */
    expect(apiMock.put).toHaveBeenCalledTimes(1);
    expect(apiMock.put.mock.calls[0][0]).toContain('/v1/users/bulk');

    const payload = apiMock.put.mock.calls[0][1];
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: 'user1@example.com', enabled: true }),
        expect.objectContaining({ email: 'user2@example.com', enabled: true }),
      ]),
    );
    expect((payload as any[]).find((p) => p.email === 'admin@example.com')).toBeUndefined();

    await waitFor(() => {
      const cached = queryClient.getQueryData<PageDto<UsersDto>>(key);
      expect(cached).toBeDefined();
      const byEmail = new Map(cached!.data.map((u) => [u.email, u]));

      expect(byEmail.get('user1@example.com')!.enabled).toBe(true);
      expect(byEmail.get('user2@example.com')!.enabled).toBe(true);
      expect(byEmail.get('admin@example.com')!.enabled).toBe(false);
    });
  });

  it('bulkDisable sets enabled=false for non-admin users and leaves admins untouched', async () => {
    /* Arrange */
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);

    const user1 = makeUser({ email: 'user1@example.com', enabled: true, role: 'USER' });
    const user2 = makeUser({ email: 'admin@example.com', enabled: true, role: 'ADMIN' });
    const user3 = makeUser({ email: 'user2@example.com', enabled: true, role: 'USER' });

    const key = ['users', { page: 1, limit: 10 }];
    queryClient.setQueryData<PageDto<UsersDto>>(key, makePage([user1, user2, user3]));

    const serverUpdated: UsersDto[] = [
      { ...user1, enabled: false },
      { ...user2, enabled: true },
      { ...user3, enabled: false },
    ];

    apiMock.put.mockResolvedValueOnce({ data: serverUpdated });

    const { result } = renderHook(() => useUser(), { wrapper });

    /* Act */
    await act(async () => {
      result.current.bulkDisable([user1, user2, user3]);
    });

    /* Assert */
    expect(apiMock.put).toHaveBeenCalledTimes(1);
    expect(apiMock.put.mock.calls[0][0]).toContain('/v1/users/bulk');

    const payload = apiMock.put.mock.calls[0][1];
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: 'user1@example.com', enabled: false }),
        expect.objectContaining({ email: 'user2@example.com', enabled: false }),
      ]),
    );
    expect((payload as any[]).find((p) => p.email === 'admin@example.com')).toBeUndefined();

    await waitFor(() => {
      const cached = queryClient.getQueryData<PageDto<UsersDto>>(key);
      expect(cached).toBeDefined();
      const byEmail = new Map(cached!.data.map((u) => [u.email, u]));

      expect(byEmail.get('user1@example.com')!.enabled).toBe(false);
      expect(byEmail.get('user2@example.com')!.enabled).toBe(false);
      expect(byEmail.get('admin@example.com')!.enabled).toBe(true);
    });
  });
});
