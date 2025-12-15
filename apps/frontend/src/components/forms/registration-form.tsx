import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stepper,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { setAuthCookies } from '../../utilities/cookies.utilities';
import type { RegisterRequestDto } from '../../dtos/register-request.dto.ts';
import { useRegister } from '../../hooks/useRegister.ts';

function RegistrationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  const form = useForm<RegisterRequestDto>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : t('input.email.errors.format')),
      password: (value) => (value.trim().length >= 6 ? null : t('input.password.errors.min')),
    },
  });

  const {
    mutate: register,
    isPending,
    isSuccess,
    data,
    error,
  } = useRegister({
    onSuccess: (result) => {
      if (!result.pendingReview && result.accessToken && result.refreshToken) {
        setAuthCookies({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
        setActive(2);
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 800);
        return;
      }

      setActive(2);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3500);
    },
  });

  const handleNext = () => {
    if (active === 0) {
      const res = form.validateField('email');
      if (!res.hasError) setActive(1);
    } else if (active === 1) {
      const res = form.validateField('password');
      if (!res.hasError) {
        register(form.values);
      }
    }
  };

  const handleBack = () => {
    setActive((current) => Math.max(0, current - 1));
  };

  return (
    <Container size="sm" my="xl">
      <Title ta="center" mb="xs">
        {t('register.title', 'Create your account')}
      </Title>
      <Text ta="center" c="dimmed" mb="lg">
        NanoGPT Proxy
      </Text>

      <Paper withBorder shadow="sm" p="lg" radius="md">
        <Stepper active={active} allowNextStepsSelect={false} size="sm">
          <Stepper.Step
            label={t('register.steps.email.label', 'Email')}
            description={t('register.steps.email.description', 'Enter your email address')}
          >
            <Box mt="md">
              <TextInput
                withAsterisk
                label={t('input.email.label')}
                placeholder={t('input.email.placeholder')}
                {...form.getInputProps('email')}
              />
            </Box>
          </Stepper.Step>

          <Stepper.Step
            label={t('register.steps.password.label', 'Password')}
            description={t('register.steps.password.description', 'Choose a secure password')}
          >
            <Box mt="md">
              <PasswordInput
                withAsterisk
                label={t('input.password.label')}
                placeholder={t('input.password.placeholder')}
                {...form.getInputProps('password')}
              />
            </Box>
          </Stepper.Step>

          <Stepper.Completed>
            <Box mt="md">
              {isPending && (
                <Text ta="center">{t('register.status.creating', 'Creating your account...')}</Text>
              )}

              {isSuccess && data && (
                <>
                  {data.pendingReview ? (
                    <Alert color="blue" variant="light" icon={<IconCheck size={16} />}>
                      {t(
                        'register.status.pending',
                        'Your account has been created and is pending review. You will be able to sign in once it is approved.',
                      )}
                    </Alert>
                  ) : (
                    <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
                      {t(
                        'register.status.success',
                        'Your account has been created successfully. You are being logged in…',
                      )}
                    </Alert>
                  )}
                </>
              )}

              {error && (
                <Alert mt="md" color="red" variant="light" icon={<IconAlertCircle size={16} />}>
                  {error.message}
                </Alert>
              )}
            </Box>
          </Stepper.Completed>
        </Stepper>

        <Box mt="xl" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="default" onClick={handleBack} disabled={active === 0 || isPending}>
            {t('common.back', 'Back')}
          </Button>

          {active < 2 && (
            <Button onClick={handleNext} loading={isPending}>
              {active === 1
                ? t('register.actions.create', 'Create account')
                : t('common.next', 'Next')}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default RegistrationForm;
