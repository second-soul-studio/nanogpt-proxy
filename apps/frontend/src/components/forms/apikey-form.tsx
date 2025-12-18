import { useTranslation } from 'react-i18next';
import { Group, Title } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

function ApiKeyForm() {
  const { t } = useTranslation();

  return (
    <>
      <Group gap="xs" align="center" mb="xs">
        <IconSettings size={22} />
        <Title order={3}>{t('menu.items.apikey')}</Title>
      </Group>
    </>
  );
}

export default ApiKeyForm;
