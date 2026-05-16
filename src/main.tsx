import './i18n'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from '@/components/ui/sonner'
import { rawClient } from './api/rawClient'
import { useAuthStore } from './stores/authStore'
import type { UserProfile } from './types'
import { router } from './router'
import { env } from './env'
import './index.css'

rawClient
  .post<{ accessToken: string; user: UserProfile }>('/auth/refresh')
  .then(({ data }) => {
    useAuthStore.getState().setAuth(data.user, data.accessToken)
  })
  .catch(() => {
    useAuthStore.getState().clearAuth()
  })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 3
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={env.VITE_GOOGLE_CLIENT_ID}>
    <React.StrictMode>
      <React.Suspense fallback={null}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </React.Suspense>
    </React.StrictMode>
  </GoogleOAuthProvider>
)
