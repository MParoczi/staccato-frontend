import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { useCanvasInteractions } from './useCanvasInteractions';
import { useUIStore } from '@/stores/uiStore';
import type { Module } from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    id: 'module-a',
    lessonPageId: 'page-1',
    moduleType: 'Theory',
    gridX: 2,
    gridY: 2,
    gridWidth: 8,
    gridHeight: 5,
    zIndex: 0,
    content: [],
    ...overrides,
  };
}

describe('useCanvasInteractions drag session', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().clearSelectedModule();
      useUIStore.getState().setZoom(1);
    });
  });

  it('snaps the drag preview to whole grid units as the pointer moves', () => {
    const moduleA = makeModule();
    const { result } = renderHook(() =>
      useCanvasInteractions({
        pageSize: 'A4',
        modules: [moduleA],
        zoom: 1,
      }),
    );

    act(() => {
      result.current.handleDragStart({
        active: { id: moduleA.id },
      } as DragStartEvent);
    });

    // GRID_BASE_UNIT_PX = 20, zoom = 1 → pixel delta 25 snaps to 1 grid unit.
    act(() => {
      result.current.handleDragMove({
        active: { id: moduleA.id },
        delta: { x: 25, y: 41 },
      } as DragMoveEvent);
    });

    expect(result.current.dragPreview).toMatchObject({
      activeModuleId: moduleA.id,
      previewLayout: {
        gridX: moduleA.gridX + 1,
        gridY: moduleA.gridY + 2,
        gridWidth: moduleA.gridWidth,
        gridHeight: moduleA.gridHeight,
      },
      isValid: true,
    });
    expect(result.current.isInteracting).toBe(true);
  });

  it('marks the preview invalid and reports the conflicting module when overlapping', () => {
    const moduleA = makeModule({ id: 'a', gridX: 0, gridY: 0 });
    const moduleB = makeModule({ id: 'b', gridX: 10, gridY: 0 });
    const { result } = renderHook(() =>
      useCanvasInteractions({
        pageSize: 'A4',
        modules: [moduleA, moduleB],
        zoom: 1,
      }),
    );

    act(() => {
      result.current.handleDragStart({
        active: { id: moduleA.id },
      } as DragStartEvent);
    });
    // Drag moduleA 10 grid units right → directly on top of moduleB.
    act(() => {
      result.current.handleDragMove({
        active: { id: moduleA.id },
        delta: { x: 200, y: 0 },
      } as DragMoveEvent);
    });

    expect(result.current.dragPreview?.isValid).toBe(false);
    expect(result.current.conflictingModuleId).toBe('b');
  });

  it('commits a valid drag release through onCommitLayout', () => {
    const moduleA = makeModule();
    const onCommitLayout = vi.fn();
    const { result } = renderHook(() =>
      useCanvasInteractions({
        pageSize: 'A4',
        modules: [moduleA],
        zoom: 1,
        onCommitLayout,
      }),
    );

    act(() => {
      result.current.handleDragStart({
        active: { id: moduleA.id },
      } as DragStartEvent);
    });
    act(() => {
      result.current.handleDragEnd({
        active: { id: moduleA.id },
        delta: { x: 40, y: 0 },
      } as DragEndEvent);
    });

    expect(onCommitLayout).toHaveBeenCalledWith(moduleA.id, {
      gridX: moduleA.gridX + 2,
      gridY: moduleA.gridY,
      gridWidth: moduleA.gridWidth,
      gridHeight: moduleA.gridHeight,
      zIndex: moduleA.zIndex,
    });
    expect(result.current.dragPreview).toBeNull();
    expect(result.current.isInteracting).toBe(false);
  });

  it('rejects an out-of-bounds drag and notifies onInvalidLayout', () => {
    const moduleA = makeModule({ gridX: 30, gridY: 0 });
    const onCommitLayout = vi.fn();
    const onInvalidLayout = vi.fn();
    const { result } = renderHook(() =>
      useCanvasInteractions({
        pageSize: 'A4', // width=42, so moduleA right edge at 38 + 4 → 42 OK; push past.
        modules: [moduleA],
        zoom: 1,
        onCommitLayout,
        onInvalidLayout,
      }),
    );

    act(() => {
      result.current.handleDragStart({
        active: { id: moduleA.id },
      } as DragStartEvent);
    });
    // Push far right past page bounds (42 grid units wide).
    act(() => {
      result.current.handleDragEnd({
        active: { id: moduleA.id },
        delta: { x: 400, y: 0 },
      } as DragEndEvent);
    });

    expect(onCommitLayout).not.toHaveBeenCalled();
    expect(onInvalidLayout).toHaveBeenCalledWith('OUT_OF_BOUNDS', moduleA.id);
  });
});

describe('useCanvasInteractions resize session', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().clearSelectedModule();
      useUIStore.getState().setZoom(1);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function dispatchPointer(type: string, clientX: number, clientY: number) {
    const event = new Event(type, { bubbles: true }) as PointerEvent & {
      clientX: number;
      clientY: number;
    };
    Object.assign(event, { clientX, clientY });
    window.dispatchEvent(event);
  }

  it('snaps a south-east resize drag to whole grid units and commits on release', () => {
    const moduleA = makeModule({ gridX: 2, gridY: 2, gridWidth: 8, gridHeight: 5 });
    const onCommitLayout = vi.fn();
    const { result } = renderHook(() =>
      useCanvasInteractions({
        pageSize: 'A4',
        modules: [moduleA],
        zoom: 1,
        onCommitLayout,
      }),
    );

    act(() => {
      // Simulate a pointerdown on the 'se' handle.
      const fakeEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 100,
      } as unknown as React.PointerEvent<Element>;
      result.current.beginResize(moduleA.id, 'se', fakeEvent);
    });

    expect(result.current.resizeSession).toMatchObject({
      moduleId: moduleA.id,
      handle: 'se',
      previewLayout: {
        gridX: moduleA.gridX,
        gridY: moduleA.gridY,
        gridWidth: moduleA.gridWidth,
        gridHeight: moduleA.gridHeight,
      },
    });
    expect(result.current.isInteracting).toBe(true);

    // Move pointer 40px right, 20px down → +2 width, +1 height at zoom 1.
    act(() => {
      dispatchPointer('pointermove', 140, 120);
    });
    expect(result.current.resizeSession?.previewLayout).toMatchObject({
      gridWidth: moduleA.gridWidth + 2,
      gridHeight: moduleA.gridHeight + 1,
    });

    act(() => {
      dispatchPointer('pointerup', 140, 120);
    });

    expect(onCommitLayout).toHaveBeenCalledWith(moduleA.id, {
      gridX: moduleA.gridX,
      gridY: moduleA.gridY,
      gridWidth: moduleA.gridWidth + 2,
      gridHeight: moduleA.gridHeight + 1,
      zIndex: moduleA.zIndex,
    });
    expect(result.current.resizeSession).toBeNull();
    expect(result.current.isInteracting).toBe(false);
  });

  it('keeps the preview at the minimum size instead of shrinking below MODULE_MIN_SIZES', () => {
    const moduleA = makeModule({
      moduleType: 'Theory', // min 8x5
      gridX: 2,
      gridY: 2,
      gridWidth: 8,
      gridHeight: 5,
    });
    const { result } = renderHook(() =>
      useCanvasInteractions({
        pageSize: 'A4',
        modules: [moduleA],
        zoom: 1,
      }),
    );

    act(() => {
      const fakeEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
        clientX: 200,
        clientY: 200,
      } as unknown as React.PointerEvent<Element>;
      result.current.beginResize(moduleA.id, 'se', fakeEvent);
    });

    // Drag pointer drastically left/up → width/height would go negative.
    act(() => {
      dispatchPointer('pointermove', 0, 0);
    });

    expect(result.current.resizeSession?.previewLayout).toMatchObject({
      gridWidth: 8, // clamped to minimum
      gridHeight: 5,
    });

    // Release inside the clamped preview: equal to start → no commit.
    act(() => {
      dispatchPointer('pointerup', 0, 0);
    });
    expect(result.current.resizeSession).toBeNull();
  });

  it('rejects a resize release that overlaps a sibling and invokes onInvalidLayout', () => {
    const moduleA = makeModule({ id: 'a', gridX: 0, gridY: 0 });
    const moduleB = makeModule({
      id: 'b',
      gridX: 10,
      gridY: 0,
      gridWidth: 8,
      gridHeight: 5,
    });
    const onCommitLayout = vi.fn();
    const onInvalidLayout = vi.fn();
    const { result } = renderHook(() =>
      useCanvasInteractions({
        pageSize: 'A4',
        modules: [moduleA, moduleB],
        zoom: 1,
        onCommitLayout,
        onInvalidLayout,
      }),
    );

    act(() => {
      const fakeEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
        clientX: 200,
        clientY: 20,
      } as unknown as React.PointerEvent<Element>;
      result.current.beginResize(moduleA.id, 'e', fakeEvent);
    });

    // Expand moduleA's east edge far enough to intersect moduleB.
    act(() => {
      dispatchPointer('pointerup', 400, 20);
    });

    expect(onCommitLayout).not.toHaveBeenCalled();
    expect(onInvalidLayout).toHaveBeenCalled();
    const [code] = onInvalidLayout.mock.calls[0];
    expect(code).toBe('OVERLAP');
  });
});

describe('useCanvasInteractions selection (regression)', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().clearSelectedModule();
    });
  });

  it('selects and clears selection through the existing handlers', () => {
    const { result } = renderHook(() => useCanvasInteractions());
    act(() => {
      result.current.selectModule('module-a');
    });
    expect(result.current.selectedModuleId).toBe('module-a');
    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedModuleId).toBeNull();
  });
});
