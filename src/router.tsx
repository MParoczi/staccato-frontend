import { createBrowserRouter, Navigate } from 'react-router'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'
import RootPage from '@/pages/RootPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import NotebooksPage from '@/pages/NotebooksPage'
import ProfilePage from '@/pages/ProfilePage'

export const router = createBrowserRouter([
  { path: '/', element: <RootPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="notebooks" replace /> },
          { path: 'notebooks', element: <PageErrorBoundary><NotebooksPage /></PageErrorBoundary> },
          { path: 'profile', element: <PageErrorBoundary><ProfilePage /></PageErrorBoundary> },
        ],
      },
    ],
  },
])
