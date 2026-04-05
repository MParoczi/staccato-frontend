import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotebookToolbar } from './NotebookToolbar';
import { useUIStore } from '@/stores/uiStore';
import type { NotebookDetail } from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn() },
}));

const mockNotebook: NotebookDetail = {
  id: 'nb-1',
  title: 'Test Notebook',
  instrumentId: 'inst-1',
  instrumentName: '6-String Guitar',
  pageSize: 'A4',
  coverColor: '#8B4513',
  lessonCount: 3,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-04-03T14:30:00Z',
  styles: [],
};

function renderToolbar(props?: Partial<Parameters<typeof NotebookToolbar>[0]>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <NotebookToolbar
          notebook={mockNotebook}
          globalPageNumber={1}
          currentPageType="lesson"
          lessonId="lesson-1"
          {...props}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('NotebookToolbar sidebar toggle button', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: false, zoom: 1 });
  });

  it('renders a visible "Lessons" text label', () => {
    renderToolbar();
    expect(
      screen.getByText('notebooks.shell.toolbar.lessons'),
    ).toBeInTheDocument();
  });

  it('renders the toggle button with an accessible label', () => {
    renderToolbar();
    const button = screen.getByRole('button', {
      name: 'notebooks.shell.toolbar.toggleSidebar',
    });
    expect(button).toBeInTheDocument();
  });

  it('uses outline variant styling instead of ghost', () => {
    renderToolbar();
    const button = screen.getByRole('button', {
      name: 'notebooks.shell.toolbar.toggleSidebar',
    });
    expect(button.className).toContain('border');
  });

  it('toggles sidebar open when clicked', () => {
    renderToolbar();
    const button = screen.getByRole('button', {
      name: 'notebooks.shell.toolbar.toggleSidebar',
    });

    fireEvent.click(button);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('toggles sidebar closed when clicked again', () => {
    useUIStore.setState({ sidebarOpen: true });
    renderToolbar();
    const button = screen.getByRole('button', {
      name: 'notebooks.shell.toolbar.toggleSidebar',
    });

    fireEvent.click(button);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('is visually distinct from utility icon buttons', () => {
    renderToolbar();
    const lessonsButton = screen.getByRole('button', {
      name: 'notebooks.shell.toolbar.toggleSidebar',
    });
    const deleteButton = screen.getByRole('button', {
      name: 'notebooks.shell.toolbar.delete',
    });

    expect(lessonsButton.className).not.toBe(deleteButton.className);
  });
});
