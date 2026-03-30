import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { silentRefresh } from '@/api/auth';

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();
  const [status, setStatus] = useState<'idle' | 'refreshing' | 'failed'>(
    accessToken ? 'idle' : 'refreshing',
  );

  useEffect(() => {
    if (accessToken) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    silentRefresh()
      .then(() => {
        if (!cancelled) setStatus('idle');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (status === 'refreshing') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (status === 'failed') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
