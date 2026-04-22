import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { silentRefresh } from '@/api/auth';

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut);
  const location = useLocation();
  const [status, setStatus] = useState<'idle' | 'refreshing' | 'failed'>(
    accessToken ? 'idle' : 'refreshing',
  );

  useEffect(() => {
    if (accessToken || isLoggingOut) return;

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
  }, [accessToken, isLoggingOut]);

  if (accessToken) {
    return <Outlet />;
  }

  if (isLoggingOut) {
    return <Navigate to="/login" replace />;
  }

  if (status === 'refreshing') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (status === 'failed') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
}
