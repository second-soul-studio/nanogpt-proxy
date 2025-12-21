export type SortDir = 'ASC' | 'DESC';

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: SortDir;
};

export type PageMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type PageDto<T> = {
  data: T[];
  meta: PageMeta;
};
