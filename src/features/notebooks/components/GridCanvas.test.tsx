import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { GridCanvas } from './GridCanvas';
import { useUIStore } from '@/stores/uiStore';
import type { Module, NotebookModuleStyle } from '@/lib/types';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

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

function makeModule(overrides: Partial<Module>): Module {
  return {
    id: 'module-x',
    lessonPageId: 'page-1',
    moduleType: 'Theory',
    gridX: 0,
    gridY: 0,
    gridWidth: 5,
    gridHeight: 4,
    zIndex: 0,
    content: [],
    ...overrides,
  };
}

function makeStyle(moduleType: Module['moduleType']): NotebookModuleStyle {
  return {
    id: `style-${moduleType}`,
    notebookId: 'nb-1',
    moduleType,
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderStyle: 'Solid',
    borderWidth: 1,
    borderRadius: 2,
    headerBgColor: '#EEEEEE',
    headerTextColor: '#111111',
    bodyTextColor: '#222222',
    fontFamily: 'Default',
  };
}

describe('GridCanvas', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().clearSelectedModule();
      useUIStore.getState().setZoom(1);
    });
  });

  it('renders the dotted paper surface at true page dimensions for A4', () => {
    render(<GridCanvas pageSize="A4" modules={[]} />);
    const paper = screen.getByTestId('dotted-paper');
    // A4 = 42 x 59 grid units at GRID_BASE_UNIT_PX=20 and zoom=1
    expect(paper.style.width).toBe('840px');
    expect(paper.style.height).toBe('1180px');
  });

  it('renders all saved modules passed in as props', () => {
    const modules: Module[] = [
      makeModule({ id: 'a', gridX: 0, gridY: 0, zIndex: 0 }),
      makeModule({ id: 'b', gridX: 10, gridY: 0, zIndex: 1 }),
      makeModule({ id: 'c', gridX: 0, gridY: 10, zIndex: 2 }),
    ];
    render(<GridCanvas pageSize="A4" modules={modules} />);
    expect(screen.getByTestId('module-card-a')).toBeTruthy();
    expect(screen.getByTestId('module-card-b')).toBeTruthy();
    expect(screen.getByTestId('module-card-c')).toBeTruthy();
  });

  it('orders modules by z-index ascending in the DOM', () => {
    const modules: Module[] = [
      makeModule({ id: 'top', zIndex: 9 }),
      makeModule({ id: 'bottom', zIndex: 0 }),
      makeModule({ id: 'middle', zIndex: 3 }),
    ];
    render(<GridCanvas pageSize="A4" modules={modules} />);
    const surface = screen.getByTestId('grid-canvas-surface');
    const ids = Array.from(surface.querySelectorAll('[data-module-id]')).map(
      (el) => el.getAttribute('data-module-id'),
    );
    expect(ids).toEqual(['bottom', 'middle', 'top']);
  });

  it('selects a module when clicked and clears when the surface is clicked', () => {
    const modules: Module[] = [makeModule({ id: 'select-me' })];
    render(<GridCanvas pageSize="A4" modules={modules} />);

    const card = screen.getByTestId('module-card-select-me');
    fireEvent.click(card);
    expect(useUIStore.getState().selectedModuleId).toBe('select-me');

    // Selection affordances now visible
    expect(screen.getByTestId('module-resize-handle-n')).toBeTruthy();

    // Clicking the empty canvas surface clears the selection
    const surface = screen.getByTestId('grid-canvas-surface');
    fireEvent.pointerDown(surface, {
      // Ensure event target === currentTarget by dispatching on the surface
    });
    expect(useUIStore.getState().selectedModuleId).toBeNull();
  });

  it('does not clear selection when a pointer down originates on a module', () => {
    const modules: Module[] = [makeModule({ id: 'keep-me' })];
    render(<GridCanvas pageSize="A4" modules={modules} />);

    const card = screen.getByTestId('module-card-keep-me');
    fireEvent.click(card);
    expect(useUIStore.getState().selectedModuleId).toBe('keep-me');

    // Pointer-down that bubbles from a child has target !== currentTarget
    fireEvent.pointerDown(card);
    expect(useUIStore.getState().selectedModuleId).toBe('keep-me');
  });

  it('applies the notebook style matching the module type', () => {
    const modules: Module[] = [
      makeModule({ id: 'theory', moduleType: 'Theory' }),
    ];
    const styles = [makeStyle('Theory')];
    render(<GridCanvas pageSize="A4" modules={modules} styles={styles} />);
    const card = screen.getByTestId('module-card-theory');
    expect(card.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('highlights the conflicting module and rejects the release during a resize that would overlap a sibling', () => {
    const moving = makeModule({
      id: 'moving',
      gridX: 0,
      gridY: 0,
      gridWidth: 8,
      gridHeight: 5,
    });
    const blocker = makeModule({
      id: 'blocker',
      gridX: 10,
      gridY: 0,
      gridWidth: 8,
      gridHeight: 5,
    });
    const onCommitLayout = vi.fn();
    render(
      <GridCanvas
        pageSize="A4"
        modules={[moving, blocker]}
        onCommitLayout={onCommitLayout}
      />,
    );

    // Select then start a resize from the east handle.
    fireEvent.click(screen.getByTestId('module-card-moving'));
    const eastHandle = screen.getByTestId('module-resize-handle-e');
    fireEvent.pointerDown(eastHandle, {
      clientX: 160,
      clientY: 50,
      pointerId: 1,
    });

    // Drag east by 200px → 10 grid units → moving's east edge reaches
    // moduleB's west edge. Still no overlap exactly at edges, so push
    // further to force overlap.
    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('pointermove', { bubbles: true }), {
          clientX: 400,
          clientY: 50,
        }),
      );
    });

    expect(
      screen
        .getByTestId('module-card-blocker')
        .getAttribute('data-conflicting'),
    ).toBe('true');

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('pointerup', { bubbles: true }), {
          clientX: 400,
          clientY: 50,
        }),
      );
    });

    expect(onCommitLayout).not.toHaveBeenCalled();
  });

  it('commits a valid resize release through onCommitLayout with the snapped layout', () => {
    const moduleA = makeModule({
      id: 'resizing',
      gridX: 2,
      gridY: 2,
      gridWidth: 8,
      gridHeight: 5,
    });
    const onCommitLayout = vi.fn();
    render(
      <GridCanvas
        pageSize="A4"
        modules={[moduleA]}
        onCommitLayout={onCommitLayout}
      />,
    );

    fireEvent.click(screen.getByTestId('module-card-resizing'));
    const seHandle = screen.getByTestId('module-resize-handle-se');
    fireEvent.pointerDown(seHandle, {
      clientX: 200,
      clientY: 140,
      pointerId: 1,
    });
    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('pointerup', { bubbles: true }), {
          clientX: 240,
          clientY: 160,
        }),
      );
    });

    expect(onCommitLayout).toHaveBeenCalledWith('resizing', {
      gridX: moduleA.gridX,
      gridY: moduleA.gridY,
      gridWidth: moduleA.gridWidth + 2,
      gridHeight: moduleA.gridHeight + 1,
      zIndex: moduleA.zIndex,
    });
  });
});
