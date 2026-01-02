import type { PageDto, PaginationParams } from '../components/elements/tables/pagination-types.ts';
import type { UseQueryResult } from '@tanstack/react-query';

export type UsePageQuery<T> = (params: PaginationParams) => UseQueryResult<PageDto<T>, Error>;
