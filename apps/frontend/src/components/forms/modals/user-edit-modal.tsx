import { useMemo } from 'react';
import { useUser } from '../../../hooks/useUser';
import { DynamicFormModal } from './dynamic-form-modal';
import type { UserDto } from '../../../dtos/userDto.ts';
import type { FieldConfig } from '../fields/field-config';
import { buildInitialValues, buildUserFields } from './user-form-config';
import { useTranslation } from 'react-i18next';

type UserEditModalProps = {
  opened: boolean;
  user: UserDto | null;
  onClose: () => void;
};

export function UserEditModal(props: UserEditModalProps) {
  const { opened, user, onClose } = props;
  const { updateUserAsync, isPending } = useUser();
  const { t } = useTranslation();

  const initialValues = useMemo(() => buildInitialValues(user, 'edit'), [user]);

  const fields: FieldConfig<UserDto>[] = useMemo(() => buildUserFields('edit', t), [t]);

  const handleSubmit = async (values: UserDto) => {
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
    <DynamicFormModal<UserDto>
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
