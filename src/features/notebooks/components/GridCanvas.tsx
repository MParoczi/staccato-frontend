import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  Module,
  ModuleType,
  NotebookModuleStyle,
  UpdateModuleLayoutInput,
} from '@/lib/types';
import type { PageSize } from '@/lib/types/common';
import { DottedPaper } from '@/components/common/DottedPaper';
import { useUIStore } from '@/stores/uiStore';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { useCanvasZoomShortcuts } from '../hooks/useCanvasZoomShortcuts';
import { createSnapToGridModifier } from '../utils/snap-to-grid-modifier';
import { ModuleCard } from './ModuleCard';
import { ModuleDragOverlay } from './ModuleDragOverlay';

interface GridCanvasProps {
  pageSize: PageSize;
  modules: readonly Module[];
  styles?: readonly NotebookModuleStyle[];
  className?: string;
  /**
   * Called when a drag or resize release produces a valid snapped
   * layout. Owners typically wire this to `useModuleLayoutMutations`'
   * debounced `scheduleLayoutUpdate` so the PATCH fires 500 ms later.
   */
  onCommitLayout?: (
    moduleId: string,
    layout: UpdateModuleLayoutInput,
  ) => void;
}

function buildStylesByType(
  styles: readonly NotebookModuleStyle[] | undefined,
): Partial<Record<ModuleType, NotebookModuleStyle>> {
  if (!styles) return {};
  const map: Partial<Record<ModuleType, NotebookModuleStyle>> = {};
  for (const style of styles) {
    map[style.moduleType] = style;
  }
  return map;
}

/**
 * Positioned canvas surface for the active lesson page.
 *
 * Phase 3 (User Story 1) scope: render the true-sized dotted-paper
 * surface, stack saved modules using their z-index, wire selection via
 * `ModuleCard`, and clear selection on empty-canvas clicks.
 *
 * Phase 4 (User Story 2) wires dnd-kit header dragging, the snapped
 * `DragOverlay` preview, conflict highlighting, bounds/overlap rejection
 * with toast feedback, and optimistic commit via the `onCommitLayout`
 * callback provided by the route container.
 */
export function GridCanvas({
  pageSize,
  modules,
  styles,
  className,
  onCommitLayout,
}: GridCanvasProps) {
  const { t } = useTranslation();
  const zoom = useUIStore((state) => state.zoom);
  const zoomIn = useUIStore((state) => state.zoomIn);
  const zoomOut = useUIStore((state) => state.zoomOut);

  /**
   * Handle an invalid drag or resize release. Per the feature's
   * toast-only feedback clarification, every invalid result surfaces the
   * same localized toast regardless of the specific validation code.
   */
  const handleInvalidLayout = useCallback(() => {
    toast.error(t('notebooks.canvas.toasts.layoutInvalid'));
  }, [t]);

  const {
    selectedModuleId,
    selectModule,
    handleCanvasPointerDown,
    dragPreview,
    isInteracting,
    conflictingModuleId,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    beginResize,
  } = useCanvasInteractions({
    pageSize,
    modules,
    zoom,
    onCommitLayout,
    onInvalidLayout: handleInvalidLayout,
  });

  // Disable keyboard zoom shortcuts during an active drag/resize so a
  // mid-gesture key combo cannot mutate the scale and corrupt the
  // pointer-relative math the interaction is using.
  useCanvasZoomShortcuts({ disabled: isInteracting });

  /**
   * Require the pointer to move a few pixels before a drag activates so
   * clicks on a selected module's header still register as selection
   * toggles instead of zero-distance drags.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  /**
   * Snap the drag overlay's visual transform to whole grid units at the
   * current zoom so the ghost cannot drift past a snap boundary while
   * `useCanvasInteractions` is still validating the previous cell. Without
   * this, the pixel-accurate dnd-kit transform and the
   * `pixelsToGridUnits`-rounded preview layout diverge by up to half a
   * grid unit, which surfaces as a ghost rendered in the "wrong" cell vs.
   * its validity color (bug 2026-05-02).
   */
  const dragModifiers = useMemo(
    () => [createSnapToGridModifier(zoom)],
    [zoom],
  );

  const stylesByType = useMemo(
    () => buildStylesByType(styles),
    [styles],
  );

  /**
   * Sort a copy of the modules by z-index ascending so DOM order matches
   * visual stacking order (lowest z-index painted first). Ties break by
   * id to keep the render order stable across rerenders.
   */
  const orderedModules = useMemo(
    () =>
      [...modules].sort((a, b) => {
        if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
        return a.id.localeCompare(b.id);
      }),
    [modules],
  );

  const activeModule = useMemo(() => {
    if (!dragPreview) return null;
    return modules.find((m) => m.id === dragPreview.activeModuleId) ?? null;
  }, [dragPreview, modules]);

  const handleResizeHandlePointerDown = useCallback(
    (
      moduleId: string,
      handle: Parameters<typeof beginResize>[1],
      event: React.PointerEvent<HTMLSpanElement>,
    ) => {
      beginResize(moduleId, handle, event);
    },
    [beginResize],
  );

  /**
   * Attach a non-passive `wheel` listener to the canvas viewport so we
   * can intercept `Ctrl+wheel` for zoom changes without disabling the
   * browser's native plain-wheel scroll. React's synthetic wheel
   * handlers are passive by default, which prevents `preventDefault()`
   * from suppressing the page-level zoom gesture.
   */
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    function onWheel(event: WheelEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        // Plain wheel: defer to the viewport's native vertical scroll.
        return;
      }
      // Ctrl+wheel: stop the browser's page-zoom default in every case
      // so the canvas reliably owns the gesture.
      event.preventDefault();
      if (isInteracting) return;
      if (event.deltaY < 0) {
        zoomIn();
      } else if (event.deltaY > 0) {
        zoomOut();
      }
    }
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [isInteracting, zoomIn, zoomOut]);

  return (
    <DndContext
      sensors={sensors}
      modifiers={dragModifiers}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={viewportRef}
        data-testid="grid-canvas-viewport"
        aria-label={t('notebooks.canvas.surfaceLabel')}
        className="max-h-[calc(100vh-12rem)] overflow-y-auto"
      >
        <DottedPaper
          pageSize={pageSize}
          zoom={zoom}
          className={className}
        >
          <div
            data-testid="grid-canvas-surface"
            role="presentation"
            aria-label={t('notebooks.canvas.surfaceLabel')}
            onPointerDown={handleCanvasPointerDown}
            className="absolute inset-0"
          >
            {orderedModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                style={stylesByType[module.moduleType]}
                zoom={zoom}
                isSelected={selectedModuleId === module.id}
                isConflicting={conflictingModuleId === module.id}
                onSelect={selectModule}
                onHandlePointerDown={handleResizeHandlePointerDown}
              />
            ))}
          </div>
        </DottedPaper>
      </div>
      <DragOverlay dropAnimation={null}>
        {dragPreview && activeModule ? (
          <ModuleDragOverlay
            layout={dragPreview.previewLayout}
            style={stylesByType[activeModule.moduleType]}
            zoom={zoom}
            isValid={dragPreview.isValid}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
