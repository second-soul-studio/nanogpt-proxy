import type { ReactNode } from 'react';

export type ColumnDef<T> = {
  key: keyof T;
  header: string;
  width?: string | number;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
};
