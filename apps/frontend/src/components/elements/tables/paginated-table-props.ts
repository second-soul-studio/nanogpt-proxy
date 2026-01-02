import type { ColumnDef } from './column-def.ts';
import type { UsePageQuery } from '../../../hooks/usePageQuery.ts';
import { type ReactNode } from 'react';

export type PaginatedTableProps<T> = {
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  initialLimit?: number;
  renderActions?: (row: T) => ReactNode;
  renderBottomBar?: (selectedRows: T[]) => ReactNode;
  usePageQuery: UsePageQuery<T>;
};
