import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import AdministerForm from '../administer-form';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities';
import i18nTest from '../../../i18ntest';
import type { UserDto } from '../../../dtos/userDto.ts';
import type UsersTable from '../../customs/users-table.tsx';

type UsersTableProps = React.ComponentProps<typeof UsersTable>;

type UserEditModalProps = {
  opened: boolean;
  user: UserDto | null;
  onClose: () => void;
};

type UserCreateModalProps = {
  opened: boolean;
  onClose: () => void;
};

const toggleEnabledMock = vi.fn();
const bulkEnableMock = vi.fn();
const bulkDisableMock = vi.fn();
const deleteUserMock = vi.fn();

vi.mock('../../../hooks/useUser.ts', () => ({
  __esModule: true,
  useUser: () => ({
    toggleEnabled: toggleEnabledMock,
    bulkEnable: bulkEnableMock,
    bulkDisable: bulkDisableMock,
    deleteUser: deleteUserMock,
  }),
}));

const UsersTableMock = vi.fn((props: UsersTableProps) => {
  void props;
  return <div data-testid="users-table" />;
});

vi.mock('../../customs/users-table.tsx', () => ({
  __esModule: true,
  default: (props: UsersTableProps) => UsersTableMock(props),
}));

vi.mock('../modals/user-edit-modal.tsx', () => ({
  __esModule: true,
  UserEditModal: (props: UserEditModalProps) => {
    if (!props.opened) return null;
    return (
      <div data-testid="user-edit-modal">
        <span data-testid="user-edit-email">{props.user?.email ?? 'no-user'}</span>
        <button type="button" data-testid="user-edit-close" onClick={props.onClose}>
          close-edit
        </button>
      </div>
    );
  },
}));

vi.mock('../modals/user-create-modal.tsx', () => ({
  __esModule: true,
  UserCreateModal: (props: UserCreateModalProps) => {
    if (!props.opened) return null;
    return (
      <div data-testid="user-create-modal">
        <button type="button" data-testid="user-create-close" onClick={props.onClose}>
          close-create
        </button>
      </div>
    );
  },
}));

describe('<AdministerForm />', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    UsersTableMock.mockClear();
    await i18nTest.changeLanguage('en');
  });

  it('renders the translated title and the icon', () => {
    /* Arrange */
    renderWithProviders(<AdministerForm />);

    /* Act */
    const heading = screen.getByRole('heading', {
      level: 3,
      name: /administer/i,
    });

    /* Assert */
    expect(heading).toBeInTheDocument();

    const iconSvg = document.querySelector('svg');
    expect(iconSvg).toBeInTheDocument();
  });

  it('wires onApproveDisapproveUser to toggleEnabled from useUser', () => {
    /* Arrange */
    renderWithProviders(<AdministerForm />);

    const usersTableProps = UsersTableMock.mock.calls[0]?.[0] as UsersTableProps | undefined;
    expect(usersTableProps).toBeDefined();
    expect(typeof usersTableProps!.onEnableDisableUser).toBe('function');

    const user: UserDto = {
      email: 'test@example.com',
      enabled: true,
      role: 'USER',
      password: 'So-secure!',
      api_key: '',
    };

    /* Act */
    usersTableProps!.onEnableDisableUser?.(user);

    /* Assert */
    expect(toggleEnabledMock).toHaveBeenCalledTimes(1);
    expect(toggleEnabledMock).toHaveBeenCalledWith(user);
  });

  it('wires onBulkEnable and onBulkDisable to bulkEnable / bulkDisable from useUser', () => {
    /* Arrange */
    renderWithProviders(<AdministerForm />);

    const usersTableProps = UsersTableMock.mock.calls[0]?.[0] as UsersTableProps | undefined;
    expect(usersTableProps).toBeDefined();
    expect(typeof usersTableProps!.onBulkEnable).toBe('function');
    expect(typeof usersTableProps!.onBulkDisable).toBe('function');

    const users: UserDto[] = [
      { email: 'u1@example.com', enabled: true, role: 'USER', api_key: '', password: 'So-secure!' },
      {
        email: 'u2@example.com',
        enabled: false,
        role: 'USER',
        api_key: '',
        password: 'So-secure!',
      },
    ];

    /* Act */
    usersTableProps!.onBulkEnable?.(users);
    usersTableProps!.onBulkDisable?.(users);

    /* Assert */
    expect(bulkEnableMock).toHaveBeenCalledTimes(1);
    expect(bulkEnableMock).toHaveBeenCalledWith(users);

    expect(bulkDisableMock).toHaveBeenCalledTimes(1);
    expect(bulkDisableMock).toHaveBeenCalledWith(users);
  });

  it('wires onDeleteUser to deleteUser from useUser', () => {
    /* Arrange */
    renderWithProviders(<AdministerForm />);

    const usersTableProps = UsersTableMock.mock.calls[0]?.[0] as UsersTableProps | undefined;
    expect(usersTableProps).toBeDefined();
    expect(typeof usersTableProps!.onDeleteUser).toBe('function');

    const user: UserDto = {
      email: 'delete-me@example.com',
      enabled: false,
      role: 'USER',
      password: 'So-secure!',
      api_key: '',
    };

    /* Act */
    usersTableProps!.onDeleteUser?.(user);

    /* Assert */
    expect(deleteUserMock).toHaveBeenCalledTimes(1);
    expect(deleteUserMock).toHaveBeenCalledWith({ email: user.email });
  });

  it('opens UserCreateModal when onAddUser is called', async () => {
    /* Arrange */
    renderWithProviders(<AdministerForm />);

    const usersTableProps = UsersTableMock.mock.calls[0]?.[0] as UsersTableProps | undefined;
    expect(usersTableProps).toBeDefined();
    expect(typeof usersTableProps!.onAddUser).toBe('function');

    expect(screen.queryByTestId('user-create-modal')).not.toBeInTheDocument();

    /* Act */
    usersTableProps!.onAddUser?.();

    /* Assert */
    const modal = await screen.findByTestId('user-create-modal');
    expect(modal).toBeInTheDocument();
  });

  it('opens UserEditModal with the selected user when onEditUser is called', async () => {
    /* Arrange */
    renderWithProviders(<AdministerForm />);

    const usersTableProps = UsersTableMock.mock.calls[0]?.[0] as UsersTableProps | undefined;
    expect(usersTableProps).toBeDefined();
    expect(typeof usersTableProps!.onEditUser).toBe('function');

    const user: UserDto = {
      email: 'edit-me@example.com',
      enabled: true,
      role: 'USER',
      password: 'So-secure!',
      api_key: '',
    };

    expect(screen.queryByTestId('user-edit-modal')).not.toBeInTheDocument();

    /* Act */
    usersTableProps!.onEditUser?.(user);

    /* Assert */
    const modal = await screen.findByTestId('user-edit-modal');
    expect(modal).toBeInTheDocument();

    const emailSpan = screen.getByTestId('user-edit-email');
    expect(emailSpan).toHaveTextContent(user.email);
  });

  it('closes UserCreateModal when onClose is called', async () => {
    /* Arrange */
    renderWithProviders(<AdministerForm />);

    const usersTableProps = UsersTableMock.mock.calls[0]?.[0] as UsersTableProps | undefined;
    expect(usersTableProps).toBeDefined();
    expect(typeof usersTableProps!.onAddUser).toBe('function');

    usersTableProps!.onAddUser?.();

    const closeButton = await screen.findByTestId('user-create-close');

    /* Act */
    closeButton.click();

    /* Assert */
    await waitFor(() => {
      expect(screen.queryByTestId('user-create-modal')).not.toBeInTheDocument();
    });
  });
});
