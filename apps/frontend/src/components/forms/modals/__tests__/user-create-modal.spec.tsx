import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DynamicFormModalProps } from '../dynamic-form-modal.tsx';
import type { UserDto } from '../../../../dtos/userDto.ts';
import i18nTest from '../../../../i18ntest.ts';
import { renderWithProviders } from '../../../../__tests__/utilities/test.utilities.tsx';

type CreateUserPayload = {
  enabled: boolean;
  email: string;
  password: string;
  api_key?: string;
  role: UserDto['role'];
};

let latestModalProps: DynamicFormModalProps<UserDto> | undefined;

const createUserAsyncMock = vi
  .fn<(payload: CreateUserPayload) => Promise<void>>()
  .mockResolvedValue();

vi.mock('../../../../hooks/useUser', () => ({
  __esModule: true,
  useUser: () => ({
    createUserAsync: createUserAsyncMock,
    isCreating: false,
  }),
}));

vi.mock('../user-form-config.ts', () => {
  const buildInitialValues = vi.fn(
    (): UserDto => ({
      enabled: true,
      email: 'initial@example.com',
      password: '',
      api_key: '',
      role: 'USER',
    }),
  );

  const buildUserFields = vi.fn(() => [
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      required: true,
    },
    {
      key: 'password',
      label: 'Password',
      type: 'password',
      required: true,
    },
  ]);

  return {
    __esModule: true,
    buildInitialValues,
    buildUserFields,
  };
});

vi.mock('../dynamic-form-modal.tsx', () => ({
  __esModule: true,
  DynamicFormModal: (props: DynamicFormModalProps<UserDto>) => {
    latestModalProps = props;
    return <div data-testid="dynamic-form-modal" />;
  },
}));

import { UserCreateModal } from '../user-create-modal.tsx';
import { buildInitialValues, buildUserFields } from '../user-form-config.ts';

describe('<UserCreateModal />', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    latestModalProps = undefined;
    await i18nTest.changeLanguage('en');
  });

  it('pass the right props to DynamicFormModal', () => {
    /* Arrange */
    const onClose = vi.fn();

    renderWithProviders(<UserCreateModal opened={true} onClose={onClose} />);

    /* Assert */
    expect(latestModalProps).toBeDefined();

    expect(latestModalProps!.opened).toBe(true);
    expect(latestModalProps!.title).toBe('Create user');

    expect(buildInitialValues).toHaveBeenCalledTimes(1);
    expect(buildInitialValues).toHaveBeenCalledWith(null, 'create');

    expect(latestModalProps!.initialValues).toEqual({
      enabled: true,
      email: 'initial@example.com',
      password: '',
      api_key: '',
      role: 'USER',
    });

    // fields : construits via buildUserFields mocké
    expect(buildUserFields).toHaveBeenCalledTimes(1);

    expect(latestModalProps!.fields).toHaveLength(2);
    expect(latestModalProps!.fields[0]).toMatchObject({
      key: 'email',
      label: 'Email',
      type: 'text',
      required: true,
    });
    expect(latestModalProps!.fields[1]).toMatchObject({
      key: 'password',
      label: 'Password',
      type: 'password',
      required: true,
    });

    // loading => isCreating
    expect(latestModalProps!.loading).toBe(false);
  });

  it('call onClose when onCancel is triggered', () => {
    /* Arrange */
    const onClose = vi.fn();

    renderWithProviders(<UserCreateModal opened={true} onClose={onClose} />);

    expect(latestModalProps).toBeDefined();
    const { onCancel } = latestModalProps!;

    /* Act */
    onCancel();

    /* Assert */
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('maps onSubmit to createUserAsync and closes the modal (empty api_key => undefined)', async () => {
    /* Arrange */
    const onClose = vi.fn();
    renderWithProviders(<UserCreateModal opened={true} onClose={onClose} />);

    expect(latestModalProps).toBeDefined();
    const { onSubmit } = latestModalProps!;

    const formValues: UserDto = {
      enabled: true,
      email: 'john.doe@example.com',
      password: 'SuperSecret!',
      api_key: '',
      role: 'USER',
    };

    /* Act */
    await onSubmit(formValues);

    /* Assert */
    expect(createUserAsyncMock).toHaveBeenCalledTimes(1);
    expect(createUserAsyncMock).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'SuperSecret!',
      api_key: undefined,
      role: 'USER',
      enabled: true,
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keep api_key as is when not empty', async () => {
    /* Arrange */
    const onClose = vi.fn();
    renderWithProviders(<UserCreateModal opened={true} onClose={onClose} />);

    expect(latestModalProps).toBeDefined();
    const { onSubmit } = latestModalProps!;

    const formValues: UserDto = {
      enabled: false,
      email: 'jane.doe@example.com',
      password: 'AnotherSecret!',
      api_key: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    };

    /* Act */
    await onSubmit(formValues);

    /* Assert */
    expect(createUserAsyncMock).toHaveBeenCalledTimes(1);
    expect(createUserAsyncMock).toHaveBeenCalledWith({
      email: 'jane.doe@example.com',
      password: 'AnotherSecret!',
      api_key: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
      enabled: false,
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
