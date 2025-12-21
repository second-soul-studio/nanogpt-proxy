import React, { useMemo, useState } from 'react';
import {
  Box,
  Table,
  Checkbox,
  Group,
  Text,
  Pagination,
  Loader,
  ScrollArea,
  ActionIcon,
  Flex,
  rem,
} from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconArrowsSort } from '@tabler/icons-react';
import type { PaginationParams, SortDir } from './pagination-types';
import type { ColumnDef } from './column-def';
import type { PaginatedTableProps } from './paginated-table-props';

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

  const queryParams: PaginationParams = {
    page,
    limit,
    sortBy,
    sortDir,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = usePageQuery(queryParams);

  const rows: T[] = (data?.data ?? []) as T[];
  const meta = data?.meta;

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, sortBy, sortDir]);

  const allSelectedOnPage = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((row: T) => selectedIds.has(getRowId(row)));
  }, [rows, selectedIds, getRowId]);

  const someSelectedOnPage = useMemo(() => {
    if (!rows.length) return false;
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
    if (!column.sortable) return;
    const key = column.key as string;
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir('ASC');
    } else {
      setSortDir((prev) => (prev === 'ASC' ? 'DESC' : prev === 'DESC' ? undefined : 'ASC'));
      if (sortDir === undefined) {
        setSortBy(undefined);
      }
    }
    setPage(1);
  };

  const renderSortIcon = (column: ColumnDef<T>) => {
    if (!column.sortable) return null;
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
              <Table.Th>
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

              {renderActions && <Table.Th style={{ width: '1%' }}>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length + (renderActions ? 2 : 1)}>
                  <Group justify="center" py="md">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      Loading...
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
                    No data to display.
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
                        {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
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
              {meta?.totalItems ?? 0} item(s) total
            </Text>
            {isFetching && !isLoading && <Loader size="xs" ml="xs" aria-label="Refreshing data" />}
          </Group>

          {meta && meta.totalPages > 1 && (
            <Pagination total={meta.totalPages} value={page} onChange={setPage} size="sm" />
          )}
        </Flex>

        <Flex justify="space-between" align="center" mt="sm" gap="md" wrap="wrap">
          <Text size="sm">
            {selectedIds.size === 0 ? 'No item selected' : `${selectedIds.size} item(s) selected`}
          </Text>

          {renderBottomBar && selectedRows.length > 0 && (
            <Group gap="xs">{renderBottomBar(selectedRows)}</Group>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
