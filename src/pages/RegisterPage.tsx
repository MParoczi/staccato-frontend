import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

export default function RegisterPage() {
  const status = useAuthStore((s) => s.status)
  if (status === 'authenticated') return <Navigate to="/app/notebooks" replace />
  return <div>Register</div>
}
