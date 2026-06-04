export interface PageableData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function createPageableData<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PageableData<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

