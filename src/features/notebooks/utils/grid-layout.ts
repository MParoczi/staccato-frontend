import {
  GRID_BASE_UNIT_PX,
  GRID_ZOOM_DEFAULT,
  GRID_ZOOM_MAX,
  GRID_ZOOM_MIN,
  GRID_ZOOM_STEP,
  PAGE_SIZE_DIMENSIONS,
} from '@/lib/constants/grid';
import type { ModuleLayout } from '@/lib/types';
import type { PageSize } from '@/lib/types/common';

/**
 * Convert a number of grid units into pixels at the given zoom level.
 *
 * The canvas always renders through this helper so dot spacing, page
 * dimensions, module frames, overlay coordinates, and resize delta math
 * stay consistent across zoom levels.
 */
export function gridUnitsToPixels(units: number, zoom: number): number {
  return units * GRID_BASE_UNIT_PX * zoom;
}

/**
 * Convert a pixel value into snapped whole grid units. Implements
 * `Math.round(px / gridUnitsToPixels(1, zoom))` from the spec so drag and
 * resize math always lands on the integer grid.
 */
export function pixelsToGridUnits(px: number, zoom: number): number {
  const unitInPixels = gridUnitsToPixels(1, zoom);
  if (unitInPixels === 0) {
    return 0;
  }
  return Math.round(px / unitInPixels);
}

/**
 * Clamp an arbitrary zoom value to the supported 50%-200% range, snapping to
 * the configured 10% step. Mirrors the store-side clamper so call sites that
 * derive zoom from wheel deltas do not have to depend on the store directly.
 */
export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return GRID_ZOOM_DEFAULT;
  }
  const stepped = Math.round(zoom / GRID_ZOOM_STEP) * GRID_ZOOM_STEP;
  const clamped = Math.min(GRID_ZOOM_MAX, Math.max(GRID_ZOOM_MIN, stepped));
  return Math.round(clamped * 100) / 100;
}

/**
 * Get the page width and height in grid units for the given page size.
 */
export function getPageGridDimensions(pageSize: PageSize): {
  width: number;
  height: number;
} {
  return PAGE_SIZE_DIMENSIONS[pageSize];
}

/**
 * Get the page width and height in pixels at the given zoom level.
 */
export function getPagePixelDimensions(
  pageSize: PageSize,
  zoom: number,
): { width: number; height: number } {
  const dims = getPageGridDimensions(pageSize);
  return {
    width: gridUnitsToPixels(dims.width, zoom),
    height: gridUnitsToPixels(dims.height, zoom),
  };
}

/**
 * Returns true when the candidate layout sits fully within the page bounds.
 * Edge contact (e.g. `gridX + gridWidth === pageWidth`) is valid; any
 * overflow is rejected.
 */
export function isWithinPageBounds(
  layout: Pick<ModuleLayout, 'gridX' | 'gridY' | 'gridWidth' | 'gridHeight'>,
  pageSize: PageSize,
): boolean {
  if (layout.gridX < 0 || layout.gridY < 0) {
    return false;
  }
  if (layout.gridWidth <= 0 || layout.gridHeight <= 0) {
    return false;
  }
  const { width, height } = getPageGridDimensions(pageSize);
  return (
    layout.gridX + layout.gridWidth <= width &&
    layout.gridY + layout.gridHeight <= height
  );
}
