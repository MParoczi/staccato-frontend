import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/Navbar'
import { getMe } from '@/features/profile/api/profileApi'
import { useAuthStore } from '@/stores/authStore'

export function AppLayout() {
  const updateUser = useAuthStore((s) => s.updateUser)
  const { data: me } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (me) updateUser(me)
  }, [me, updateUser])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
