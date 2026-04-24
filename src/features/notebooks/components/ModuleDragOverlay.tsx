import { memo } from 'react';
import type { ModuleLayout, NotebookModuleStyle } from '@/lib/types';
import {
  GRID_CANVAS_STYLE_TOKENS,
  GRID_ZOOM_DEFAULT,
} from '@/lib/constants/grid';
import { gridUnitsToPixels } from '@/features/notebooks/utils/grid-layout';

interface ModuleDragOverlayProps {
  /**
   * Snapped candidate layout to visualize as the drag ghost. Width and
   * height come from the module being dragged; gridX/gridY come from the
   * live pointer-driven preview.
   */
  layout: Pick<
    ModuleLayout,
    'gridX' | 'gridY' | 'gridWidth' | 'gridHeight'
  >;
  /**
   * Optional resolved style so the ghost visually matches the original
   * module's background and border.
   */
  style?: NotebookModuleStyle;
  zoom?: number;
  /**
   * When false, the overlay uses the muted terracotta conflict tint so
   * the user sees invalid placement at a glance.
   */
  isValid?: boolean;
}

/**
 * Semi-transparent snapped drag ghost rendered by dnd-kit's `DragOverlay`
 * during an active module drag. Kept presentational and memoized so the
 * overlay does not cascade rerenders to the module list while the user
 * moves the pointer.
 */
export const ModuleDragOverlay = memo(function ModuleDragOverlay({
  layout,
  style,
  zoom = GRID_ZOOM_DEFAULT,
  isValid = true,
}: ModuleDragOverlayProps) {
  const width = gridUnitsToPixels(layout.gridWidth, zoom);
  const height = gridUnitsToPixels(layout.gridHeight, zoom);
  const background = isValid
    ? style?.backgroundColor ?? 'var(--notebook-paper, #fff)'
    : GRID_CANVAS_STYLE_TOKENS.conflict;
  const border = isValid
    ? `2px solid ${GRID_CANVAS_STYLE_TOKENS.selection}`
    : `2px solid ${GRID_CANVAS_STYLE_TOKENS.conflict}`;
  return (
    <div
      data-testid="module-drag-overlay"
      data-valid={isValid ? 'true' : 'false'}
      aria-hidden="true"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background,
        border,
        borderRadius: '4px',
        opacity: 0.6,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
});
