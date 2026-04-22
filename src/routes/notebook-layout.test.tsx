import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router';
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
import { useUIStore } from '@/stores/uiStore';

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
  http.get('http://localhost:5000/presets', () =>
    HttpResponse.json([], { status: 200 }),
  ),
  http.get('http://localhost:5000/users/me/presets', () =>
    HttpResponse.json([], { status: 200 }),
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

describe('NotebookLayout — zoom/sidebar reset on notebookId change', () => {
  it('does not reset zoom or sidebar on initial mount', async () => {
    useUIStore.setState({ zoom: 1.5, sidebarOpen: true });

    renderLayout();

    await screen.findByRole('button', { name: 'styling.toolbar.open' });

    expect(useUIStore.getState().zoom).toBe(1.5);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('resets zoom and sidebar when the notebookId param changes', async () => {
    useUIStore.setState({ zoom: 1.5, sidebarOpen: true });

    function NavButton() {
      const navigate = useNavigate();
      return (
        <button
          type="button"
          onClick={() => navigate('/notebook/nb-2')}
          data-testid="go-nb2"
        >
          go
        </button>
      );
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/notebook/${notebookId}`]}>
          <NavButton />
          <Routes>
            <Route path="/notebook/:notebookId" element={<NotebookLayout />}>
              <Route index element={<div>cover</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByRole('button', { name: 'styling.toolbar.open' });
    expect(useUIStore.getState().zoom).toBe(1.5);
    expect(useUIStore.getState().sidebarOpen).toBe(true);

    fireEvent.click(screen.getByTestId('go-nb2'));

    await waitFor(() => {
      expect(useUIStore.getState().zoom).toBe(1.0);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  it('applies the zoom via a CSS transform (cross-browser)', async () => {
    useUIStore.setState({ zoom: 1.25, sidebarOpen: false });

    const { container } = renderLayout();
    await screen.findByRole('button', { name: 'styling.toolbar.open' });

    const zoomed = container.querySelector<HTMLDivElement>(
      'div[style*="scale"]',
    );
    expect(zoomed).not.toBeNull();
    expect(zoomed?.style.transform).toBe('scale(1.25)');
    expect(zoomed?.style.transformOrigin).toBe('top center');
    expect(zoomed?.style.width).toBe(`${100 / 1.25}%`);
    expect(zoomed?.style.zoom).toBe('');
  });
});
