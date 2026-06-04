import Cookies from 'js-cookie';
import { ILoginPayload, ILoginResponse } from '@interfaces/auth';
import { apiRequest, TOKEN_KEY } from './api-request';

class AuthService {
  async login(payload: ILoginPayload): Promise<ILoginResponse> {
    const response = await apiRequest.post<unknown, { data: ILoginResponse }>(
      '/auth/admin/login',
      payload
    );
    const { token } = response.data;
    if (token) {
      Cookies.set(TOKEN_KEY, token, { expires: 1 }); // 1 day
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiRequest.post('/auth/logout');
    } finally {
      Cookies.remove(TOKEN_KEY);
    }
  }

  async me(): Promise<any> {
    return apiRequest.get('/auth/me');
  }

  getToken(): string | null {
    return Cookies.get(TOKEN_KEY) || null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
