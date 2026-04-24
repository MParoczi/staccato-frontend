import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { toast } from 'sonner';
import { LessonPage } from './LessonPage';
import { useUIStore } from '@/stores/uiStore';
import type {
  LessonDetail,
  Module,
  NotebookDetail,
  NotebookModuleStyle,
} from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && typeof options === 'object' && 'moduleType' in options) {
        return `${String(options.moduleType)} module`;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const notebook: NotebookDetail = {
  id: 'nb-1',
  title: 'My Notebook',
  instrumentId: 'instr-1',
  instrumentName: 'Guitar',
  pageSize: 'A4',
  coverColor: '#ffffff',
  lessonCount: 1,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
  styles: [
    {
      id: 'style-theory',
      notebookId: 'nb-1',
      moduleType: 'Theory',
      backgroundColor: '#FFFFFF',
      borderColor: '#000000',
      borderStyle: 'Solid',
      borderWidth: 1,
      borderRadius: 2,
      headerBgColor: '#EEEEEE',
      headerTextColor: '#111111',
      bodyTextColor: '#222222',
      fontFamily: 'Default',
    } satisfies NotebookModuleStyle,
  ],
};

const lesson: LessonDetail = {
  id: 'lesson-1',
  notebookId: 'nb-1',
  title: 'Lesson One',
  createdAt: '2026-03-01T00:00:00Z',
  pages: [
    {
      id: 'page-1',
      lessonId: 'lesson-1',
      pageNumber: 1,
      moduleCount: 2,
    },
  ],
};

const modulesFixture: Module[] = [
  {
    id: 'module-top',
    lessonPageId: 'page-1',
    moduleType: 'Theory',
    gridX: 0,
    gridY: 0,
    gridWidth: 8,
    gridHeight: 5,
    zIndex: 2,
    content: [],
  },
  {
    id: 'module-bottom',
    lessonPageId: 'page-1',
    moduleType: 'Practice',
    gridX: 0,
    gridY: 10,
    gridWidth: 8,
    gridHeight: 5,
    zIndex: 0,
    content: [],
  },
];

vi.mock('../hooks/useNotebook', () => ({
  useNotebook: () => ({ data: notebook }),
}));

vi.mock('../hooks/useLesson', () => ({
  useLesson: () => ({ data: lesson }),
}));

vi.mock('../hooks/usePageNavigation', () => ({
  usePageNavigation: () => ({
    pageNumberInLesson: 1,
    totalPagesInLesson: 1,
    globalPageNumber: 1,
  }),
}));

vi.mock('../hooks/useCreatePage', () => ({
  useCreatePage: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useDeletePage', () => ({
  useDeletePage: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/usePageModules', () => ({
  usePageModules: () => ({ data: modulesFixture, isLoading: false }),
  pageModulesQueryKey: (pageId: string) =>
    ['pages', pageId, 'modules'] as const,
}));

const scheduleLayoutUpdateMock = vi.fn();
vi.mock('../hooks/useModuleLayoutMutations', () => ({
  useModuleLayoutMutations: () => ({
    scheduleLayoutUpdate: scheduleLayoutUpdateMock,
    updateLayoutMutation: { mutate: vi.fn(), isPending: false },
    createModuleMutation: { mutate: vi.fn(), isPending: false },
    deleteModuleMutation: { mutate: vi.fn(), isPending: false },
    flushPendingLayoutUpdates: vi.fn(),
  }),
}));

function renderLessonPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter
      initialEntries={['/app/notebooks/nb-1/lessons/lesson-1/pages/page-1']}
    >
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route
            path="/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId"
            element={<LessonPage />}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('LessonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scheduleLayoutUpdateMock.mockReset();
    act(() => {
      useUIStore.getState().clearSelectedModule();
      useUIStore.getState().setZoom(1);
    });
  });

  it('renders the dotted-paper canvas at the notebook page size', async () => {
    renderLessonPage();
    const paper = await screen.findByTestId('dotted-paper');
    // A4 = 42 x 59 at zoom 1
    expect(paper.style.width).toBe('840px');
    expect(paper.style.height).toBe('1180px');
  });

  it('renders saved modules in z-index order', async () => {
    renderLessonPage();
    const surface = await screen.findByTestId('grid-canvas-surface');
    const ids = Array.from(surface.querySelectorAll('[data-module-id]')).map(
      (el) => el.getAttribute('data-module-id'),
    );
    expect(ids).toEqual(['module-bottom', 'module-top']);
  });

  it('selects a module on click and clears it on empty-canvas pointer-down', async () => {
    renderLessonPage();

    const card = await screen.findByTestId('module-card-module-top');
    fireEvent.click(card);
    await waitFor(() => {
      expect(useUIStore.getState().selectedModuleId).toBe('module-top');
    });
    expect(screen.getByTestId('module-resize-handle-n')).toBeTruthy();

    const surface = screen.getByTestId('grid-canvas-surface');
    fireEvent.pointerDown(surface);
    await waitFor(() => {
      expect(useUIStore.getState().selectedModuleId).toBeNull();
    });
  });

  it('commits a valid resize release through the optimistic layout mutation', async () => {
    renderLessonPage();

    const card = await screen.findByTestId('module-card-module-top');
    fireEvent.click(card);
    await waitFor(() => {
      expect(useUIStore.getState().selectedModuleId).toBe('module-top');
    });

    const seHandle = screen.getByTestId('module-resize-handle-se');
    fireEvent.pointerDown(seHandle, {
      clientX: 160,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent(
      window,
      Object.assign(new Event('pointerup', { bubbles: true }), {
        clientX: 200,
        clientY: 120,
      }),
    );

    await waitFor(() => {
      expect(scheduleLayoutUpdateMock).toHaveBeenCalled();
    });
    const [moduleId, layout] = scheduleLayoutUpdateMock.mock.calls[0];
    expect(moduleId).toBe('module-top');
    expect(layout).toMatchObject({
      gridWidth: modulesFixture[0].gridWidth + 2,
      gridHeight: modulesFixture[0].gridHeight + 1,
    });
  });

  it('rolls back via toast feedback when a resize release overlaps a sibling', async () => {
    renderLessonPage();

    const card = await screen.findByTestId('module-card-module-top');
    fireEvent.click(card);

    const seHandle = screen.getByTestId('module-resize-handle-se');
    fireEvent.pointerDown(seHandle, {
      clientX: 160,
      clientY: 100,
      pointerId: 1,
    });
    // Expand far enough to intersect module-bottom at (0, 10).
    fireEvent(
      window,
      Object.assign(new Event('pointerup', { bubbles: true }), {
        clientX: 160,
        clientY: 400,
      }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'notebooks.canvas.toasts.layoutInvalid',
      );
    });
    expect(scheduleLayoutUpdateMock).not.toHaveBeenCalled();
  });
});
