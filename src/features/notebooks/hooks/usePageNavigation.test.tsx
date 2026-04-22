import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { usePageNavigation } from './usePageNavigation';
import type {
  NotebookIndex,
  LessonSummary,
  LessonDetail,
} from '@/lib/types';

const NOTEBOOK_ID = 'nb-1';

const mockIndex: NotebookIndex = {
  entries: [
    {
      lessonId: 'l1',
      title: 'Lesson 1',
      createdAt: '2026-01-01T00:00:00Z',
      startPageNumber: 2,
    },
    {
      lessonId: 'l2',
      title: 'Lesson 2',
      createdAt: '2026-01-02T00:00:00Z',
      startPageNumber: 5,
    },
  ],
};

const mockLessons: LessonSummary[] = [
  { id: 'l1', title: 'Lesson 1', createdAt: '2026-01-01T00:00:00Z', pageCount: 3 },
  { id: 'l2', title: 'Lesson 2', createdAt: '2026-01-02T00:00:00Z', pageCount: 2 },
];

const mockLessonDetails: Record<string, LessonDetail> = {
  l1: {
    id: 'l1',
    notebookId: NOTEBOOK_ID,
    title: 'Lesson 1',
    createdAt: '2026-01-01T00:00:00Z',
    pages: [
      { id: 'l1-p1', lessonId: 'l1', pageNumber: 1, moduleCount: 0 },
      { id: 'l1-p2', lessonId: 'l1', pageNumber: 2, moduleCount: 0 },
      { id: 'l1-p3', lessonId: 'l1', pageNumber: 3, moduleCount: 0 },
    ],
  },
  l2: {
    id: 'l2',
    notebookId: NOTEBOOK_ID,
    title: 'Lesson 2',
    createdAt: '2026-01-02T00:00:00Z',
    pages: [
      { id: 'l2-p1', lessonId: 'l2', pageNumber: 1, moduleCount: 0 },
      { id: 'l2-p2', lessonId: 'l2', pageNumber: 2, moduleCount: 0 },
    ],
  },
};

const server = setupServer(
  http.get(`http://localhost:5000/notebooks/${NOTEBOOK_ID}/index`, () =>
    HttpResponse.json(mockIndex),
  ),
  http.get(`http://localhost:5000/notebooks/${NOTEBOOK_ID}/lessons`, () =>
    HttpResponse.json(mockLessons),
  ),
  http.get(
    `http://localhost:5000/notebooks/${NOTEBOOK_ID}/lessons/:lessonId`,
    ({ params }) => {
      const detail = mockLessonDetails[String(params.lessonId)];
      if (!detail) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(detail);
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/app/notebooks/:notebookId" element={<>{children}</>} />
            <Route path="/app/notebooks/:notebookId/index" element={<>{children}</>} />
            <Route
              path="/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId"
              element={<>{children}</>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('usePageNavigation', () => {
  it('returns non-null prev/next URLs on a middle lesson page', async () => {
    const { result } = renderHook(() => usePageNavigation(NOTEBOOK_ID), {
      wrapper: createWrapper(
        `/app/notebooks/${NOTEBOOK_ID}/lessons/l1/pages/l1-p2`,
      ),
    });

    await waitFor(() => {
      expect(result.current.prevUrl).not.toBeNull();
      expect(result.current.nextUrl).not.toBeNull();
    });

    expect(result.current.currentPageType).toBe('lesson');
    expect(result.current.prevUrl).toBe(
      `/app/notebooks/${NOTEBOOK_ID}/lessons/l1/pages/l1-p1`,
    );
    expect(result.current.nextUrl).toBe(
      `/app/notebooks/${NOTEBOOK_ID}/lessons/l1/pages/l1-p3`,
    );
    // Cover (0) + Index (1) + l1-p1 (2) + l1-p2 (3) → global page 3
    expect(result.current.globalPageNumber).toBe(3);
    expect(result.current.pageNumberInLesson).toBe(2);
    expect(result.current.totalPagesInLesson).toBe(3);
  });

  it('navigates across lesson boundaries at the last page of a lesson', async () => {
    const { result } = renderHook(() => usePageNavigation(NOTEBOOK_ID), {
      wrapper: createWrapper(
        `/app/notebooks/${NOTEBOOK_ID}/lessons/l1/pages/l1-p3`,
      ),
    });

    await waitFor(() => {
      expect(result.current.nextUrl).not.toBeNull();
    });

    // Next URL should cross into Lesson 2
    expect(result.current.nextUrl).toBe(
      `/app/notebooks/${NOTEBOOK_ID}/lessons/l2/pages/l2-p1`,
    );
    expect(result.current.prevUrl).toBe(
      `/app/notebooks/${NOTEBOOK_ID}/lessons/l1/pages/l1-p2`,
    );
  });

  it('returns null next URL on the final page of the final lesson', async () => {
    const { result } = renderHook(() => usePageNavigation(NOTEBOOK_ID), {
      wrapper: createWrapper(
        `/app/notebooks/${NOTEBOOK_ID}/lessons/l2/pages/l2-p2`,
      ),
    });

    await waitFor(() => {
      expect(result.current.prevUrl).not.toBeNull();
    });

    expect(result.current.nextUrl).toBeNull();
    expect(result.current.prevUrl).toBe(
      `/app/notebooks/${NOTEBOOK_ID}/lessons/l2/pages/l2-p1`,
    );
  });

  it('on the index page, next URL points to the first lesson page and prev URL to the cover', async () => {
    const { result } = renderHook(() => usePageNavigation(NOTEBOOK_ID), {
      wrapper: createWrapper(`/app/notebooks/${NOTEBOOK_ID}/index`),
    });

    await waitFor(() => {
      expect(result.current.nextUrl).not.toBeNull();
    });

    expect(result.current.currentPageType).toBe('index');
    expect(result.current.prevUrl).toBe(`/app/notebooks/${NOTEBOOK_ID}`);
    expect(result.current.nextUrl).toBe(
      `/app/notebooks/${NOTEBOOK_ID}/lessons/l1/pages/l1-p1`,
    );
  });
});
