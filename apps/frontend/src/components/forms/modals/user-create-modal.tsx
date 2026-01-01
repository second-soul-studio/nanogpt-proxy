import { useMemo } from 'react';
import { useUser } from '../../../hooks/useUser';
import { DynamicFormModal } from './dynamic-form-modal';
import type { UserDto } from '../../../dtos/userDto.ts';
import type { FieldConfig } from '../fields/field-config';
import { buildInitialValues, buildUserFields } from './user-form-config';
import { useTranslation } from 'react-i18next';

type UserCreateModalProps = {
  opened: boolean;
  onClose: () => void;
};

export function UserCreateModal(props: UserCreateModalProps) {
  const { opened, onClose } = props;
  const { createUserAsync, isCreating } = useUser();
  const { t } = useTranslation();

  const initialValues = useMemo(() => buildInitialValues(null, 'create'), []);

  const fields: FieldConfig<UserDto>[] = useMemo(() => buildUserFields('create', t), [t]);

  const handleSubmit = async (values: UserDto) => {
    await createUserAsync({
      email: values.email,
      password: values.password,
      api_key: values.api_key || undefined,
      role: values.role,
      enabled: values.enabled,
    });

    onClose();
  };

  return (
    <DynamicFormModal<UserDto>
      key={opened ? 'create-open' : 'create-closed'}
      opened={opened}
      title={t('modals.createUpdateUser.title.create.label')}
      initialValues={initialValues}
      fields={fields}
      loading={isCreating}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
}
