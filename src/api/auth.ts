import type { User } from '@/lib/types';
import { apiClient } from './client';
import { rawClient } from './raw-client';

export { silentRefresh } from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const res = await rawClient.post<{ accessToken: string }>('/auth/refresh');
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/google', {
    credential,
  });
  return res.data;
}
