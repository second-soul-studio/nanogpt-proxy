import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import type { UserDto } from '../../../dtos/userDto.ts';
import type { ColumnDef } from '../../elements/tables/column-def.ts';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities.tsx';
import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '../../../utilities/cookies.utilities.ts';
import { fetchUsersPage } from '../../../apis/users-api';
import UsersTable from '../users-table.tsx';

import i18nTest from '../../../i18ntest.ts';

type PaginatedTableMockProps<T> = {
  getRowId: (row: T) => string;
  columns: ColumnDef<T>[];
  initialLimit: number;
  usePageQuery: (params: unknown) => unknown;
  renderActions: (row: T) => React.ReactNode;
  renderBottomBar: (selected: T[]) => React.ReactNode;
};

type UsersPageMeta = {
  page: number;
  totalPages: number;
  totalItems: number;
};

type UsersPageDto = {
  data: UserDto[];
  meta: UsersPageMeta;
};

type UsersQueryConfig = {
  queryKey: [string, unknown];
  queryFn: () => Promise<UsersPageDto>;
  placeholderData: (previousPage: UsersPageDto | undefined) => UsersPageDto | undefined;
};

let latestPaginatedProps: PaginatedTableMockProps<UserDto> | undefined;

const sampleRow: UserDto = {
  email: 'user1@example.com',
  enabled: true,
  role: 'USER',
  api_key: '',
  password: 'Secret!',
};

const selectedRows: UserDto[] = [sampleRow];

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();

  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('../../../utilities/cookies.utilities.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utilities/cookies.utilities.ts')>();

  return {
    __esModule: true,
    ...actual,
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
  };
});

vi.mock('../../../apis/users-api', () => ({
  __esModule: true,
  fetchUsersPage: vi.fn(),
}));

vi.mock('../../elements/tables/paginated-table', () => ({
  __esModule: true,
  PaginatedTable: (props: PaginatedTableMockProps<UserDto>) => {
    latestPaginatedProps = props;

    return (
      <div data-testid="paginated-table-mock">
        <div data-testid="actions-container">{props.renderActions(sampleRow)}</div>
        <div data-testid="bottom-bar-container">{props.renderBottomBar(selectedRows)}</div>
      </div>
    );
  },
}));

const useQueryMock = useQuery as unknown as Mock;
const getAccessTokenMock = getAccessToken as unknown as Mock;
const fetchUsersPageMock = fetchUsersPage as unknown as Mock;

describe('<UsersTable />', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    latestPaginatedProps = undefined;
    await i18nTest.changeLanguage('en');
  });

  it('configure PaginatedTable with the correct columns and basic settings', () => {
    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();
    const props = latestPaginatedProps!;

    expect(props.initialLimit).toBe(10);
    expect(props.getRowId(sampleRow)).toBe(sampleRow.email);

    const keys = props.columns.map((c) => c.key);
    expect(keys).toEqual(['email', 'role', 'enabled', 'api_key']);
  });

  it("renders the 'Add user' button when onAddUser is provided and triggers the handler on click", () => {
    const onAddUser = vi.fn();

    renderWithProviders(<UsersTable onAddUser={onAddUser} />);

    const addButton = screen.getByRole('button', { name: /add user/i });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);

    expect(onAddUser).toHaveBeenCalledTimes(1);
  });

  it('triggers the line handlers (approve/edit/delete) for a USER', () => {
    const onApproveDisapproveUser = vi.fn();
    const onEditUser = vi.fn();
    const onDeleteUser = vi.fn();

    renderWithProviders(
      <UsersTable
        onApproveDisapproveUser={onApproveDisapproveUser}
        onEditUser={onEditUser}
        onDeleteUser={onDeleteUser}
      />,
    );

    const actionsContainer = screen.getByTestId('actions-container');
    const buttons = within(actionsContainer).getAllByRole('button');

    expect(buttons.length).toBe(3);

    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);

    expect(onApproveDisapproveUser).toHaveBeenCalledTimes(1);
    expect(onApproveDisapproveUser).toHaveBeenCalledWith(sampleRow);

    expect(onEditUser).toHaveBeenCalledTimes(1);
    expect(onEditUser).toHaveBeenCalledWith(sampleRow);

    expect(onDeleteUser).toHaveBeenCalledTimes(1);
    expect(onDeleteUser).toHaveBeenCalledWith(sampleRow);
  });

  it('disables the actions (approve/delete) for an ADMIN, but not "edit"', () => {
    const onApproveDisapproveUser = vi.fn();
    const onEditUser = vi.fn();
    const onDeleteUser = vi.fn();

    renderWithProviders(
      <UsersTable
        onApproveDisapproveUser={onApproveDisapproveUser}
        onEditUser={onEditUser}
        onDeleteUser={onDeleteUser}
      />,
    );

    expect(latestPaginatedProps).toBeDefined();

    const adminRow: UserDto = {
      email: 'admin@example.com',
      enabled: true,
      role: 'ADMIN',
      api_key: '',
      password: 'Admin!',
    };

    const { getAllByRole } = renderWithProviders(
      <>{latestPaginatedProps!.renderActions(adminRow)}</>,
    );

    const buttons = getAllByRole('button');

    expect(buttons.length).toBeGreaterThanOrEqual(3);

    const [approveButton, editButton, deleteButton] = buttons.slice(-3);

    expect(approveButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
    expect(editButton).not.toBeDisabled();
  });

  it('triggers the bulk enable/disable handlers with the selection', () => {
    const onBulkEnable = vi.fn();
    const onBulkDisable = vi.fn();

    renderWithProviders(<UsersTable onBulkEnable={onBulkEnable} onBulkDisable={onBulkDisable} />);

    const bottomBar = screen.getByTestId('bottom-bar-container');
    const bulkButtons = within(bottomBar).getAllByRole('button');

    expect(bulkButtons.length).toBe(2);

    fireEvent.click(bulkButtons[0]);
    fireEvent.click(bulkButtons[1]);

    expect(onBulkEnable).toHaveBeenCalledTimes(1);
    expect(onBulkEnable).toHaveBeenCalledWith(selectedRows);

    expect(onBulkDisable).toHaveBeenCalledTimes(1);
    expect(onBulkDisable).toHaveBeenCalledWith(selectedRows);
  });

  it('render of the "role" column displays the translated label', () => {
    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();
    const roleCol = latestPaginatedProps!.columns.find((c) => c.key === 'role');
    expect(roleCol).toBeDefined();
    expect(roleCol!.render).toBeDefined();

    const adminRow: UserDto = {
      email: 'admin@example.com',
      enabled: true,
      role: 'ADMIN',
      api_key: '',
      password: 'Admin!',
    };

    const { getByText } = renderWithProviders(<>{roleCol!.render!(adminRow)}</>);

    expect(getByText(/admin/i)).toBeInTheDocument();
  });

  it('Rendering the "enabled" column displays Enabled / Disabled depending on the value', () => {
    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();
    const enabledCol = latestPaginatedProps!.columns.find((c) => c.key === 'enabled');
    expect(enabledCol).toBeDefined();
    expect(enabledCol!.render).toBeDefined();

    const rowEnabled: UserDto = {
      email: 'enabled@example.com',
      enabled: true,
      role: 'USER',
      api_key: '',
      password: '',
    };

    const rowDisabled: UserDto = {
      email: 'disabled@example.com',
      enabled: false,
      role: 'USER',
      api_key: '',
      password: '',
    };

    const { getByText: getByTextEnabled } = renderWithProviders(
      <>{enabledCol!.render!(rowEnabled)}</>,
    );
    const { getByText: getByTextDisabled } = renderWithProviders(
      <>{enabledCol!.render!(rowDisabled)}</>,
    );

    expect(getByTextEnabled(/enabled/i)).toBeInTheDocument();
    expect(getByTextDisabled(/disabled/i)).toBeInTheDocument();
  });

  it('rendering the column "api_key" hides the key or displays "none"', () => {
    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();
    const apiKeyCol = latestPaginatedProps!.columns.find((c) => c.key === 'api_key');
    expect(apiKeyCol).toBeDefined();
    expect(apiKeyCol!.render).toBeDefined();

    const rowWithKey: UserDto = {
      email: 'withkey@example.com',
      enabled: true,
      role: 'USER',
      api_key: 'some-key',
      password: '',
    };

    const rowWithoutKey: UserDto = {
      email: 'nokey@example.com',
      enabled: true,
      role: 'USER',
      api_key: '',
      password: '',
    };

    const { getByText: getByTextMasked } = renderWithProviders(
      <>{apiKeyCol!.render!(rowWithKey)}</>,
    );
    const { getByText: getByTextNone } = renderWithProviders(
      <>{apiKeyCol!.render!(rowWithoutKey)}</>,
    );

    expect(getByTextMasked('••••••••••••')).toBeInTheDocument();
    expect(getByTextNone(/none/i)).toBeInTheDocument();
  });

  it('configure useUsersPage to call useQuery with token and fetchUsersPage', async () => {
    getAccessTokenMock.mockReturnValue('token-123');

    const queryResult = {
      data: undefined as UsersPageDto | undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    };

    let capturedConfig: UsersQueryConfig | undefined;

    useQueryMock.mockImplementation((config: UsersQueryConfig) => {
      capturedConfig = config;
      return queryResult;
    });

    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();

    const params = {
      page: 1,
      limit: 10,
      sortBy: undefined,
      sortDir: undefined,
    };

    const result = latestPaginatedProps!.usePageQuery(params as unknown);
    expect(result).toBe(queryResult);

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    expect(capturedConfig).toBeDefined();

    const effectiveConfig = capturedConfig!;
    expect(effectiveConfig.queryKey).toEqual(['users', params]);

    fetchUsersPageMock.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, totalPages: 1, totalItems: 0 },
    });

    await effectiveConfig.queryFn();

    expect(getAccessTokenMock).toHaveBeenCalled();
    expect(fetchUsersPageMock).toHaveBeenCalledWith(expect.any(String), 'token-123', params);

    const previousPage: UsersPageDto = {
      data: [sampleRow],
      meta: { page: 1, totalPages: 1, totalItems: 1 },
    };

    expect(effectiveConfig.placeholderData(previousPage)).toBe(previousPage);
  });

  it('throws a "Missing access token" error when no token is present', () => {
    getAccessTokenMock.mockReturnValue(undefined);

    let capturedConfig: UsersQueryConfig | undefined;

    useQueryMock.mockImplementation((config: UsersQueryConfig) => {
      capturedConfig = config;
      return {
        data: undefined as UsersPageDto | undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      };
    });

    renderWithProviders(<UsersTable />);

    const params = {
      page: 1,
      limit: 10,
      sortBy: undefined,
      sortDir: undefined,
    };

    latestPaginatedProps!.usePageQuery(params as unknown);

    expect(capturedConfig).toBeDefined();
    const effectiveConfig = capturedConfig!;

    expect(() => effectiveConfig.queryFn()).toThrow('Missing access token');
    expect(getAccessTokenMock).toHaveBeenCalled();
    expect(fetchUsersPageMock).not.toHaveBeenCalled();
  });
});
