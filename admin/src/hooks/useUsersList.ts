import useSWR from 'swr';
import { userService } from '@services/user.service';
import type { IUser } from '@interfaces/user';

const DEFAULT_LIMIT = 10;

interface UsersListResponse {
  data: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useUsersList(page: number, searchQ: string) {
  const key = ['admin-users', page, searchQ];
  const {
    data, error, isLoading, mutate
  } = useSWR<UsersListResponse>(key, () => userService.search({
    page,
    limit: DEFAULT_LIMIT,
    q: searchQ.trim() || undefined
  }));

  return {
    users: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    error,
    isLoading,
    mutate
  };
}
