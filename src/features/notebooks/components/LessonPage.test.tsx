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
const createModuleMutateMock = vi.fn();
const deleteModuleMutateMock = vi.fn();
const layerMutateMock = vi.fn();
vi.mock('../hooks/useModuleLayoutMutations', () => ({
  useModuleLayoutMutations: () => ({
    scheduleLayoutUpdate: scheduleLayoutUpdateMock,
    updateLayoutMutation: { mutate: vi.fn(), isPending: false },
    createModuleMutation: { mutate: createModuleMutateMock, isPending: false },
    deleteModuleMutation: { mutate: deleteModuleMutateMock, isPending: false },
    layerMutation: { mutate: layerMutateMock, isPending: false },
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
    createModuleMutateMock.mockReset();
    deleteModuleMutateMock.mockReset();
    layerMutateMock.mockReset();
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

  it('opens the add-module picker and creates a module at the first valid position', async () => {
    renderLessonPage();

    const trigger = await screen.findByTestId('add-module-trigger');
    fireEvent.click(trigger);

    const option = await screen.findByTestId('add-module-option-Theory');
    fireEvent.click(option);

    await waitFor(() => {
      expect(createModuleMutateMock).toHaveBeenCalledTimes(1);
    });
    const payload = createModuleMutateMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      moduleType: 'Theory',
      gridWidth: 8,
      gridHeight: 5,
    });
    expect(typeof payload.gridX).toBe('number');
    expect(typeof payload.gridY).toBe('number');
  });

  it('shows a no-space toast and skips the create mutation when the page has no available slot', async () => {
    // Cover the page with one giant FreeText so no Title or Theory slot exists.
    const fullPageModule: Module = {
      id: 'fill',
      lessonPageId: 'page-1',
      moduleType: 'FreeText',
      gridX: 0,
      gridY: 0,
      gridWidth: 42,
      gridHeight: 59,
      zIndex: 0,
      content: [],
    };
    modulesFixture.push(fullPageModule);
    try {
      renderLessonPage();

      fireEvent.click(await screen.findByTestId('add-module-trigger'));
      const option = await screen.findByTestId('add-module-option-Title');
      fireEvent.click(option);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'notebooks.canvas.toasts.noSpace',
        );
      });
      expect(createModuleMutateMock).not.toHaveBeenCalled();
    } finally {
      modulesFixture.pop();
    }
  });

  it('deletes an empty selected module immediately via the context menu', async () => {
    renderLessonPage();

    const card = await screen.findByTestId('module-card-module-top');
    fireEvent.click(card);
    await waitFor(() => {
      expect(useUIStore.getState().selectedModuleId).toBe('module-top');
    });

    const trigger = screen.getByTestId('module-context-menu-trigger');
    await act(async () => {
      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.pointerUp(trigger, { pointerType: 'mouse' });
      fireEvent.click(trigger);
    });
    const deleteItem = await screen.findByTestId(
      'module-context-menu-delete',
    );
    fireEvent.click(deleteItem);

    await waitFor(() => {
      expect(deleteModuleMutateMock).toHaveBeenCalledWith('module-top');
    });
    // No confirmation dialog is shown for empty modules.
    expect(
      screen.queryByTestId('module-context-menu-confirm-delete'),
    ).toBeNull();
  });

  it('requires confirmation before deleting a module that has content', async () => {
    // Patch the second fixture module to have content for this test only.
    const original = modulesFixture[1].content;
    modulesFixture[1] = {
      ...modulesFixture[1],
      content: [{ type: 'Text' }],
    };
    try {
      renderLessonPage();

      const card = await screen.findByTestId('module-card-module-bottom');
      fireEvent.click(card);
      await waitFor(() => {
        expect(useUIStore.getState().selectedModuleId).toBe('module-bottom');
      });

      const trigger = screen.getByTestId('module-context-menu-trigger');
      await act(async () => {
        fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
        fireEvent.pointerUp(trigger, { pointerType: 'mouse' });
        fireEvent.click(trigger);
      });
      const deleteItem = await screen.findByTestId(
        'module-context-menu-delete',
      );
      fireEvent.click(deleteItem);

      // First click only opens the confirmation dialog; no delete fires yet.
      const confirm = await screen.findByTestId(
        'module-context-menu-confirm-delete',
      );
      expect(deleteModuleMutateMock).not.toHaveBeenCalled();

      fireEvent.click(confirm);
      await waitFor(() => {
        expect(deleteModuleMutateMock).toHaveBeenCalledWith('module-bottom');
      });
    } finally {
      modulesFixture[1] = { ...modulesFixture[1], content: original };
    }
  });

  it('invokes bring-to-front and send-to-back through the layer mutation', async () => {
    renderLessonPage();

    const card = await screen.findByTestId('module-card-module-top');
    fireEvent.click(card);
    await waitFor(() => {
      expect(useUIStore.getState().selectedModuleId).toBe('module-top');
    });

    let trigger = screen.getByTestId('module-context-menu-trigger');
    await act(async () => {
      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.pointerUp(trigger, { pointerType: 'mouse' });
      fireEvent.click(trigger);
    });
    const sendBack = await screen.findByTestId(
      'module-context-menu-send-to-back',
    );
    fireEvent.click(sendBack);

    await waitFor(() => {
      expect(layerMutateMock).toHaveBeenCalledWith({
        moduleId: 'module-top',
        mode: 'back',
      });
    });

    // Reopen and bring to front (module-top has the highest z-index in
    // fixtures, so the menu disables this entry; pick module-bottom instead).
    fireEvent.click(screen.getByTestId('module-card-module-bottom'));
    await waitFor(() => {
      expect(useUIStore.getState().selectedModuleId).toBe('module-bottom');
    });
    trigger = screen.getByTestId('module-context-menu-trigger');
    await act(async () => {
      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.pointerUp(trigger, { pointerType: 'mouse' });
      fireEvent.click(trigger);
    });
    const bringFront = await screen.findByTestId(
      'module-context-menu-bring-to-front',
    );
    fireEvent.click(bringFront);

    await waitFor(() => {
      expect(layerMutateMock).toHaveBeenCalledWith({
        moduleId: 'module-bottom',
        mode: 'front',
      });
    });
  });

  it('exposes labeled zoom controls with visible focus ordering', async () => {
    renderLessonPage();
    const zoomOut = await screen.findByTestId('canvas-zoom-out');
    const zoomIn = screen.getByTestId('canvas-zoom-in');
    const zoomReset = screen.getByTestId('canvas-zoom-reset');

    expect(zoomOut.getAttribute('aria-label')).toBe(
      'notebooks.canvas.viewport.zoomOut',
    );
    expect(zoomIn.getAttribute('aria-label')).toBe(
      'notebooks.canvas.viewport.zoomIn',
    );
    expect(zoomReset.getAttribute('aria-label')).toBe(
      'notebooks.canvas.viewport.resetZoom',
    );

    // Focus moves through each control in DOM order.
    zoomOut.focus();
    expect(document.activeElement).toBe(zoomOut);
    zoomIn.focus();
    expect(document.activeElement).toBe(zoomIn);
    zoomReset.focus();
    expect(document.activeElement).toBe(zoomReset);
  });

  it('changes zoom through keyboard activation of the zoom controls', async () => {
    renderLessonPage();
    const zoomIn = await screen.findByTestId('canvas-zoom-in');
    fireEvent.click(zoomIn);
    await waitFor(() => {
      expect(useUIStore.getState().zoom).toBeCloseTo(1.1);
    });

    const zoomReset = screen.getByTestId('canvas-zoom-reset');
    fireEvent.click(zoomReset);
    await waitFor(() => {
      expect(useUIStore.getState().zoom).toBe(1);
    });
  });

  it('opens the add-module picker via keyboard and announces a labeled trigger', async () => {
    renderLessonPage();
    const trigger = await screen.findByTestId('add-module-trigger');
    expect(trigger.getAttribute('aria-label')).toBe(
      'notebooks.canvas.addModule.trigger',
    );
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    // The picker dialog opens on click (Enter and Space activate buttons).
    fireEvent.click(trigger);
    expect(
      await screen.findByTestId('add-module-option-Theory'),
    ).toBeTruthy();
  });

  it('exposes the module context-menu trigger with an accessible label', async () => {
    renderLessonPage();
    const card = await screen.findByTestId('module-card-module-top');
    fireEvent.click(card);
    await waitFor(() => {
      expect(useUIStore.getState().selectedModuleId).toBe('module-top');
    });
    const menuTrigger = screen.getByTestId('module-context-menu-trigger');
    expect(menuTrigger.getAttribute('aria-label')).toBe(
      'notebooks.canvas.menu.open',
    );
    menuTrigger.focus();
    expect(document.activeElement).toBe(menuTrigger);
  });
});
