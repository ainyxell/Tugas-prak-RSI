// frontend/src/lib/http.ts

import axios from 'axios';
import type { ApiErrorBody } from '../types/api.ts';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api';

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isSessionCheck = url.endsWith('/auth/me');
      const isLoginOrRegister =
        url.endsWith('/auth/login') || url.endsWith('/auth/register');

      if (!isSessionCheck && !isLoginOrRegister) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan pada sistem.',
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const errorData = error.response?.data;
    if (errorData?.errors && errorData.errors.length > 0) {
      return errorData.errors.map((e) => e.message).join(', ');
    }
    if (errorData?.message) {
      return errorData.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
