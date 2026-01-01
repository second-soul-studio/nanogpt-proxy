import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import { PaginatedTable } from '../paginated-table.tsx';
import type { PaginatedTableProps } from '../paginated-table-props.ts';
import type { ColumnDef } from '../column-def.ts';
import i18nTest from '../../../../i18ntest.ts';
import { renderWithProviders } from '../../../../__tests__/utilities/test.utilities.tsx';

type Row = {
  id: string;
  name: string;
  enabled: boolean;
};

const sampleRows: Row[] = [
  { id: '1', name: 'Alice', enabled: true },
  { id: '2', name: 'Bob', enabled: false },
];

const columns: ColumnDef<Row>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
  },
  {
    key: 'enabled',
    header: 'Enabled',
    sortable: false,
    render: (row) => (row.enabled ? 'Yes' : 'No'),
  },
];

type UsePageQueryResult = ReturnType<PaginatedTableProps<Row>['usePageQuery']>;

type PaginationLike = {
  page: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC' | undefined;
};

describe('<PaginatedTable />', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18nTest.changeLanguage('en');
  });

  it('displays the loading state when isLoading is true', () => {
    /* Arrange */
    const usePageQueryLoading: PaginatedTableProps<Row>['usePageQuery'] = () =>
      ({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      }) as unknown as UsePageQueryResult;

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQueryLoading}
      />,
    );

    /* Assert */
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays an error message and calls refetch when clicking "Retry"', () => {
    /* Arrange */
    const refetchMock = vi.fn();

    const usePageQueryError: PaginatedTableProps<Row>['usePageQuery'] = () =>
      ({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Boom'),
        refetch: refetchMock,
        isFetching: false,
      }) as unknown as UsePageQueryResult;

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQueryError}
      />,
    );

    /* Assert */
    expect(screen.getByText('Boom')).toBeInTheDocument();

    const retryButton = screen.getByText(/retry/i);
    fireEvent.click(retryButton);
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('displays "No data to display" and "No item selected" when there are no rows', () => {
    /* Arrange */
    const usePageQueryEmpty: PaginatedTableProps<Row>['usePageQuery'] = () =>
      ({
        data: {
          data: [],
          meta: { page: 1, totalPages: 1, totalItems: 0 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      }) as unknown as UsePageQueryResult;

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQueryEmpty}
      />,
    );

    /* Assert */
    expect(screen.getByText(/no data to display/i)).toBeInTheDocument();
    expect(screen.getByText(/no item selected/i)).toBeInTheDocument();
  });

  it("manages the selection, the bottom bar, and the 'items selected' text", () => {
    /* Arrange */
    const bottomSpy = vi.fn();

    const usePageQueryRows: PaginatedTableProps<Row>['usePageQuery'] = (params) =>
      ({
        data: {
          data: sampleRows,
          meta: {
            page: (params as PaginationLike).page,
            totalPages: 1,
            totalItems: sampleRows.length,
          },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: true, // pour couvrir le loader "refreshingData"
      }) as unknown as UsePageQueryResult;

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQueryRows}
        renderBottomBar={(selected) => (
          <button type="button" onClick={() => bottomSpy(selected)}>
            Bulk action
          </button>
        )}
      />,
    );

    // texte de sélection initial
    expect(screen.getByText(/no item selected/i)).toBeInTheDocument();

    // loader de rafraîchissement
    expect(screen.getByLabelText(/refreshing/i)).toBeInTheDocument();

    // select all
    const selectAllCheckbox = screen.getByLabelText('Select all rows on this page');
    fireEvent.click(selectAllCheckbox);

    // maintenant, "items selected" (matcher plus souple)
    const selectionText = screen.getByText(
      (content) =>
        content.toLowerCase().includes('item') && content.toLowerCase().includes('selected'),
    );
    expect(selectionText).toBeInTheDocument();

    // bottom bar doit être visible avec notre bouton
    const bulkButton = screen.getByRole('button', { name: /bulk action/i });
    fireEvent.click(bulkButton);

    expect(bottomSpy).toHaveBeenCalledTimes(1);
    const selected = bottomSpy.mock.calls[0][0] as Row[];
    expect(selected).toHaveLength(sampleRows.length);
  });

  it('allows you to select a single row', () => {
    /* Arrange */
    const usePageQueryRows: PaginatedTableProps<Row>['usePageQuery'] = (params) =>
      ({
        data: {
          data: sampleRows,
          meta: {
            page: (params as PaginationLike).page,
            totalPages: 1,
            totalItems: sampleRows.length,
          },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      }) as unknown as UsePageQueryResult;

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQueryRows}
        renderBottomBar={() => null}
      />,
    );

    const rowCheckbox = screen.getByLabelText('Select row 1');
    fireEvent.click(rowCheckbox);

    const selectedOneText = screen.getByText(
      (content) =>
        content.toLowerCase().includes('1') &&
        content.toLowerCase().includes('item') &&
        content.toLowerCase().includes('selected'),
    );
    expect(selectedOneText).toBeInTheDocument();
  });

  it('calls renderActions and passes the correct row', () => {
    /* Arrange */
    const actionSpy = vi.fn();

    const usePageQueryRows: PaginatedTableProps<Row>['usePageQuery'] = (params) =>
      ({
        data: {
          data: sampleRows,
          meta: {
            page: (params as PaginationLike).page,
            totalPages: 1,
            totalItems: sampleRows.length,
          },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      }) as unknown as UsePageQueryResult;

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQueryRows}
        renderActions={(row) => (
          <button type="button" onClick={() => actionSpy(row)}>
            Edit {row.name}
          </button>
        )}
      />,
    );

    const button = screen.getByRole('button', { name: /edit alice/i });
    fireEvent.click(button);

    expect(actionSpy).toHaveBeenCalledTimes(1);
    expect(actionSpy).toHaveBeenCalledWith(expect.objectContaining({ id: '1', name: 'Alice' }));
  });

  it('manages sorting on a sortable column and passes the correct params to usePageQuery', async () => {
    /* Arrange */
    let lastQueryParams: PaginationLike | undefined;

    const usePageQuerySorted: PaginatedTableProps<Row>['usePageQuery'] = (params) => {
      lastQueryParams = params as PaginationLike;

      return {
        data: {
          data: sampleRows,
          meta: {
            page: (params as PaginationLike).page,
            totalPages: 1,
            totalItems: sampleRows.length,
          },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      } as unknown as UsePageQueryResult;
    };

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQuerySorted}
      />,
    );

    expect(lastQueryParams).toBeDefined();
    expect(lastQueryParams!.sortBy).toBeUndefined();
    expect(lastQueryParams!.sortDir).toBeUndefined();

    const nameHeaderButton = screen.getByRole('button', { name: /name/i });

    // 1er clic -> ASC
    fireEvent.click(nameHeaderButton);

    await waitFor(() => {
      expect(lastQueryParams!.sortBy).toBe('name');
      expect(lastQueryParams!.sortDir).toBe('ASC');
    });

    // 2e clic -> DESC
    fireEvent.click(nameHeaderButton);

    await waitFor(() => {
      expect(lastQueryParams!.sortBy).toBe('name');
      expect(lastQueryParams!.sortDir).toBe('DESC');
    });
  });

  it('displays the pagination and updates the page text when changing the page', () => {
    /* Arrange */
    const usePageQueryPaged: PaginatedTableProps<Row>['usePageQuery'] = (params) =>
      ({
        data: {
          data: sampleRows,
          meta: {
            page: (params as PaginationLike).page,
            totalPages: 3,
            totalItems: sampleRows.length * 3,
          },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      }) as unknown as UsePageQueryResult;

    renderWithProviders(
      <PaginatedTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialLimit={10}
        usePageQuery={usePageQueryPaged}
      />,
    );

    expect(screen.getByText(/page 1 \/ 3/i)).toBeInTheDocument();

    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    expect(screen.getByText(/page 2 \/ 3/i)).toBeInTheDocument();
  });
});
