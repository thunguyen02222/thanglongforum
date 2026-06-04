import Cookies from 'js-cookie';
import { apiRequest, TOKEN_KEY } from './api-request';
import { ILoginPayload, IRegisterPayload } from '@interfaces/auth';

export interface IAuthResponse {
  _id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  token: string;
}

class AuthService {
  async login(payload: ILoginPayload): Promise<IAuthResponse> {
    const response = await apiRequest.post<unknown, { data: IAuthResponse }>(
      '/auth/login',
      payload
    );
    const data = response.data;
    if (data?.token) {
      Cookies.set(TOKEN_KEY, data.token, { expires: 1 });
    }
    return data;
  }

  async register(payload: IRegisterPayload): Promise<IAuthResponse> {
    const response = await apiRequest.post<unknown, { data: IAuthResponse }>(
      '/auth/register',
      payload
    );
    const data = response.data;
    if (data?.token) {
      Cookies.set(TOKEN_KEY, data.token, { expires: 1 });
    }
    return data;
  }

  async loginWithGoogle(idToken: string): Promise<IAuthResponse> {
    const response = await apiRequest.post<unknown, { data: IAuthResponse }>(
      '/auth/google',
      { idToken }
    );
    const data = response.data;
    if (data?.token) {
      Cookies.set(TOKEN_KEY, data.token, { expires: 1 });
    }
    return data;
  }

  async logout(): Promise<void> {
    try {
      await apiRequest.post('/auth/logout');
    } finally {
      Cookies.remove(TOKEN_KEY);
    }
  }

  async requestPassword(userCode: string): Promise<{ message: string }> {
    const response = await apiRequest.post<unknown, { data: { message: string } }>(
      '/auth/request-password',
      { userCode }
    );
    return response.data;
  }

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const response = await apiRequest.post<unknown, { data: { message: string } }>(
      '/auth/forgot-password',
      { identifier }
    );
    return response.data;
  }

  async me(): Promise<any> {
    return apiRequest.get('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiRequest.post<unknown, { data: { message: string } }>(
      '/auth/change-password',
      { currentPassword, newPassword }
    );
    return response.data;
  }

  async updateProfile(userId: string, data: Partial<{ name: string; phone: string; username: string }>): Promise<any> {
    const response = await apiRequest.put(`/users/${userId}`, data);
    return (response as any).data;
  }

  async getMyProfile(): Promise<any> {
    const response = await apiRequest.get('/users/me/profile');
    return (response as any).data;
  }

  getToken(): string | null {
    return Cookies.get(TOKEN_KEY) || null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
