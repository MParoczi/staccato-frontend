import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router';
import { useCreateNotebook } from './useCreateNotebook';
import type { NotebookSummary, NotebookDetail } from '@/lib/types';

const mockNotebooks: NotebookSummary[] = [
  {
    id: '1',
    title: 'Existing Notebook',
    instrumentName: '6-String Guitar',
    pageSize: 'A4',
    coverColor: '#8B4513',
    lessonCount: 3,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-04-03T14:30:00Z',
  },
];

const mockCreated: NotebookDetail = {
  id: 'new-id',
  title: 'New Notebook',
  instrumentId: 'inst-1',
  instrumentName: '6-String Guitar',
  pageSize: 'A4',
  coverColor: '#8B4513',
  lessonCount: 0,
  createdAt: '2026-04-04T10:00:00Z',
  updatedAt: '2026-04-04T10:00:00Z',
  styles: [],
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Seed the notebooks cache
  queryClient.setQueryData(['notebooks'], mockNotebooks);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return { Wrapper, queryClient };
}

describe('useCreateNotebook', () => {
  it('invalidates ["notebooks"] on success', async () => {
    server.use(
      http.post('http://localhost:5000/notebooks', () => {
        return HttpResponse.json(mockCreated, { status: 201 });
      }),
    );

    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useCreateNotebook(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      title: 'New Notebook',
      instrumentId: 'inst-1',
      pageSize: 'A4',
      coverColor: '#8B4513',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // After success, ["notebooks"] query should be invalidated
    const queryState = queryClient.getQueryState(['notebooks']);
    expect(queryState?.isInvalidated).toBe(true);
  });

  it('returns error on 400 response', async () => {
    server.use(
      http.post('http://localhost:5000/notebooks', () => {
        return HttpResponse.json(
          { errors: { title: ['Title is required'] } },
          { status: 400 },
        );
      }),
    );

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateNotebook(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      title: '',
      instrumentId: 'inst-1',
      pageSize: 'A4',
      coverColor: '#8B4513',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
