import { useTranslation } from 'react-i18next';
import { Group, Title } from '@mantine/core';
import { IconUsersPlus } from '@tabler/icons-react';
import UsersTable from '../customs/users-table.tsx';
import { getAccessToken } from '../../utilities/cookies.utilities.ts';
import { API_BASE_URL } from '../../apis/api.ts';

function AdministerForm() {
  const { t } = useTranslation();
  const accessToken = getAccessToken();

  return (
    <>
      <Group gap="xs" align="center" mb="xs">
        <IconUsersPlus size={22} />
        <Title order={3}>{t('menu.items.administer')}</Title>
      </Group>
      {accessToken && <UsersTable baseUrl={`${API_BASE_URL}`} token={accessToken} />}
    </>
  );
}

export default AdministerForm;
