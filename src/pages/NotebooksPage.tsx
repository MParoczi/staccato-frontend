import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/features/auth/api/authApi'
import { Button } from '@/components/ui/button'

export default function NotebooksPage() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Notebooks</h1>
      <Button variant="ghost" onClick={handleLogout} className="mt-4">
        Sign out
      </Button>
    </div>
  )
}
