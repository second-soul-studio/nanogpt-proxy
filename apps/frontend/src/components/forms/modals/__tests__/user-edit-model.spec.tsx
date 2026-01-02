import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DynamicFormModalProps } from '../dynamic-form-modal.tsx';
import { renderWithProviders } from '../../../../__tests__/utilities/test.utilities.tsx';
import i18nTest from '../../../../i18ntest.ts';
import { UserEditModal } from '../user-edit-modal.tsx';
import type { UserDto } from '../../../../dtos/userDto.ts';

let latestModalProps: DynamicFormModalProps<UserDto> | undefined;

const updateUserAsyncMock = vi.fn<(payload: UserDto) => Promise<void>>().mockResolvedValue();

const initialValuesFixture: UserDto = {
  enabled: true,
  email: 'initial@example.com',
  password: '',
  api_key: '',
  role: 'USER',
};

const fieldsFixture = [
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
    required: false,
  },
];

vi.mock('../../../../hooks/useUser', () => ({
  __esModule: true,
  useUser: () => ({
    updateUserAsync: updateUserAsyncMock,
    isPending: false,
  }),
}));

vi.mock('../user-form-config.ts', () => ({
  __esModule: true,
  buildInitialValues: () => initialValuesFixture,
  buildUserFields: () => fieldsFixture,
}));

vi.mock('../dynamic-form-modal.tsx', () => ({
  __esModule: true,
  DynamicFormModal: (props: DynamicFormModalProps<UserDto>) => {
    latestModalProps = props;
    return <div data-testid="dynamic-form-modal" />;
  },
}));

describe('<UserEditModal />', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18nTest.changeLanguage('en');
    latestModalProps = undefined;
  });

  it('pass the correct props to DynamicFormModal when user is defined', () => {
    /* Arrange */
    const onClose = vi.fn();

    const user: UserDto = {
      email: 'edit-me@example.com',
      enabled: true,
      password: 'ignored-here',
      api_key: 'existing-key',
      role: 'ADMIN',
    };

    renderWithProviders(<UserEditModal opened={true} user={user} onClose={onClose} />);

    /* Assert */
    expect(latestModalProps).toBeDefined();

    expect(latestModalProps!.opened).toBe(true);

    expect(String(latestModalProps!.title)).toContain(user.email);

    expect(latestModalProps!.initialValues).toEqual(initialValuesFixture);
    expect(latestModalProps!.fields).toEqual(fieldsFixture);
    expect(latestModalProps!.loading).toBe(false);
  });

  it('call onClose when onCancel is triggered', () => {
    /* Arrange */
    const onClose = vi.fn();

    const user: UserDto = {
      email: 'cancel-me@example.com',
      enabled: true,
      password: 'xxx',
      api_key: '',
      role: 'USER',
    };

    renderWithProviders(<UserEditModal opened={true} user={user} onClose={onClose} />);

    expect(latestModalProps).toBeDefined();
    const { onCancel } = latestModalProps!;

    /* Act */
    onCancel();

    /* Assert */
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('maps onSubmit to updateUserAsync and closes the modal (empty api_key & password => undefined)', async () => {
    /* Arrange */
    const onClose = vi.fn();

    const user: UserDto = {
      email: 'john.doe@example.com',
      enabled: false,
      password: 'should-not-be-used-here',
      api_key: 'old-key',
      role: 'USER',
    };

    renderWithProviders(<UserEditModal opened={true} user={user} onClose={onClose} />);

    expect(latestModalProps).toBeDefined();
    const { onSubmit } = latestModalProps!;

    const formValues: UserDto = {
      enabled: true,
      email: 'ignored@from-values.com',
      password: '',
      api_key: '',
      role: 'ADMIN',
    };

    /* Act */
    await onSubmit(formValues);

    /* Assert */
    expect(updateUserAsyncMock).toHaveBeenCalledTimes(1);
    expect(updateUserAsyncMock).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      enabled: true,
      role: 'ADMIN',
      api_key: undefined,
      password: undefined,
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keep api_key and password when not empty', async () => {
    /* Arrange */
    const onClose = vi.fn();

    const user: UserDto = {
      email: 'jane.doe@example.com',
      enabled: false,
      password: 'old',
      api_key: 'old-api-key',
      role: 'USER',
    };

    renderWithProviders(<UserEditModal opened={true} user={user} onClose={onClose} />);

    expect(latestModalProps).toBeDefined();
    const { onSubmit } = latestModalProps!;

    const formValues: UserDto = {
      enabled: false,
      email: 'ignored@from-values.com',
      password: 'NewSecret!',
      api_key: '123e4567-e89b-12d3-a456-426614174000',
      role: 'ADMIN',
    };

    /* Act */
    await onSubmit(formValues);

    /* Assert */
    expect(updateUserAsyncMock).toHaveBeenCalledTimes(1);
    expect(updateUserAsyncMock).toHaveBeenCalledWith({
      email: 'jane.doe@example.com',
      enabled: false,
      role: 'ADMIN',
      api_key: '123e4567-e89b-12d3-a456-426614174000',
      password: 'NewSecret!',
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does nothing if onSubmit is called without a user (guard branch 'if (!user)')", async () => {
    /* Arrange */
    const onClose = vi.fn();

    renderWithProviders(<UserEditModal opened={true} user={null} onClose={onClose} />);

    expect(latestModalProps).toBeDefined();
    const { onSubmit } = latestModalProps!;

    const formValues: UserDto = {
      enabled: true,
      email: 'x@y.z',
      password: 'pwd',
      api_key: 'key',
      role: 'USER',
    };

    /* Act */
    await onSubmit(formValues);

    /* Assert */
    expect(updateUserAsyncMock).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
