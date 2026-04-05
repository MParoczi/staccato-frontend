import { createBrowserRouter } from 'react-router';
import { RootRedirect } from './root-redirect';
import { PublicLayout } from './public-layout';
import { ProtectedRoute } from './protected-route';
import { AppLayout } from './app-layout';
import { NotFoundPage } from './not-found';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import {
  NotebookView,
  NotebookIndex,
  PageEditor,
  ExportsPage,
  ChordsPage,
} from './placeholders';
import { ProfilePage } from '@/features/profile/components/ProfilePage';
import { NotebooksDashboardPage } from '@/features/notebooks/components/NotebooksDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/app/notebooks', element: <NotebooksDashboardPage /> },
          { path: '/app/notebooks/new', element: <NotebooksDashboardPage /> },
          { path: '/app/notebooks/:notebookId', element: <NotebookView /> },
          {
            path: '/app/notebooks/:notebookId/index',
            element: <NotebookIndex />,
          },
          {
            path: '/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId',
            element: <PageEditor />,
          },
          { path: '/app/profile', element: <ProfilePage /> },
          { path: '/app/exports', element: <ExportsPage /> },
          { path: '/app/chords', element: <ChordsPage /> },
          { path: '/app/*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
