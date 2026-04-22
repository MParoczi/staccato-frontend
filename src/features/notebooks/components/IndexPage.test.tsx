import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IndexPage } from './IndexPage';
import type { PageNavigationResult } from '../hooks/usePageNavigation';
import type { NotebookDetail, NotebookIndex } from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { language: 'en' },
  }),
}));

const mockNotebook: NotebookDetail = {
  id: 'nb-1',
  title: 'Test Notebook',
  instrumentId: 'inst-1',
  instrumentName: '6-String Guitar',
  pageSize: 'A4',
  coverColor: '#8B4513',
  lessonCount: 0,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-04-03T14:30:00Z',
  styles: [],
};

const mockIndex: NotebookIndex = { entries: [] };

vi.mock('../hooks/useNotebook', () => ({
  useNotebook: () => ({ data: mockNotebook }),
}));

vi.mock('../hooks/useNotebookIndex', () => ({
  useNotebookIndex: () => ({ data: mockIndex }),
}));

const pageNavMock: { value: PageNavigationResult } = {
  value: {
    prevUrl: null,
    nextUrl: null,
    globalPageNumber: 1,
    currentPageType: 'index',
  },
};

vi.mock('../hooks/usePageNavigation', () => ({
  usePageNavigation: () => pageNavMock.value,
}));

function renderIndexPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <MemoryRouter initialEntries={['/app/notebooks/nb-1/index']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="/app/notebooks/:notebookId/index"
            element={<IndexPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('IndexPage footer page number', () => {
  it('renders the sequence-derived global page number', () => {
    pageNavMock.value = {
      prevUrl: null,
      nextUrl: null,
      globalPageNumber: 1,
      currentPageType: 'index',
    };
    renderIndexPage();
    expect(
      screen.getByText(
        'notebooks.shell.index.pageNumber:{"number":1}',
      ),
    ).toBeInTheDocument();
  });

  it('reflects a non-default sequence position', () => {
    pageNavMock.value = {
      prevUrl: null,
      nextUrl: null,
      globalPageNumber: 7,
      currentPageType: 'index',
    };
    renderIndexPage();
    expect(
      screen.getByText(
        'notebooks.shell.index.pageNumber:{"number":7}',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'notebooks.shell.index.pageNumber:{"number":1}',
      ),
    ).not.toBeInTheDocument();
  });

  it('hides the footer while the sequence is not yet hydrated', () => {
    pageNavMock.value = {
      prevUrl: null,
      nextUrl: null,
      globalPageNumber: null,
      currentPageType: 'index',
    };
    renderIndexPage();
    expect(
      screen.queryByText(/notebooks\.shell\.index\.pageNumber/),
    ).not.toBeInTheDocument();
  });
});
