import { useMemo } from 'react';
import { useUser } from '../../../hooks/useUser';
import { DynamicFormModal } from './dynamic-form-modal';
import type { UsersDto, UserRole } from '../../../dtos/users.dto';
import type { FieldConfig } from '../fields/field-config';
import { buildInitialValues, buildUserFields } from './user-form-config';
import { useTranslation } from 'react-i18next';

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

export function UserEditModal(props: UserEditModalProps) {
  const { opened, user, onClose } = props;
  const { updateUserAsync, isPending } = useUser();
  const { t } = useTranslation();

  const initialValues = useMemo(() => buildInitialValues(user, 'edit'), [user]);

  const fields: FieldConfig<UserEditFormValues>[] = useMemo(() => buildUserFields('edit', t), []);

  const handleSubmit = async (values: UserEditFormValues) => {
    if (!user) return;

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
      key={user?.email ?? 'edit-new'}
      opened={opened}
      title={
        user
          ? t('modals.createUpdateUser.title.edit.label', { email: user.email })
          : t('modals.createUpdateUser.title.edit.label')
      }
      initialValues={initialValues}
      fields={fields}
      loading={isPending}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
}
