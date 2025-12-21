import { Badge, Button, Group, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { UsersDto } from '../../dtos/users.dto';
import type { ColumnDef } from '../elements/tables/column-def';
import { PaginatedTable } from '../elements/tables/paginated-table';
import type { PaginationParams, PageDto } from '../elements/tables/pagination-types';
import type { UsePageQuery } from '../../hooks/usePageQuery';
import { fetchUsersPage } from '../../apis/users-api';

type UsersTableProps = {
  baseUrl: string;
  token: string;
  onEditUser?: (user: UsersDto) => void;
  onDeleteUser?: (user: UsersDto) => void;
  onBulkDisable?: (users: UsersDto[]) => void;
  onBulkEnable?: (users: UsersDto[]) => void;
};

function UsersTable(props: UsersTableProps) {
  const { baseUrl, token, onEditUser, onDeleteUser, onBulkDisable, onBulkEnable } = props;

  const columns: ColumnDef<UsersDto>[] = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
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
      queryFn: () => fetchUsersPage(baseUrl, token, params),
      placeholderData: (prevData) => prevData,
    });

  return (
    <PaginatedTable<UsersDto>
      getRowId={(u) => u.email}
      columns={columns}
      initialLimit={5}
      usePageQuery={useUsersPage}
      renderActions={(row) => (
        <Group gap="xs">
          {onEditUser && (
            <Button size="xs" variant="light" color="blue" onClick={() => onEditUser(row)}>
              Edit
            </Button>
          )}

          {onDeleteUser && (
            <Button size="xs" variant="light" color="red" onClick={() => onDeleteUser(row)}>
              Delete
            </Button>
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
