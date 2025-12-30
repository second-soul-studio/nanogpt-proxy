import { useMemo } from 'react';
import { useUser } from '../../../hooks/useUser';
import { DynamicFormModal } from './dynamic-form-modal';
import type { UserRole } from '../../../dtos/users.dto';
import type { FieldConfig } from '../fields/field-config';
import { buildInitialValues, buildUserFields } from './user-form-config';
import { useTranslation } from 'react-i18next';

export type UserCreateFormValues = {
  enabled: boolean;
  email: string;
  password: string;
  api_key: string;
  role: UserRole;
};

type UserCreateModalProps = {
  opened: boolean;
  onClose: () => void;
};

export function UserCreateModal(props: UserCreateModalProps) {
  const { opened, onClose } = props;
  const { createUserAsync, isCreating } = useUser();
  const { t } = useTranslation();

  const initialValues = useMemo(() => buildInitialValues(null, 'create'), []);

  const fields: FieldConfig<UserCreateFormValues>[] = useMemo(
    () => buildUserFields('create', t),
    [],
  );

  const handleSubmit = async (values: UserCreateFormValues) => {
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
    <DynamicFormModal<UserCreateFormValues>
      key={opened ? 'create-open' : 'create-closed'}
      opened={opened}
      title="Create user"
      initialValues={initialValues}
      fields={fields}
      loading={isCreating}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
}
