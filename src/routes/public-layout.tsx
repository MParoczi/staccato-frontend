import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function PublicLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);

  if (accessToken) {
    return <Navigate to="/app/notebooks" replace />;
  }

  return <Outlet />;
}
