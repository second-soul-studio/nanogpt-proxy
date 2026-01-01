import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

import UsersTable from '../users-table.tsx';
import type { UserDto } from '../../../dtos/userDto.ts';
import type { ColumnDef } from '../../elements/tables/column-def.ts';
import { renderWithProviders } from '../../../__tests__/utilities/test.utilities.tsx';
import i18nTest from '../../../i18ntest.ts';

type PaginatedTableMockProps<T> = {
  getRowId: (row: T) => string;
  columns: ColumnDef<T>[];
  initialLimit: number;
  usePageQuery: (params: unknown) => unknown;
  renderActions: (row: T) => React.ReactNode;
  renderBottomBar: (selected: T[]) => React.ReactNode;
};

let latestPaginatedProps: PaginatedTableMockProps<UserDto> | undefined;

const sampleRow: UserDto = {
  email: 'user1@example.com',
  enabled: true,
  role: 'USER',
  api_key: '',
  password: 'Secret!',
};

const selectedRows: UserDto[] = [sampleRow];

vi.mock('../../elements/tables/paginated-table.tsx', () => ({
  __esModule: true,
  PaginatedTable: (props: PaginatedTableMockProps<UserDto>) => {
    latestPaginatedProps = props;
    return <div data-testid="paginated-table-mock" />;
  },
}));

describe('<UsersTable />', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    latestPaginatedProps = undefined;
    await i18nTest.changeLanguage('en');
  });

  it('configure PaginatedTable avec les bonnes colonnes et paramètres de base', () => {
    /* Arrange */
    renderWithProviders(<UsersTable />);

    /* Assert */
    expect(latestPaginatedProps).toBeDefined();

    const props = latestPaginatedProps!;
    expect(props.initialLimit).toBe(10);

    expect(props.getRowId(sampleRow)).toBe(sampleRow.email);

    const keys = props.columns.map((c) => c.key);
    expect(keys).toEqual(['email', 'role', 'enabled', 'api_key']);
  });

  it('rend le bouton "Add user" quand onAddUser est fourni et déclenche le handler au clic', () => {
    /* Arrange */
    const onAddUser = vi.fn();
    renderWithProviders(<UsersTable onAddUser={onAddUser} />);

    /* Act */
    const addButton = screen.getByRole('button', { name: /add user/i });

    /* Assert */
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(onAddUser).toHaveBeenCalledTimes(1);
  });

  it('déclenche les handlers de ligne (approve/edit/delete) pour un USER', () => {
    /* Arrange */
    const onApproveDisapproveUser = vi.fn();
    const onEditUser = vi.fn();
    const onDeleteUser = vi.fn();

    renderWithProviders(
      <UsersTable
        onApproveDisapproveUser={onApproveDisapproveUser}
        onEditUser={onEditUser}
        onDeleteUser={onDeleteUser}
      />,
    );

    expect(latestPaginatedProps).toBeDefined();
    const { renderActions } = latestPaginatedProps!;

    const { getAllByRole } = renderWithProviders(<>{renderActions(sampleRow)}</>);
    const buttons = getAllByRole('button');

    expect(buttons.length).toBe(3);

    /* Act */
    fireEvent.click(buttons[0]); // approve / disable
    fireEvent.click(buttons[1]); // edit
    fireEvent.click(buttons[2]); // delete

    /* Assert */
    expect(onApproveDisapproveUser).toHaveBeenCalledTimes(1);
    expect(onApproveDisapproveUser).toHaveBeenCalledWith(sampleRow);

    expect(onEditUser).toHaveBeenCalledTimes(1);
    expect(onEditUser).toHaveBeenCalledWith(sampleRow);

    expect(onDeleteUser).toHaveBeenCalledTimes(1);
    expect(onDeleteUser).toHaveBeenCalledWith(sampleRow);
  });

  it('désactive les actions (approve/delete) pour un ADMIN, mais pas "edit"', () => {
    /* Arrange */
    const onApproveDisapproveUser = vi.fn();
    const onEditUser = vi.fn();
    const onDeleteUser = vi.fn();

    renderWithProviders(
      <UsersTable
        onApproveDisapproveUser={onApproveDisapproveUser}
        onEditUser={onEditUser}
        onDeleteUser={onDeleteUser}
      />,
    );

    expect(latestPaginatedProps).toBeDefined();
    const { renderActions } = latestPaginatedProps!;

    const adminRow: UserDto = {
      email: 'admin@example.com',
      enabled: true,
      role: 'ADMIN',
      api_key: '',
      password: 'Admin!',
    };

    const { getAllByRole } = renderWithProviders(<>{renderActions(adminRow)}</>);
    const buttons = getAllByRole('button');
    expect(buttons.length).toBe(3);

    const approveButton = buttons[0];
    const editButton = buttons[1];
    const deleteButton = buttons[2];

    expect(approveButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
    expect(editButton).not.toBeDisabled();
  });

  it('déclenche les handlers de bulk enable/disable avec la sélection', () => {
    /* Arrange */
    const onBulkEnable = vi.fn();
    const onBulkDisable = vi.fn();

    renderWithProviders(<UsersTable onBulkEnable={onBulkEnable} onBulkDisable={onBulkDisable} />);

    expect(latestPaginatedProps).toBeDefined();
    const { renderBottomBar } = latestPaginatedProps!;

    const { getAllByRole } = renderWithProviders(<>{renderBottomBar(selectedRows)}</>);
    const bulkButtons = getAllByRole('button');

    expect(bulkButtons.length).toBe(2);

    /* Act */
    fireEvent.click(bulkButtons[0]);
    fireEvent.click(bulkButtons[1]);

    /* Assert */
    expect(onBulkEnable).toHaveBeenCalledTimes(1);
    expect(onBulkEnable).toHaveBeenCalledWith(selectedRows);

    expect(onBulkDisable).toHaveBeenCalledTimes(1);
    expect(onBulkDisable).toHaveBeenCalledWith(selectedRows);
  });

  it('render de la colonne "role" affiche le label traduit', () => {
    /* Arrange */
    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();
    const roleCol = latestPaginatedProps!.columns.find((c) => c.key === 'role');
    expect(roleCol).toBeDefined();
    expect(roleCol!.render).toBeDefined();

    const adminRow: UserDto = {
      email: 'admin@example.com',
      enabled: true,
      role: 'ADMIN',
      api_key: '',
      password: 'Admin!',
    };

    /* Act */
    const { getByText } = renderWithProviders(<>{roleCol!.render!(adminRow)}</>);

    /* Assert */
    expect(getByText(/admin/i)).toBeInTheDocument();
  });

  it('render de la colonne "enabled" affiche Enabled / Disabled selon la valeur', () => {
    /* Arrange */
    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();
    const enabledCol = latestPaginatedProps!.columns.find((c) => c.key === 'enabled');
    expect(enabledCol).toBeDefined();
    expect(enabledCol!.render).toBeDefined();

    const rowEnabled: UserDto = {
      email: 'enabled@example.com',
      enabled: true,
      role: 'USER',
      api_key: '',
      password: '',
    };

    const rowDisabled: UserDto = {
      email: 'disabled@example.com',
      enabled: false,
      role: 'USER',
      api_key: '',
      password: '',
    };

    /* Act */
    const { getByText: getByTextEnabled } = renderWithProviders(
      <>{enabledCol!.render!(rowEnabled)}</>,
    );
    const { getByText: getByTextDisabled } = renderWithProviders(
      <>{enabledCol!.render!(rowDisabled)}</>,
    );

    /* Assert */
    expect(getByTextEnabled(/enabled/i)).toBeInTheDocument();
    expect(getByTextDisabled(/disabled/i)).toBeInTheDocument();
  });

  it('render de la colonne "api_key" masque la clé ou affiche "none"', () => {
    /* Arrange */
    renderWithProviders(<UsersTable />);

    expect(latestPaginatedProps).toBeDefined();
    const apiKeyCol = latestPaginatedProps!.columns.find((c) => c.key === 'api_key');
    expect(apiKeyCol).toBeDefined();
    expect(apiKeyCol!.render).toBeDefined();

    const rowWithKey: UserDto = {
      email: 'withkey@example.com',
      enabled: true,
      role: 'USER',
      api_key: 'some-key',
      password: '',
    };

    const rowWithoutKey: UserDto = {
      email: 'nokey@example.com',
      enabled: true,
      role: 'USER',
      api_key: '',
      password: '',
    };

    /* Act */
    const { getByText: getByTextMasked } = renderWithProviders(
      <>{apiKeyCol!.render!(rowWithKey)}</>,
    );
    const { getByText: getByTextNone } = renderWithProviders(
      <>{apiKeyCol!.render!(rowWithoutKey)}</>,
    );

    /* Assert */
    expect(getByTextMasked('••••••••••••')).toBeInTheDocument();
    expect(getByTextNone(/none/i)).toBeInTheDocument();
  });
});
