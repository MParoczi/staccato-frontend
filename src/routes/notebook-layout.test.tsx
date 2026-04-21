import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from 'vitest';
import { NotebookLayout } from './notebook-layout';
import type { NotebookDetail, NotebookModuleStyle } from '@/lib/types';
import { MODULE_STYLE_TAB_ORDER } from '@/features/styling/utils/style-defaults';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));

const notebookId = 'nb-1';

const mockNotebook: NotebookDetail = {
  id: notebookId,
  title: 'Test Notebook',
  description: 'desc',
  pageWidth: 210,
  pageHeight: 297,
  defaultNumberOfPages: 1,
  visibilityType: 'Private',
  ownerId: 'user-1',
  ownerName: 'Alice',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  totalLessons: 0,
  totalPages: 1,
};

function makeStyles(): NotebookModuleStyle[] {
  return MODULE_STYLE_TAB_ORDER.map((m) => ({
    id: `${m}-id`,
    notebookId,
    moduleType: m,
    backgroundColor: '#FFFFFF',
    borderColor: '#CCCCCC',
    borderStyle: 'Solid',
    borderWidth: 1,
    borderRadius: 4,
    headerBgColor: '#F0E6D3',
    headerTextColor: '#333333',
    bodyTextColor: '#333333',
    fontFamily: 'Default',
  }));
}

const server = setupServer(
  http.get('http://localhost:5000/notebooks/:id', () =>
    HttpResponse.json(mockNotebook, { status: 200 }),
  ),
  http.get('http://localhost:5000/notebooks/:id/lessons', () =>
    HttpResponse.json([], { status: 200 }),
  ),
  http.get('http://localhost:5000/notebooks/:id/styles', () =>
    HttpResponse.json(makeStyles(), { status: 200 }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderLayout() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/notebook/${notebookId}`]}>
        <Routes>
          <Route path="/notebook/:notebookId" element={<NotebookLayout />}>
            <Route index element={<div>cover</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NotebookLayout — style drawer composition', () => {
  it('renders the styles button and opens the drawer when clicked', async () => {
    renderLayout();

    const trigger = await screen.findByRole('button', {
      name: 'styling.toolbar.open',
    });
    expect(
      screen.queryByRole('dialog', { name: 'styling.drawer.title' }),
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);

    await waitFor(() =>
      expect(
        screen.getByRole('dialog', { name: 'styling.drawer.title' }),
      ).toBeInTheDocument(),
    );
  });
});
