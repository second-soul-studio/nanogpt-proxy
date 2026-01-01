import type { UserDto, UserRole } from '../../../dtos/userDto.ts';
import type { UserEditFormValues } from './user-edit-modal';
import type { FieldConfig } from '../fields/field-config';

export type UserFormMode = 'create' | 'edit';

type TFn = (key: string) => string;

function isUuidV4(value: string): boolean {
  if (!value) {
    return true;
  }
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
}

export function buildInitialValues(user: UserDto | null, mode: UserFormMode): UserEditFormValues {
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

export function buildUserFields(mode: UserFormMode, t: TFn): FieldConfig<UserEditFormValues>[] {
  const isEdit = mode === 'edit';

  return [
    {
      key: 'enabled',
      label: t('modals.createUpdateUser.enabled.label'),
      type: 'toggle',
    },
    {
      key: 'email',
      label: t('modals.createUpdateUser.email.label'),
      type: 'text',
      required: true,
      disabled: isEdit,
      validate: (value) => {
        if (!value) {
          return t('modals.createUpdateUser.email.requiredError');
          //return 'Email is required';
        }
        return null;
      },
    },
    {
      key: 'password',
      label: t('modals.createUpdateUser.password.label'),
      type: 'password',
      placeholder: isEdit
        ? t('modals.createUpdateUser.password.placeholderEdit')
        : t('modals.createUpdateUser.password.placeholder'),
      //placeholder: isEdit ? 'Leave empty to keep current password' : 'Set an initial password',
      required: !isEdit,
      validate: (value) => {
        if (!isEdit && !value) {
          return t('modals.createUpdateUser.password.requiredError');
        }
        return null;
      },
    },
    {
      key: 'api_key',
      label: t('modals.createUpdateUser.apiKey.label'),
      type: 'password',
      placeholder: t('modals.createUpdateUser.apiKey.placeholder'),
      required: false,
      validate: (value) => {
        const v = typeof value === 'string' ? value : '';
        if (!v) {
          return null;
        }
        if (!isUuidV4(v)) {
          return t('modals.createUpdateUser.apiKey.invalid');
        }
        return null;
      },
    },
    {
      key: 'role',
      label: t('modals.createUpdateUser.role.label'),
      type: 'select',
      required: true,
      options: [
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'USER', label: 'USER' },
      ],
    },
  ];
}
