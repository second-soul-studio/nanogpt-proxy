import type { UsersDto, UserRole } from '../../../dtos/users.dto';
import type { UserEditFormValues } from './user-edit-modal';
import type { FieldConfig } from '../fields/field-config';

export type UserFormMode = 'create' | 'edit';

function isUuidV4(value: string): boolean {
  if (!value) return true; // vide = OK (pas de changement)
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
}

export function buildInitialValues(user: UsersDto | null, mode: UserFormMode): UserEditFormValues {
  if (mode === 'edit' && user) {
    return {
      enabled: user.enabled,
      email: user.email,
      password: '',
      api_key: '',
      role: user.role,
    };
  }

  return {
    enabled: true,
    email: '',
    password: '',
    api_key: '',
    role: 'USER' as UserRole,
  };
}

export function buildUserFields(mode: UserFormMode): FieldConfig<UserEditFormValues>[] {
  const isEdit = mode === 'edit';

  return [
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
      disabled: isEdit,
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
      placeholder: isEdit ? 'Leave empty to keep current password' : 'Set an initial password',
      required: !isEdit,
      validate: (value) => {
        if (!isEdit && !value) {
          return 'Password is required';
        }
        return null;
      },
    },
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      placeholder: 'Optional UUID v4',
      required: false,
      validate: (value) => {
        if (!value) return null;
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
}
