import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const status = useAuthStore((s) => s.status)
  if (status === 'authenticated') return <Navigate to="/app/notebooks" replace />
  return <div>Login</div>
}
