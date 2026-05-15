import { create } from 'zustand'
import type { UserProfile } from '@/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: UserProfile | null
  accessToken: string | null
  setAuth: (user: UserProfile, accessToken: string) => void
  clearAuth: () => void
  setLoading: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ status: 'authenticated', user, accessToken }),
  clearAuth: () => set({ status: 'unauthenticated', user: null, accessToken: null }),
  setLoading: () => set({ status: 'loading' }),
}))
