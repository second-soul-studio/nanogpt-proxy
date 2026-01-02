import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Checkbox,
  Flex,
  Group,
  Loader,
  Pagination,
  rem,
  ScrollArea,
  Table,
  Text,
} from '@mantine/core';
import { IconArrowDown, IconArrowsSort, IconArrowUp } from '@tabler/icons-react';
import type { PaginationParams, SortDir } from './pagination-types';
import type { ColumnDef } from './column-def';
import type { PaginatedTableProps } from './paginated-table-props';
import { useTranslation } from 'react-i18next';

export function PaginatedTable<T>(props: PaginatedTableProps<T>) {
  const {
    usePageQuery,
    columns,
    getRowId,
    initialLimit = 20,
    renderActions,
    renderBottomBar,
  } = props;

  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<SortDir | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { t } = useTranslation();

  const queryParams: PaginationParams = {
    page,
    limit,
    sortBy,
    sortDir,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = usePageQuery(queryParams);

  const rawRows = data?.data;

  const rows = useMemo<T[]>(() => {
    const base = rawRows ?? [];

    if (!sortBy || !sortDir) {
      return base;
    }

    return [...base].sort((a, b) => {
      const va = (a as any)[sortBy];
      const vb = (b as any)[sortBy];

      if (va == null && vb == null) {
        return 0;
      }
      if (va == null) {
        return -1;
      }
      if (vb == null) {
        return 1;
      }

      if (va < vb) {
        return sortDir === 'ASC' ? -1 : 1;
      }
      if (va > vb) {
        return sortDir === 'ASC' ? 1 : -1;
      }
      return 0;
    });
  }, [rawRows, sortBy, sortDir]);

  const meta = data?.meta;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, sortBy, sortDir]);

  const allSelectedOnPage = useMemo(() => {
    if (!rows.length) {
      return false;
    }
    return rows.every((row: T) => selectedIds.has(getRowId(row)));
  }, [rows, selectedIds, getRowId]);

  const someSelectedOnPage = useMemo(() => {
    if (!rows.length) {
      return false;
    }
    const selectedCount = rows.filter((row: T) => selectedIds.has(getRowId(row))).length;
    return selectedCount > 0 && selectedCount < rows.length;
  }, [rows, selectedIds, getRowId]);

  const toggleSelectAllCurrentPage = () => {
    const newSet = new Set(selectedIds);
    if (allSelectedOnPage) {
      rows.forEach((row: T) => newSet.delete(getRowId(row)));
    } else {
      rows.forEach((row: T) => newSet.add(getRowId(row)));
    }
    setSelectedIds(newSet);
  };

  const toggleSelectRow = (row: T) => {
    const id = getRowId(row);
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectedRows = useMemo(
    () => rows.filter((row: T) => selectedIds.has(getRowId(row))),
    [rows, selectedIds, getRowId],
  );

  const handleSortClick = (column: ColumnDef<T>) => {
    if (!column.sortable) {
      return;
    }

    const key = String(column.key);

    let nextSortBy: string | undefined = sortBy;
    let nextSortDir: SortDir | undefined;

    if (sortBy !== key) {
      nextSortBy = key;
      nextSortDir = 'ASC';
    } else {
      if (sortDir === 'ASC') {
        nextSortDir = 'DESC';
      } else if (sortDir === 'DESC') {
        nextSortBy = undefined;
        nextSortDir = undefined;
      } else {
        nextSortDir = 'ASC';
      }
    }

    setSortBy(nextSortBy);
    setSortDir(nextSortDir);
    setPage(1);
  };

  const renderSortIcon = (column: ColumnDef<T>) => {
    if (!column.sortable) {
      return null;
    }
    if (sortBy !== column.key) {
      return <IconArrowsSort style={{ width: rem(14), height: rem(14) }} />;
    }
    if (sortDir === 'ASC') {
      return <IconArrowUp style={{ width: rem(14), height: rem(14) }} />;
    }
    if (sortDir === 'DESC') {
      return <IconArrowDown style={{ width: rem(14), height: rem(14) }} />;
    }
    return <IconArrowsSort style={{ width: rem(14), height: rem(14) }} />;
  };

  return (
    <Box>
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={10}>
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={allSelectedOnPage}
                  indeterminate={someSelectedOnPage}
                  onChange={toggleSelectAllCurrentPage}
                />
              </Table.Th>

              {columns.map((col) => (
                <Table.Th key={String(col.key)} style={{ width: col.width }}>
                  {col.sortable ? (
                    <Group gap="xs">
                      <Text
                        component="button"
                        onClick={() => handleSortClick(col)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          font: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: rem(4),
                        }}
                      >
                        {col.header}
                        {renderSortIcon(col)}
                      </Text>
                    </Group>
                  ) : (
                    col.header
                  )}
                </Table.Th>
              ))}

              {renderActions && <Table.Th style={{ width: '126px' }}>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + (renderActions ? 2 : 1)}>
                  <Group justify="center" py="md">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      {t('tables.common.labels.loading')}
                    </Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ) : isError ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + (renderActions ? 2 : 1)}>
                  <Group justify="space-between" py="sm">
                    <Text c="red" size="sm">
                      {(error as Error)?.message ?? 'Something went wrong while loading data.'}
                    </Text>
                    <ActionIcon variant="light" onClick={() => refetch()}>
                      <Text size="xs">Retry</Text>
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ) : rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + (renderActions ? 2 : 1)}>
                  <Text size="sm" c="dimmed">
                    {t('tables.common.labels.noDataToDisplay')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((row: T) => {
                const id = getRowId(row);
                const isSelected = selectedIds.has(id);

                return (
                  <Table.Tr key={id}>
                    <Table.Td>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row)}
                        aria-label={`Select row ${id}`}
                      />
                    </Table.Td>

                    {columns.map((col) => (
                      <Table.Td key={String(col.key)}>
                        {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                      </Table.Td>
                    ))}

                    {renderActions && <Table.Td>{renderActions(row)}</Table.Td>}
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Box mt="sm">
        <Flex justify="space-between" align="center" gap="md" wrap="wrap">
          <Group gap="xs">
            <Text size="sm">
              Page {meta?.page ?? page} / {meta?.totalPages ?? '-'}
            </Text>
            <Text size="sm" c="dimmed">
              {meta?.totalItems ?? 0} {t('tables.common.labels.itemsTotal')}
            </Text>
            {isFetching && !isLoading && (
              <Loader size="xs" ml="xs" aria-label={t('tables.common.labels.refreshingData')} />
            )}
          </Group>

          {meta && meta.totalPages > 1 && (
            <Pagination total={meta.totalPages} value={page} onChange={setPage} size="sm" />
          )}
          {selectedIds.size === 0
            ? `${t('tables.common.labels.noItemSelected')}`
            : `${selectedIds.size} ${t('tables.common.labels.itemsSelected')}`}
        </Flex>

        <Flex justify="space-between" align="center" mt="sm" gap="md" wrap="wrap">
          {renderBottomBar && selectedRows.length > 0 && (
            <Group gap="xs">{renderBottomBar(selectedRows)}</Group>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
