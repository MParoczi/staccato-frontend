import { MODULE_MIN_SIZES } from '@/lib/constants/modules';
import { PAGE_SIZE_DIMENSIONS } from '@/lib/constants/grid';
import type { Module, ModuleType } from '@/lib/types';
import type { PageSize } from '@/lib/types/common';
import { checkOverlap } from './overlap';

/**
 * Scan the page top-to-bottom, left-to-right and return the first grid slot
 * where a new module of the given type can be placed at its minimum size
 * without going out of bounds or overlapping an existing module.
 *
 * Returns `null` when no slot is available, which the caller surfaces as a
 * localized "no space" error rather than dispatching a request that would
 * be rejected by the backend.
 */
export function firstAvailablePosition(
  pageSize: PageSize,
  moduleType: ModuleType,
  allModules: readonly Module[],
): { gridX: number; gridY: number } | null {
  const page = PAGE_SIZE_DIMENSIONS[pageSize];
  const minSize = MODULE_MIN_SIZES[moduleType];

  if (
    minSize.minWidth > page.width ||
    minSize.minHeight > page.height
  ) {
    return null;
  }

  const maxX = page.width - minSize.minWidth;
  const maxY = page.height - minSize.minHeight;

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      const candidate = {
        gridX: x,
        gridY: y,
        gridWidth: minSize.minWidth,
        gridHeight: minSize.minHeight,
      };
      if (checkOverlap(candidate, allModules) === null) {
        return { gridX: x, gridY: y };
      }
    }
  }

  return null;
}
