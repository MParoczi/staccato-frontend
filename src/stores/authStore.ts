import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  expiresAt: number | null;
  isLoggingOut: boolean;
  setAuth: (token: string, expiresIn: number) => void;
  clearAuth: () => void;
  startLogout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  expiresAt: null,
  isLoggingOut: false,
  setAuth: (token, expiresIn) =>
    set({
      accessToken: token,
      expiresAt: Date.now() + expiresIn * 1000,
    }),
  clearAuth: () => set({ accessToken: null, expiresAt: null, isLoggingOut: false }),
  startLogout: () => set({ isLoggingOut: true }),
}));
