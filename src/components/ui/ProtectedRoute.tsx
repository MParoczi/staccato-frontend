import { Navigate, Outlet } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 size={48} className="animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
