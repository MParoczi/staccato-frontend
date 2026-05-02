import type { Modifier } from '@dnd-kit/core';
import { GRID_BASE_UNIT_PX } from '@/lib/constants/grid';

/**
 * Build a dnd-kit `Modifier` that snaps the drag transform to whole
 * grid-unit increments at the current canvas zoom.
 *
 * Background — without this, `<DragOverlay>` positions the drag ghost at
 * pixel-accurate cursor delta while `useCanvasInteractions` rounds the
 * same delta to whole grid units (`pixelsToGridUnits`) for the validity
 * check and commit. The two diverge by up to half a grid unit on each
 * axis, which produces the "ghost looks valid where it shouldn't / looks
 * invalid where it should be valid" inversion users see when the cursor
 * is near a snap boundary or the page edge.
 *
 * Snapping the visual transform with the same `Math.round` rule used by
 * `pixelsToGridUnits` keeps the ghost locked to the snap target so
 * visuals and validity always agree.
 */
export function createSnapToGridModifier(zoom: number): Modifier {
  const gridSizePx = GRID_BASE_UNIT_PX * zoom;
  return ({ transform }) => {
    if (gridSizePx <= 0) {
      return transform;
    }
    return {
      ...transform,
      x: Math.round(transform.x / gridSizePx) * gridSizePx,
      y: Math.round(transform.y / gridSizePx) * gridSizePx,
    };
  };
}

