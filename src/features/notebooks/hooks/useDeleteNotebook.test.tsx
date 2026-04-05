import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import { useDeleteNotebook } from './useDeleteNotebook';
import type { NotebookSummary } from '@/lib/types';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import { toast } from 'sonner';

const mockNotebooks: NotebookSummary[] = [
  {
    id: '1',
    title: 'Guitar Basics',
    instrumentName: '6-String Guitar',
    pageSize: 'A4',
    coverColor: '#8B4513',
    lessonCount: 12,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-04-03T14:30:00Z',
  },
  {
    id: '2',
    title: 'Bass Fundamentals',
    instrumentName: '4-String Bass',
    pageSize: 'A5',
    coverColor: '#1B2A4A',
    lessonCount: 5,
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-03-20T12:00:00Z',
  },
];

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  queryClient.setQueryData(['notebooks'], [...mockNotebooks]);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('useDeleteNotebook', () => {
  it('optimistically removes notebook from cache on mutate', async () => {
    server.use(
      http.delete('http://localhost:5000/notebooks/1', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useDeleteNotebook(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('1');
    });

    // Optimistic update should remove the notebook immediately
    await waitFor(() => {
      const cached = queryClient.getQueryData<NotebookSummary[]>(['notebooks']);
      expect(cached).toHaveLength(1);
      expect(cached?.[0].id).toBe('2');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('rolls back cache on error and shows error toast', async () => {
    server.use(
      http.delete('http://localhost:5000/notebooks/1', () => {
        return HttpResponse.json(
          { message: 'Not found' },
          { status: 404 },
        );
      }),
    );

    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useDeleteNotebook(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Cache should be restored to the original state
    const cached = queryClient.getQueryData<NotebookSummary[]>(['notebooks']);
    expect(cached).toHaveLength(2);
    expect(cached?.[0].id).toBe('1');
    expect(cached?.[1].id).toBe('2');

    // Error toast should have been shown
    expect(toast.error).toHaveBeenCalledWith('notebooks.delete.error');
  });

  it('invalidates ["notebooks"] on settled', async () => {
    server.use(
      http.delete('http://localhost:5000/notebooks/1', () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useDeleteNotebook(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // After settled, ["notebooks"] query should be invalidated
    const queryState = queryClient.getQueryState(['notebooks']);
    expect(queryState?.isInvalidated).toBe(true);
  });
});
