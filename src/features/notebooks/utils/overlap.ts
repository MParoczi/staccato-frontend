import type { Module } from '@/lib/types';

type RectLike = Pick<
  Module,
  'gridX' | 'gridY' | 'gridWidth' | 'gridHeight'
> & { id?: string };

/**
 * Returns true when two axis-aligned rectangles overlap on the grid.
 *
 * Edge or corner contact is treated as a valid placement: rectangles only
 * overlap when their interiors intersect. This matches the canvas spec
 * (FR-007 / FR-008) where touching edges are allowed but any intersection
 * is rejected.
 */
export function rectanglesOverlap(a: RectLike, b: RectLike): boolean {
  const aRight = a.gridX + a.gridWidth;
  const aBottom = a.gridY + a.gridHeight;
  const bRight = b.gridX + b.gridWidth;
  const bBottom = b.gridY + b.gridHeight;

  if (aRight <= b.gridX || bRight <= a.gridX) {
    return false;
  }
  if (aBottom <= b.gridY || bBottom <= a.gridY) {
    return false;
  }
  return true;
}

/**
 * Find the first sibling module that overlaps the moving rectangle, or
 * `null` when the placement is conflict-free.
 *
 * The moving module is excluded from the scan automatically when it carries
 * an `id` matching a sibling. An explicit `excludeId` overrides that match
 * for cases where the candidate is constructed without the original id
 * (e.g. when validating a creation payload that copies a real module's id
 * by mistake).
 */
export function checkOverlap(
  movingModule: RectLike & Pick<Partial<Module>, 'id'>,
  allModules: readonly Module[],
  excludeId?: string,
): Module | null {
  const skipId = excludeId ?? movingModule.id;
  for (const candidate of allModules) {
    if (skipId !== undefined && candidate.id === skipId) {
      continue;
    }
    if (rectanglesOverlap(movingModule, candidate)) {
      return candidate;
    }
  }
  return null;
}
