import axios from 'axios';
import getConfig from 'next/config';
import Cookies from 'js-cookie';

const { publicRuntimeConfig } = getConfig() || {};
const API_ENDPOINT = publicRuntimeConfig?.API_ENDPOINT || 'http://localhost:5001';

export const TOKEN_KEY = 'user_token';

const apiRequest = axios.create({
  baseURL: API_ENDPOINT,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiRequest.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiRequest.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Có lỗi xảy ra';

    // Nếu token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export { apiRequest };
