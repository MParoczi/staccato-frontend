import { useCallback, useMemo } from 'react';
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
