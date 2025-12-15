import { Anchor, Stack, Text, Container } from '@mantine/core';
import { copyrightYears } from '../../../utilities/copyright.utilities.ts';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();

  return (
    <Container py="sm">
      <Stack gap={2} align="center">
        <Text ta="center" size="sm">
          Copyright © {copyrightYears(2025)},{' '}
          <Anchor
            href="https://github.com/second-soul-studio/nanogpt-proxy/graphs/contributors"
            target="_blank"
          >
            {t('footer.authors')}
          </Anchor>
          . {t('footer.allRightsReserved')}
        </Text>
        <Text ta="center" size="xs" c="dimmed" maw={900}>
          <Anchor
            href="https://github.com/second-soul-studio/nanogpt-proxy/blob/master/LICENSE"
            target="_blank"
          >
            {t('footer.license')}
          </Anchor>
        </Text>

        <Text ta="center" size="xs" c="dimmed" maw={900}>
          {t('footer.disclaimer')}
        </Text>
      </Stack>
    </Container>
  );
}

export default Footer;
