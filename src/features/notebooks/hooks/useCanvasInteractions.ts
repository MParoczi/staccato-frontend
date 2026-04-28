import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { useUIStore } from '@/stores/uiStore';
import { MODULE_MIN_SIZES } from '@/lib/constants/modules';
import type {
  DragPreviewState,
  Module,
  ModuleLayout,
  ResizeHandle,
  ResizeSession,
  UpdateModuleLayoutInput,
} from '@/lib/types';
import type { PageSize } from '@/lib/types/common';
import { pixelsToGridUnits } from '@/features/notebooks/utils/grid-layout';
import {
  validateLayout,
  type LayoutValidationCode,
} from '@/features/notebooks/utils/layout-validation';

interface UseCanvasInteractionsArgs {
  pageSize?: PageSize;
  modules?: readonly Module[];
  zoom?: number;
  onCommitLayout?: (
    moduleId: string,
    layout: UpdateModuleLayoutInput,
  ) => void;
  onInvalidLayout?: (
    code: LayoutValidationCode,
    moduleId: string,
  ) => void;
}

/**
 * Turn a module record into the `ModuleLayout` shape used for drag/resize
 * preview state. Copies only the five layout fields so mutations never
 * accidentally leak content or metadata through the preview pipeline.
 */
function moduleToLayout(module: Module): ModuleLayout {
  return {
    gridX: module.gridX,
    gridY: module.gridY,
    gridWidth: module.gridWidth,
    gridHeight: module.gridHeight,
    zIndex: module.zIndex,
  };
}

/**
 * Apply a resize handle's pointer delta (already snapped to grid units)
 * to a starting layout and return the resulting layout. `n*`/`w*` handles
 * shift the origin and adjust the matching dimension, so the module grows
 * toward the pointer rather than away from it.
 */
export function applyResizeDelta(
  start: ModuleLayout,
  handle: ResizeHandle,
  dxUnits: number,
  dyUnits: number,
): ModuleLayout {
  let gridX = start.gridX;
  let gridY = start.gridY;
  let gridWidth = start.gridWidth;
  let gridHeight = start.gridHeight;

  if (handle.includes('e')) {
    gridWidth = start.gridWidth + dxUnits;
  }
  if (handle.includes('w')) {
    gridX = start.gridX + dxUnits;
    gridWidth = start.gridWidth - dxUnits;
  }
  if (handle.includes('s')) {
    gridHeight = start.gridHeight + dyUnits;
  }
  if (handle.includes('n')) {
    gridY = start.gridY + dyUnits;
    gridHeight = start.gridHeight - dyUnits;
  }

  return {
    gridX,
    gridY,
    gridWidth,
    gridHeight,
    zIndex: start.zIndex,
  };
}

/**
 * Shared selection, drag, and resize state for the lesson-page canvas.
 *
 * Phase 3 (User Story 1) scope: selection / deselection only.
 * Phase 4 (User Story 2) scope adds:
 *   - snapped drag session state (dnd-kit driven)
 *   - snapped pointer-driven resize session state
 *   - conflict + bounds validation through `validateLayout`
 *   - an `isInteracting` flag so later phases can suppress zoom changes
 *     while a drag or resize is in progress.
 */
export function useCanvasInteractions(
  args: UseCanvasInteractionsArgs = {},
) {
  const { pageSize, modules, zoom = 1, onCommitLayout, onInvalidLayout } =
    args;
  const selectedModuleId = useUIStore((state) => state.selectedModuleId);
  const setSelectedModuleId = useUIStore(
    (state) => state.setSelectedModuleId,
  );
  const clearSelectedModule = useUIStore(
    (state) => state.clearSelectedModule,
  );

  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(
    null,
  );
  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(
    null,
  );

  /**
   * Latest drag/resize/module inputs mirrored into refs so window-level
   * pointer listeners installed during a resize session always see the
   * current zoom, modules, and validation context without re-binding.
   */
  const contextRef = useRef({
    modules: modules ?? [],
    pageSize,
    zoom,
  });
  useEffect(() => {
    contextRef.current = {
      modules: modules ?? [],
      pageSize,
      zoom,
    };
  }, [modules, pageSize, zoom]);

  const selectModule = useCallback(
    (moduleId: string) => {
      setSelectedModuleId(moduleId);
    },
    [setSelectedModuleId],
  );

  /**
   * Clicking the lesson-page canvas surface (not a module) clears the
   * current selection. Event delegation: we only deselect when the
   * pointer target is the surface element itself, so clicks that bubble
   * up from a child module card (which stops propagation) are ignored.
   */
  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) {
        clearSelectedModule();
      }
    },
    [clearSelectedModule],
  );

  /**
   * Build a candidate layout from a starting layout, a delta, and (for
   * resize) a handle. Runs the shared validation pipeline and returns
   * the final preview state including any conflicting sibling.
   */
  const buildPreview = useCallback(
    (
      moduleId: string,
      moduleType: Module['moduleType'],
      startLayout: ModuleLayout,
      candidate: ModuleLayout,
    ): {
      layout: ModuleLayout;
      isValid: boolean;
      conflictingModuleId: string | null;
      code: LayoutValidationCode | null;
    } => {
      if (!pageSize) {
        return {
          layout: candidate,
          isValid: false,
          conflictingModuleId: null,
          code: null,
        };
      }
      const modulesForValidation = contextRef.current.modules;
      const result = validateLayout({
        layout: candidate,
        moduleType,
        pageSize,
        allModules: modulesForValidation,
        excludeId: moduleId,
      });
      return {
        layout: candidate,
        isValid: result.isValid,
        conflictingModuleId: result.conflictingModule?.id ?? null,
        code: result.code,
      };
    },
    [pageSize],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const moduleId = String(event.active.id);
      const current = (modules ?? []).find((m) => m.id === moduleId);
      if (!current) return;
      const origin = moduleToLayout(current);
      setDragPreview({
        activeModuleId: moduleId,
        originLayout: origin,
        previewLayout: origin,
        conflictingModuleId: null,
        isValid: true,
      });
    },
    [modules],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const moduleId = String(event.active.id);
      const current = (modules ?? []).find((m) => m.id === moduleId);
      if (!current) return;
      const dxUnits = pixelsToGridUnits(event.delta.x, zoom);
      const dyUnits = pixelsToGridUnits(event.delta.y, zoom);
      const start: ModuleLayout = moduleToLayout(current);
      const candidate: ModuleLayout = {
        ...start,
        gridX: start.gridX + dxUnits,
        gridY: start.gridY + dyUnits,
      };
      const next = buildPreview(
        moduleId,
        current.moduleType,
        start,
        candidate,
      );
      setDragPreview({
        activeModuleId: moduleId,
        originLayout: start,
        previewLayout: next.layout,
        conflictingModuleId: next.conflictingModuleId,
        isValid: next.isValid,
      });
    },
    [buildPreview, modules, zoom],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const moduleId = String(event.active.id);
      const current = (modules ?? []).find((m) => m.id === moduleId);
      if (!current) {
        setDragPreview(null);
        return;
      }
      const dxUnits = pixelsToGridUnits(event.delta.x, zoom);
      const dyUnits = pixelsToGridUnits(event.delta.y, zoom);
      const start = moduleToLayout(current);
      const candidate: ModuleLayout = {
        ...start,
        gridX: start.gridX + dxUnits,
        gridY: start.gridY + dyUnits,
      };
      const result = buildPreview(
        moduleId,
        current.moduleType,
        start,
        candidate,
      );
      if (
        result.isValid &&
        (candidate.gridX !== start.gridX ||
          candidate.gridY !== start.gridY)
      ) {
        onCommitLayout?.(moduleId, {
          gridX: result.layout.gridX,
          gridY: result.layout.gridY,
          gridWidth: result.layout.gridWidth,
          gridHeight: result.layout.gridHeight,
          zIndex: result.layout.zIndex,
        });
      } else if (!result.isValid && result.code) {
        onInvalidLayout?.(result.code, moduleId);
      }
      setDragPreview(null);
    },
    [buildPreview, modules, onCommitLayout, onInvalidLayout, zoom],
  );

  const handleDragCancel = useCallback(() => {
    setDragPreview(null);
  }, []);

  /**
   * Begin a pointer-driven resize session. Captures the current pointer
   * position and layout, then installs window-level pointer listeners so
   * the drag continues even when the pointer leaves the handle element.
   */
  const beginResize = useCallback(
    (
      moduleId: string,
      handle: ResizeHandle,
      event: React.PointerEvent<Element>,
    ) => {
      event.stopPropagation();
      event.preventDefault();
      const current = (modules ?? []).find((m) => m.id === moduleId);
      if (!current) return;
      const startLayout = moduleToLayout(current);
      const startPointerX = event.clientX;
      const startPointerY = event.clientY;
      const moduleType = current.moduleType;
      const minSize = MODULE_MIN_SIZES[moduleType];

      setResizeSession({
        moduleId,
        handle,
        startPointerX,
        startPointerY,
        startLayout,
        previewLayout: startLayout,
        conflictingModuleId: null,
      });

      function computeCandidate(pointerX: number, pointerY: number) {
        const { zoom: currentZoom } = contextRef.current;
        const dxUnits = pixelsToGridUnits(
          pointerX - startPointerX,
          currentZoom,
        );
        const dyUnits = pixelsToGridUnits(
          pointerY - startPointerY,
          currentZoom,
        );
        let candidate = applyResizeDelta(
          startLayout,
          handle,
          dxUnits,
          dyUnits,
        );
        // Enforce minimum sizes at the math level so the preview never
        // collapses below `MODULE_MIN_SIZES`. We keep the origin pinned
        // when an `n`/`w` handle would otherwise push past the minimum.
        if (candidate.gridWidth < minSize.minWidth) {
          if (handle.includes('w')) {
            candidate = {
              ...candidate,
              gridX:
                startLayout.gridX + startLayout.gridWidth - minSize.minWidth,
            };
          }
          candidate = { ...candidate, gridWidth: minSize.minWidth };
        }
        if (candidate.gridHeight < minSize.minHeight) {
          if (handle.includes('n')) {
            candidate = {
              ...candidate,
              gridY:
                startLayout.gridY + startLayout.gridHeight - minSize.minHeight,
            };
          }
          candidate = { ...candidate, gridHeight: minSize.minHeight };
        }
        return candidate;
      }

      function onPointerMove(nativeEvent: PointerEvent) {
        const candidate = computeCandidate(
          nativeEvent.clientX,
          nativeEvent.clientY,
        );
        const preview = buildPreview(
          moduleId,
          moduleType,
          startLayout,
          candidate,
        );
        setResizeSession((current) =>
          current
            ? {
                ...current,
                previewLayout: preview.layout,
                conflictingModuleId: preview.conflictingModuleId,
              }
            : current,
        );
      }

      function onPointerUp(nativeEvent: PointerEvent) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        const candidate = computeCandidate(
          nativeEvent.clientX,
          nativeEvent.clientY,
        );
        const preview = buildPreview(
          moduleId,
          moduleType,
          startLayout,
          candidate,
        );
        const changed =
          preview.layout.gridX !== startLayout.gridX ||
          preview.layout.gridY !== startLayout.gridY ||
          preview.layout.gridWidth !== startLayout.gridWidth ||
          preview.layout.gridHeight !== startLayout.gridHeight;
        if (preview.isValid && changed) {
          onCommitLayout?.(moduleId, {
            gridX: preview.layout.gridX,
            gridY: preview.layout.gridY,
            gridWidth: preview.layout.gridWidth,
            gridHeight: preview.layout.gridHeight,
            zIndex: preview.layout.zIndex,
          });
        } else if (!preview.isValid && preview.code) {
          onInvalidLayout?.(preview.code, moduleId);
        }
        setResizeSession(null);
      }

      function onPointerCancel() {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        setResizeSession(null);
      }

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    },
    [buildPreview, modules, onCommitLayout, onInvalidLayout],
  );

  const isInteracting = dragPreview !== null || resizeSession !== null;

  /**
   * Id of the sibling currently being highlighted as the overlap target
   * during an in-progress drag or resize preview. `null` when the
   * pointer is not over a conflicting position.
   */
  const conflictingModuleId = useMemo(
    () =>
      dragPreview?.conflictingModuleId ??
      resizeSession?.conflictingModuleId ??
      null,
    [dragPreview, resizeSession],
  );

  return {
    selectedModuleId,
    selectModule,
    clearSelection: clearSelectedModule,
    handleCanvasPointerDown,
    dragPreview,
    resizeSession,
    isInteracting,
    conflictingModuleId,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    beginResize,
  };
}
