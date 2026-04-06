import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useUpdateNotebook } from './useUpdateNotebook';
import type { NotebookDetail, NotebookSummary } from '@/lib/types';

const notebookId = 'nb-1';

const mockNotebookDetail: NotebookDetail = {
  id: notebookId,
  title: 'Guitar Basics',
  instrumentId: 'inst-1',
  instrumentName: '6-String Guitar',
  pageSize: 'A4',
  coverColor: '#8B4513',
  lessonCount: 3,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-04-03T14:30:00Z',
  styles: [],
};

const mockNotebooks: NotebookSummary[] = [
  {
    id: notebookId,
    title: 'Guitar Basics',
    instrumentName: '6-String Guitar',
    pageSize: 'A4',
    coverColor: '#8B4513',
    lessonCount: 3,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-04-03T14:30:00Z',
  },
];

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

  queryClient.setQueryData(['notebooks'], [...mockNotebooks]);
  queryClient.setQueryData(['notebooks', notebookId], { ...mockNotebookDetail });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('useUpdateNotebook', () => {
  it('sends PUT request to /notebooks/{id}', async () => {
    let capturedMethod = '';
    server.use(
      http.put(`http://localhost:5000/notebooks/${notebookId}`, ({ request }) => {
        capturedMethod = request.method;
        return HttpResponse.json(
          { ...mockNotebookDetail, coverColor: '#FF0000' },
          { status: 200 },
        );
      }),
    );

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateNotebook(notebookId), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ coverColor: '#FF0000' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedMethod).toBe('PUT');
  });

  it('invalidates ["notebooks", notebookId] and ["notebooks"] on success', async () => {
    server.use(
      http.put(`http://localhost:5000/notebooks/${notebookId}`, () => {
        return HttpResponse.json(
          { ...mockNotebookDetail, title: 'Updated Title' },
          { status: 200 },
        );
      }),
    );

    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useUpdateNotebook(notebookId), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ title: 'Updated Title' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const detailState = queryClient.getQueryState(['notebooks', notebookId]);
    expect(detailState?.isInvalidated).toBe(true);

    const listState = queryClient.getQueryState(['notebooks']);
    expect(listState?.isInvalidated).toBe(true);
  });

  it('updates both title and coverColor in a single request', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.put(`http://localhost:5000/notebooks/${notebookId}`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          { ...mockNotebookDetail, title: 'New Title', coverColor: '#00FF00' },
          { status: 200 },
        );
      }),
    );

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateNotebook(notebookId), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ title: 'New Title', coverColor: '#00FF00' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(capturedBody).toEqual({ title: 'New Title', coverColor: '#00FF00' });
  });

  it('rejects on non-2xx response and does not invalidate queries', async () => {
    server.use(
      http.put(`http://localhost:5000/notebooks/${notebookId}`, () => {
        return HttpResponse.json(
          { message: 'Not found' },
          { status: 404 },
        );
      }),
    );

    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useUpdateNotebook(notebookId), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({ title: 'Fail' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const detailState = queryClient.getQueryState(['notebooks', notebookId]);
    expect(detailState?.isInvalidated).toBe(false);

    const listState = queryClient.getQueryState(['notebooks']);
    expect(listState?.isInvalidated).toBe(false);
  });
});
