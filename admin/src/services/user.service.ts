import { IUser, IUserCreatePayload, IUserUpdatePayload } from '@interfaces/user';
import { apiRequest } from './api-request';

interface ISearchParams {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ADMIN_USERS = '/admin/users';

class UserService {
  async search(params: ISearchParams): Promise<IPaginatedResponse<IUser>> {
    const res = (await apiRequest.get(ADMIN_USERS, { params })) as { data: IPaginatedResponse<IUser> };
    return res.data;
  }

  async findById(id: string): Promise<IUser> {
    const res = (await apiRequest.get(`${ADMIN_USERS}/${id}`)) as { data: IUser };
    return res.data;
  }

  async create(payload: IUserCreatePayload): Promise<IUser> {
    const res = (await apiRequest.post(ADMIN_USERS, payload)) as { data: IUser };
    return res.data;
  }

  async update(id: string, payload: IUserUpdatePayload): Promise<IUser> {
    const res = (await apiRequest.put(`${ADMIN_USERS}/${id}`, payload)) as { data: IUser };
    return res.data;
  }

  async delete(id: string): Promise<void> {
    await apiRequest.delete(`${ADMIN_USERS}/${id}`);
  }
}

export const userService = new UserService();
