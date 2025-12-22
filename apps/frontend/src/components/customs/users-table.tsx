import { Badge, Button, Group, Text, UnstyledButton } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { PaginatedTable } from '../elements/tables/paginated-table';
import { fetchUsersPage } from '../../apis/users-api';
import { getAccessToken } from '../../utilities/cookies.utilities.ts';
import { API_BASE_URL } from '../../apis/api.ts';
import type { PaginationParams, PageDto } from '../elements/tables/pagination-types';
import type { UsePageQuery } from '../../hooks/usePageQuery';
import type { UsersDto } from '../../dtos/users.dto';
import type { ColumnDef } from '../elements/tables/column-def';
import { IconEdit, IconTrash, IconUserCheck, IconUserX } from '@tabler/icons-react';

type UsersTableProps = {
  onApproveDisapproveUser?: (user: UsersDto) => void;
  onEditUser?: (user: UsersDto) => void;
  onDeleteUser?: (user: UsersDto) => void;
  onBulkDisable?: (users: UsersDto[]) => void;
  onBulkEnable?: (users: UsersDto[]) => void;
};

function UsersTable(props: UsersTableProps) {
  const { onApproveDisapproveUser, onEditUser, onDeleteUser, onBulkDisable, onBulkEnable } = props;

  const columns: ColumnDef<UsersDto>[] = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      width: 90,
      sortable: true,
      render: (row) => (
        <Badge color={row.role === 'ADMIN' ? 'red' : 'blue'} variant="light">
          {row.role}
        </Badge>
      ),
    },
    {
      key: 'enabled',
      header: 'Enabled',
      width: 100,
      sortable: true,
      render: (row) => (
        <Badge color={row.enabled ? 'green' : 'gray'} variant={row.enabled ? 'filled' : 'outline'}>
          {row.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'api_key',
      header: 'API key',
      sortable: false,
      width: 100,
      render: (row) =>
        row.api_key ? (
          <Text size="sm">••••••••••••</Text>
        ) : (
          <Text size="sm" c="dimmed">
            None
          </Text>
        ),
    },
  ];

  const useUsersPage: UsePageQuery<UsersDto> = (params: PaginationParams) =>
    useQuery<PageDto<UsersDto>, Error>({
      queryKey: ['users', params],
      queryFn: () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error('Missing access token');
        }

        return fetchUsersPage(API_BASE_URL, token, params);
      },
      placeholderData: (prevData) => prevData,
    });

  return (
    <PaginatedTable<UsersDto>
      getRowId={(u) => u.email}
      columns={columns}
      initialLimit={10}
      usePageQuery={useUsersPage}
      renderActions={(row) => (
        <Group>
          {onApproveDisapproveUser && (
            <UnstyledButton size="xs" onClick={() => onApproveDisapproveUser(row)}>
              {row.enabled ? <IconUserX /> : <IconUserCheck />}
            </UnstyledButton>
          )}
          {onEditUser && (
            <UnstyledButton size="xs" onClick={() => onEditUser(row)}>
              <IconEdit />
            </UnstyledButton>
          )}

          {onDeleteUser && (
            <UnstyledButton size="xs" onClick={() => onDeleteUser(row)}>
              <IconTrash />
            </UnstyledButton>
          )}
        </Group>
      )}
      renderBottomBar={(selected) => (
        <>
          {onBulkEnable && (
            <Button size="xs" variant="light" color="green" onClick={() => onBulkEnable(selected)}>
              Enable selected
            </Button>
          )}
          {onBulkDisable && (
            <Button
              size="xs"
              variant="light"
              color="orange"
              onClick={() => onBulkDisable(selected)}
            >
              Disable selected
            </Button>
          )}
        </>
      )}
    />
  );
}

export default UsersTable;
