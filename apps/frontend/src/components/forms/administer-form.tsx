import { useTranslation } from 'react-i18next';
import { Group, Title } from '@mantine/core';
import { IconUsersPlus } from '@tabler/icons-react';
import UsersTable from '../customs/users-table.tsx';
import { useUser } from '../../hooks/useUser.ts';
import { useDisclosure } from '@mantine/hooks';
import { UserEditModal } from './modals/user-edit-modal.tsx';
import type { UserDto } from '../../dtos/userDto.ts';
import { useState } from 'react';
import { UserCreateModal } from './modals/user-create-modal.tsx';

function AdministerForm() {
  const { t } = useTranslation();
  const { bulkDisable, bulkEnable, deleteUser, toggleEnabled } = useUser();
  const [editUserOpened, { open: openEditUser, close: closeEditUser }] = useDisclosure(false);
  const [createUserOpened, createUserHandlers] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  return (
    <>
      <Group gap="xs" align="center" mb="xs">
        <IconUsersPlus size={22} />
        <Title order={3}>{t('menu.items.administer')}</Title>
      </Group>
      <UsersTable
        onAddUser={createUserHandlers.open}
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
          deleteUser({ email: user.email });
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

      <UserCreateModal opened={createUserOpened} onClose={createUserHandlers.close} />
    </>
  );
}

export default AdministerForm;
