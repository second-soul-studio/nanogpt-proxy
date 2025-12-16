import { Box, Progress, List, ThemeIcon, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const PASSWORD_MIN_LENGTH = 6;
const specialCharsRegex = /[!@#$%^&*()\-_=+[{}\];:,.<>/?]/;

type PasswordStrengthMeterProps = {
  password: string;
};

function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useTranslation();

  const { strength, label, rules } = useMemo(() => {
    const lengthOk = password.length >= PASSWORD_MIN_LENGTH;
    const upperOk = /[A-Z]/.test(password);
    const lowerOk = /[a-z]/.test(password);
    const specialOk = specialCharsRegex.test(password);

    const passed = [lengthOk, upperOk, lowerOk, specialOk].filter(Boolean).length;
    const strength = (passed / 4) * 100;

    let labelKey: string;
    if (strength === 0) {
      labelKey = 'input.password.strength.empty';
    } else if (strength <= 25) {
      labelKey = 'input.password.strength.weak';
    } else if (strength <= 50) {
      labelKey = 'input.password.strength.fair';
    } else if (strength <= 75) {
      labelKey = 'input.password.strength.good';
    } else {
      labelKey = 'input.password.strength.strong';
    }

    return {
      strength,
      label: t(labelKey),
      rules: [
        { ok: lengthOk, text: t('input.password.rules.length') },
        { ok: upperOk, text: t('input.password.rules.uppercase') },
        { ok: lowerOk, text: t('input.password.rules.lowercase') },
        { ok: specialOk, text: t('input.password.rules.special') },
      ],
    };
  }, [password, t]);

  if (!password) {
    return (
      <Box mt="xs">
        <Text size="xs" c="dimmed">
          {t('input.password.strength.label')}
        </Text>
        <List spacing={4} size="xs" mt={4}>
          {[
            'input.password.rules.length',
            'input.password.rules.uppercase',
            'input.password.rules.lowercase',
            'input.password.rules.special',
          ].map((key) => (
            <List.Item
              key={key}
              icon={
                <ThemeIcon color="gray" size={16} radius="xl">
                  <IconX size={12} />
                </ThemeIcon>
              }
            >
              {t(key)}
            </List.Item>
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box mt="xs">
      <Text size="xs" c="dimmed">
        {t('input.password.strength.label')}: {label}
      </Text>

      <Progress value={strength} size="sm" mt={4} />

      <List spacing={4} size="xs" mt={8}>
        {rules.map((rule) => (
          <List.Item
            key={rule.text}
            icon={
              <ThemeIcon color={rule.ok ? 'teal' : 'red'} size={16} radius="xl">
                {rule.ok ? <IconCheck size={12} /> : <IconX size={12} />}
              </ThemeIcon>
            }
          >
            {rule.text}
          </List.Item>
        ))}
      </List>
    </Box>
  );
}

export default PasswordStrengthMeter;
