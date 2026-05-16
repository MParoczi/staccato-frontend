import { useEffect } from 'react'
import { rawClient } from '@/api/rawClient'
import { useAuthStore } from '@/stores/authStore'
import type { UserProfile } from '@/types'

export function useProactiveRefresh(): void {
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) return

    let timeoutId: ReturnType<typeof setTimeout>

    try {
      const parts = accessToken.split('.')
      if (parts.length !== 3) return
      const payload = JSON.parse(atob(parts[1])) as { exp?: number }
      if (!payload.exp) return

      const delay = Math.max(0, payload.exp * 1000 - Date.now() - 60_000)

      timeoutId = setTimeout(async () => {
        try {
          const { data } = await rawClient.post<{ accessToken: string; user: UserProfile }>(
            '/auth/refresh'
          )
          useAuthStore.getState().setAuth(data.user, data.accessToken)
        } catch {
          useAuthStore.getState().clearAuth()
        }
      }, delay)
    } catch {
      // Malformed JWT — ignore; the 401 interceptor in client.ts handles auth failures
    }

    return () => clearTimeout(timeoutId)
  }, [accessToken])
}
