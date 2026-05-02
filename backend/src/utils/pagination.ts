type QueryValue = unknown;

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
  isPaginated: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const readQueryValue = (value: QueryValue): string | undefined => {
  if (Array.isArray(value)) {
    return readQueryValue(value[0]);
  }

  return typeof value === 'string' ? value : undefined;
};

const parsePositiveInteger = (value: QueryValue, fallback: number) => {
  const parsed = Number.parseInt(readQueryValue(value) ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getQueryString = (query: Record<string, unknown>, key: string) =>
  readQueryValue(query[key])?.trim() ?? '';

export const parsePaginationParams = (
  query: Record<string, unknown>,
  defaultLimit = 10,
  maxLimit = 50,
): PaginationParams => {
  const page = parsePositiveInteger(query.page, 1);
  const rawLimit = parsePositiveInteger(query.limit, defaultLimit);
  const limit = Math.min(rawLimit, maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    isPaginated: query.page !== undefined || query.limit !== undefined,
  };
};

export const buildPaginationMeta = (
  totalItems: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const buildPaginatedResponse = <T>(
  items: T[],
  totalItems: number,
  pagination: PaginationParams,
) => ({
  items,
  pagination: buildPaginationMeta(totalItems, pagination.page, pagination.limit),
});
