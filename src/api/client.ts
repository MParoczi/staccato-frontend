import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import i18next from 'i18next';
import { useAuthStore } from '@/stores/authStore';
import { rawClient } from './raw-client';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and configure it.',
  );
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -- Request interceptor: auth + language headers --
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = i18next.language ?? 'en';
  return config;
});

// -- Response interceptor: 401 silent refresh --
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export function silentRefresh(): Promise<string> {
  if (useAuthStore.getState().isLoggingOut) {
    return Promise.reject(new Error('Logout in progress'));
  }
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = rawClient
      .post<{ accessToken: string; expiresIn: number }>('/auth/refresh')
      .then((res) => {
        const { accessToken, expiresIn } = res.data;
        useAuthStore.getState().setAuth(accessToken, expiresIn);
        return accessToken;
      })
      .catch((err) => {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(err);
      })
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
  }
  return refreshPromise!;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const newToken = await silentRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
