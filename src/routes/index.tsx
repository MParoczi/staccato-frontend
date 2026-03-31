import { createBrowserRouter } from 'react-router';
import { RootRedirect } from './root-redirect';
import { PublicLayout } from './public-layout';
import { ProtectedRoute } from './protected-route';
import { AppLayout } from './app-layout';
import { NotFoundPage } from './not-found';
import { LoginPage } from '@/features/auth/LoginPage';
import {
  RegisterPage,
  NotebooksDashboard,
  NewNotebook,
  NotebookView,
  NotebookIndex,
  PageEditor,
  ProfilePage,
  ExportsPage,
  ChordsPage,
} from './placeholders';

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
          { path: '/app/notebooks', element: <NotebooksDashboard /> },
          { path: '/app/notebooks/new', element: <NewNotebook /> },
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
