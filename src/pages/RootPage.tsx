import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

export default function RootPage() {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return null
  if (status === 'authenticated') return <Navigate to="/app/notebooks" replace />
  return <Navigate to="/login" replace />
}
