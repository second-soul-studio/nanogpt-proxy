import {
  Alert,
  Box,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import classes from './login-form.module.scss';
import { useLogin } from '../../hooks/useLogin.ts';
import { useForm } from '@mantine/form';
import type { LoginRequestDto } from '../../dtos/login-request.dto.ts';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useConfiguration } from '../../hooks/useConfiguration.ts';
import { useAuth } from '../../hooks/useAuth.ts';

function LoginForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { config: config } = useConfiguration();
  const { setSession } = useAuth();

  const {
    mutate: login,
    isPending,
    error,
  } = useLogin({
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      navigate('/admin', { replace: true });
    },
    onError: (err) => {
      console.error('Login failed', err);
    },
  });

  /* TODO: We should use Yup - https://mantine.dev/form/schema-validation/#yup */
  const form = useForm<LoginRequestDto>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : t('input.email.errors.format')),
      password: (value) => (value.trim().length >= 6 ? null : t('input.password.errors.min')),
    },
  });

  const handleSubmit = (values: LoginRequestDto) => {
    login({
      email: values.email,
      password: values.password,
    });
  };

  const enableForgot = config?.forgetPassword ?? false;
  const enableRegistration = config?.registration ?? false;
  const showActions = enableForgot || enableRegistration;

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        {t('login.title')}
      </Title>

      <Text className={classes.subtitle}>NanoGPT Proxy version 0.0.1</Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            withAsterisk
            label={t('input.email.label')}
            data-test-id="input-email"
            data-cy="input-email"
            placeholder={t('input.email.placeholder')}
            radius="md"
            mt="xs"
            {...form.getInputProps('email')}
          />

          <PasswordInput
            withAsterisk
            label={t('input.password.label')}
            data-test-id="input-password"
            data-cy="input-password"
            placeholder={t('input.password.placeholder')}
            radius="md"
            mt="md"
            {...form.getInputProps('password')}
          />

          {!!error && (
            <Alert mt="md" color="red" variant="light" icon={<IconAlertCircle size={16} />}>
              {error?.message}
            </Alert>
          )}

          <Button fullWidth mt="xl" radius="md" type="submit" loading={isPending}>
            {t('button.login.label')}
          </Button>

          {showActions && (
            <Box mt="md">
              <Group justify="space-between" gap="xs" wrap="wrap">
                {enableForgot && (
                  <Button variant="subtle" size="xs" onClick={() => navigate('/forgot-password')}>
                    {t('login.forgotPassword')}
                  </Button>
                )}

                {enableRegistration && (
                  <Button variant="outline" size="xs" onClick={() => navigate('/registration')}>
                    {t('login.register')}
                  </Button>
                )}
              </Group>

              {enableRegistration && config?.reviewPendingRegistration && (
                <Text mt="xs" size="xs" c="dimmed">
                  {t('login.registrationPendingReviewHint')}
                </Text>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginForm;
