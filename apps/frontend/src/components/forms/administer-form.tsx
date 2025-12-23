import { useTranslation } from 'react-i18next';
import { Group, Title } from '@mantine/core';
import { IconUsersPlus } from '@tabler/icons-react';
import UsersTable from '../customs/users-table.tsx';
import { useUser } from '../../hooks/useUser.ts';
import { useDisclosure } from '@mantine/hooks';
import { UserEditModal } from './modals/user-edit-modal.tsx';
import type { UsersDto } from '../../dtos/users.dto.ts';
import { useState } from 'react';

function AdministerForm() {
  const { t } = useTranslation();
  const { bulkDisable, bulkEnable, toggleEnabled } = useUser();
  const [editUserOpened, { open: openEditUser, close: closeEditUser }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<UsersDto | null>(null);

  return (
    <>
      <Group gap="xs" align="center" mb="xs">
        <IconUsersPlus size={22} />
        <Title order={3}>{t('menu.items.administer')}</Title>
      </Group>
      <UsersTable
        onApproveDisapproveUser={(user) => {
          console.info('Approve/DisapproveUser ' + user);
          toggleEnabled(user);
        }}
        onEditUser={(user) => {
          console.info('Edit', user);
          setEditingUser(user);
          openEditUser();
        }}
        onDeleteUser={(user) => {
          console.info('Delete ' + user);
          // ouvrir un confirm, puis call delete endpoint
        }}
        onBulkEnable={(users) => {
          bulkEnable(users);
        }}
        onBulkDisable={(users) => {
          bulkDisable(users);
        }}
      />

      <UserEditModal
        opened={editUserOpened}
        user={editingUser}
        onClose={() => {
          closeEditUser();
          setEditingUser(null);
        }}
      />
    </>
  );
}

export default AdministerForm;
