import type { PaginatedResponse, PaginationMeta } from '@mandys/shared';

export interface ListQueryOptions {
  page?: number;
  limit?: number;
  q?: string;
  filter?: string;
  sort?: string;
}

export const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const buildListQueryString = (options: ListQueryOptions = {}) => {
  const query = new URLSearchParams();
  const params: Record<string, string | number | undefined> = {
    page: options.page ?? 1,
    limit: options.limit ?? 10,
    q: options.q?.trim() || undefined,
    filter: options.filter && options.filter !== 'TODOS' ? options.filter : undefined,
    sort: options.sort,
  };

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

export const normalizePaginatedResponse = <T>(
  data: PaginatedResponse<T> | T[],
): PaginatedResponse<T> => {
  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        ...DEFAULT_PAGINATION,
        totalItems: data.length,
        totalPages: Math.max(1, Math.ceil(data.length / DEFAULT_PAGINATION.limit)),
      },
    };
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: data.pagination ?? DEFAULT_PAGINATION,
  };
};
