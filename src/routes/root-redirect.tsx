import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function RootRedirect() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? (
    <Navigate to="/app/notebooks" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
