import {
  Modal,
  TextInput,
  PasswordInput,
  Switch,
  Select,
  Stack,
  Group,
  Button,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import type { FieldConfig } from '../fields/field-config.ts';

export type DynamicFormModalProps<T extends Record<string, unknown>> = {
  opened: boolean;
  title: string;
  initialValues: T;
  fields: FieldConfig<T>[];
  loading?: boolean;
  onSubmit: (values: T) => void | Promise<void>;
  onCancel: () => void;
};

export function DynamicFormModal<T extends Record<string, unknown>>(
  props: DynamicFormModalProps<T>,
) {
  const { opened, title, initialValues, fields, loading, onSubmit, onCancel } = props;
  const { t } = useTranslation();

  const form = useForm<T>({
    initialValues,
    validate: (values) => {
      const errors: Partial<Record<keyof T, string>> = {};

      fields.forEach((field) => {
        if (!field.validate) {
          return;
        }

        const key = field.key;
        const value = values[key]; // type: T[typeof key]
        const error = field.validate(value, values);
        if (error) {
          errors[key] = error;
        }
      });

      return errors;
    },
  });

  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <form
        onSubmit={form.onSubmit(async (values) => {
          await onSubmit(values as T);
        })}
      >
        <Stack gap="sm">
          {fields.map((field) => {
            const name = field.key as string;

            if (field.type === 'toggle') {
              return (
                <Switch
                  key={name}
                  label={field.label}
                  disabled={field.disabled}
                  {...form.getInputProps(name, { type: 'checkbox' })}
                />
              );
            }

            if (field.type === 'select') {
              return (
                <Select
                  key={name}
                  label={field.label}
                  data={field.options ?? []}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  withAsterisk={field.required}
                  {...form.getInputProps(name)}
                />
              );
            }

            if (field.type === 'password') {
              return (
                <PasswordInput
                  key={name}
                  label={field.label}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  withAsterisk={field.required}
                  {...form.getInputProps(name)}
                />
              );
            }

            return (
              <TextInput
                key={name}
                label={field.label}
                placeholder={field.placeholder}
                disabled={field.disabled}
                withAsterisk={field.required}
                {...form.getInputProps(name)}
              />
            );
          })}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onCancel}>
              {t('button.cancel.label')}
            </Button>
            <Button type="submit" loading={loading}>
              {t('button.save.label')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
