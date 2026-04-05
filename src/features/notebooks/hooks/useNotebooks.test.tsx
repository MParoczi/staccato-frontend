import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useNotebooks } from './useNotebooks';
import type { NotebookSummary } from '@/lib/types';

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
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useNotebooks', () => {
  it('returns data on success', async () => {
    server.use(
      http.get('http://localhost:5000/notebooks', () => {
        return HttpResponse.json(mockNotebooks);
      }),
    );

    const { result } = renderHook(() => useNotebooks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockNotebooks);
    expect(result.current.data).toHaveLength(2);
  });

  it('handles error state', async () => {
    server.use(
      http.get('http://localhost:5000/notebooks', () => {
        return HttpResponse.json(
          { message: 'Internal server error' },
          { status: 500 },
        );
      }),
    );

    const { result } = renderHook(() => useNotebooks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('uses query key ["notebooks"] with staleTime 0', () => {
    server.use(
      http.get('http://localhost:5000/notebooks', () => {
        return HttpResponse.json([]);
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    renderHook(() => useNotebooks(), { wrapper: Wrapper });

    const queryState = queryClient.getQueryCache().findAll({
      queryKey: ['notebooks'],
    });

    expect(queryState).toHaveLength(1);
    expect(queryState[0].options.staleTime).toBe(0);
  });
});
