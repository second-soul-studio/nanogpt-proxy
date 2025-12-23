import { useMemo } from 'react';
import { useUser } from '../../../hooks/useUser.ts';
import { DynamicFormModal } from './dynamic-form-modal.tsx';
import type { FieldConfig } from '../fields/field-config.ts';
import type { UserRole, UsersDto } from '../../../dtos/users.dto.ts';

export type UserEditFormValues = {
  enabled: boolean;
  email: string;
  password: string;
  api_key: string;
  role: UserRole;
};

type UserEditModalProps = {
  opened: boolean;
  user: UsersDto | null;
  onClose: () => void;
};

function isUuidV4(value: string): boolean {
  if (!value) {
    return true;
  }
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
}

export function UserEditModal(props: UserEditModalProps) {
  const { opened, user, onClose } = props;
  const { updateUserAsync, isPending } = useUser();

  const initialValues: UserEditFormValues = useMemo(
    () =>
      user
        ? {
            enabled: user.enabled,
            email: user.email,
            password: '',
            api_key: '', // Never populate the api key
            role: user.role,
          }
        : {
            enabled: false,
            email: '',
            password: '',
            api_key: '',
            role: 'USER' as UserRole,
          },
    [user],
  );

  const fields: FieldConfig<UserEditFormValues>[] = [
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'toggle',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      required: true,
      disabled: true,
      validate: (value) => {
        if (!value) {
          return 'Email is required';
        }
        return null;
      },
    },
    {
      key: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Leave empty to keep current password',
      required: false,
      validate: () => null,
    },
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      placeholder: 'Optional UUID v4',
      required: false,
      validate: (value) => {
        if (!value) {
          return null;
        }
        if (!isUuidV4(value)) {
          return 'API key must be a valid UUID v4';
        }
        return null;
      },
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'USER', label: 'USER' },
      ],
    },
  ];

  const handleSubmit = async (values: UserEditFormValues) => {
    if (!user) {
      return;
    }

    await updateUserAsync({
      email: user.email,
      enabled: values.enabled,
      role: values.role,
      api_key: values.api_key || undefined,
      password: values.password || undefined,
    });

    onClose();
  };

  return (
    <DynamicFormModal<UserEditFormValues>
      key={user?.email ?? 'new'}
      opened={opened}
      title={user ? `Edit user: ${user.email}` : 'Edit user'}
      initialValues={initialValues}
      fields={fields}
      loading={isPending}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
}
