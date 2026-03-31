import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { silentRefresh } from '@/api/client';

export function useProactiveRefresh() {
  const expiresAt = useAuthStore((s) => s.expiresAt);

  useEffect(() => {
    if (expiresAt === null) return;

    const delay = (expiresAt - Date.now()) * 0.8;
    if (delay <= 0) return;

    const timer = setTimeout(() => {
      silentRefresh();
    }, delay);

    return () => clearTimeout(timer);
  }, [expiresAt]);
}
