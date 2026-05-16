import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import RootPage from '@/pages/RootPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import NotebooksPage from '@/pages/NotebooksPage'

export const router = createBrowserRouter([
  { path: '/', element: <RootPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      { path: 'notebooks', element: <NotebooksPage /> },
    ],
  },
])
