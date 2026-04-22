import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { rawClient } from './raw-client';
import { silentRefresh } from './client';

describe('silentRefresh', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.restoreAllMocks();
  });

  it('rejects immediately when isLoggingOut is true', async () => {
    useAuthStore.getState().startLogout();

    await expect(silentRefresh()).rejects.toThrow('Logout in progress');
  });

  it('clears auth and does not hard-redirect on refresh failure', async () => {
    useAuthStore.getState().setAuth('stale-token', 3600);

    vi.spyOn(rawClient, 'post').mockRejectedValueOnce(new Error('refresh failed'));

    const hrefSetter = vi.fn();
    const assignFn = vi.fn();
    const replaceFn = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignFn,
        replace: replaceFn,
        set href(value: string) {
          hrefSetter(value);
        },
        get href() {
          return originalLocation.href;
        },
      },
    });

    try {
      await expect(silentRefresh()).rejects.toThrow('refresh failed');
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }

    expect(hrefSetter).not.toHaveBeenCalled();
    expect(assignFn).not.toHaveBeenCalled();
    expect(replaceFn).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
