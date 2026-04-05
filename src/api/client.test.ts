import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { silentRefresh } from './client';

describe('silentRefresh', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('rejects immediately when isLoggingOut is true', async () => {
    useAuthStore.getState().startLogout();

    await expect(silentRefresh()).rejects.toThrow('Logout in progress');
  });
});
