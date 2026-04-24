import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  GoogleAuthRequest,
} from '@/lib/types';
import { apiClient } from './client';
import { rawClient } from './raw-client';

export { silentRefresh } from './client';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function logout(): Promise<void> {
  await rawClient.delete('/auth/logout');
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/google', {
    idToken,
  } satisfies GoogleAuthRequest);
  return res.data;
}
