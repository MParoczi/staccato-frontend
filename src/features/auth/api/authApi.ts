import { rawClient } from '@/api/rawClient'
import type { UserProfile } from '@/types'

interface AuthResponse {
  accessToken: string
  user: UserProfile
}

export async function login(email: string, password: string, rememberMe: boolean): Promise<AuthResponse> {
  const { data } = await rawClient.post<AuthResponse>('/auth/login', { email, password, rememberMe })
  return data
}

export async function register(email: string, displayName: string, password: string): Promise<AuthResponse> {
  const { data } = await rawClient.post<AuthResponse>('/auth/register', { email, displayName, password })
  return data
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const { data } = await rawClient.post<AuthResponse>('/auth/google', { idToken })
  return data
}

export async function logout(): Promise<void> {
  await rawClient.post('/auth/logout')
}
