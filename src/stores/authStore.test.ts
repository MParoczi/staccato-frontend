import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('has null accessToken and null expiresAt initially', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.expiresAt).toBeNull();
  });

  it('setAuth stores token and computes correct expiresAt', () => {
    const now = 1000000;
    vi.setSystemTime(now);

    useAuthStore.getState().setAuth('tok-123', 900);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('tok-123');
    expect(state.expiresAt).toBe(now + 900 * 1000);

    vi.useRealTimers();
  });

  it('clearAuth resets both to null', () => {
    useAuthStore.getState().setAuth('tok-abc', 600);
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.expiresAt).toBeNull();
  });

  it('setAuth overwrites previous values', () => {
    useAuthStore.getState().setAuth('first', 100);
    useAuthStore.getState().setAuth('second', 200);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('second');
  });

  it('has isLoggingOut false initially', () => {
    expect(useAuthStore.getState().isLoggingOut).toBe(false);
  });

  it('startLogout sets isLoggingOut to true', () => {
    useAuthStore.getState().startLogout();
    expect(useAuthStore.getState().isLoggingOut).toBe(true);
  });

  it('clearAuth resets isLoggingOut to false', () => {
    useAuthStore.getState().startLogout();
    expect(useAuthStore.getState().isLoggingOut).toBe(true);

    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isLoggingOut).toBe(false);
  });

  it('startLogout followed by clearAuth fully resets logout state', () => {
    useAuthStore.getState().setAuth('tok-xyz', 300);
    useAuthStore.getState().startLogout();

    expect(useAuthStore.getState().isLoggingOut).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('tok-xyz');

    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().isLoggingOut).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().expiresAt).toBeNull();
  });
});
