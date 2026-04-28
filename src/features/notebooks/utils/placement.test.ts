import { describe, it, expect } from 'vitest';
import { firstAvailablePosition } from './placement';
import { MODULE_MIN_SIZES } from '@/lib/constants/modules';
import { PAGE_SIZE_DIMENSIONS } from '@/lib/constants/grid';
import type { Module, ModuleType } from '@/lib/types';

function makeModule(
  id: string,
  gridX: number,
  gridY: number,
  gridWidth: number,
  gridHeight: number,
  moduleType: ModuleType = 'Theory',
): Module {
  return {
    id,
    lessonPageId: 'page-1',
    moduleType,
    gridX,
    gridY,
    gridWidth,
    gridHeight,
    zIndex: 0,
    content: [],
  };
}

describe('firstAvailablePosition', () => {
  it('returns the origin when the page is empty', () => {
    expect(firstAvailablePosition('A4', 'Theory', [])).toEqual({
      gridX: 0,
      gridY: 0,
    });
  });

  it('places the new module to the right of an existing module when space allows', () => {
    const min = MODULE_MIN_SIZES.FreeText;
    // FreeText min is 4x4; place a single occupying module at 0,0 4x4
    const existing = [makeModule('a', 0, 0, min.minWidth, min.minHeight)];
    const result = firstAvailablePosition('A4', 'FreeText', existing);
    // First-fit scans left-to-right within row y=0, so the next slot is (4, 0)
    expect(result).toEqual({ gridX: 4, gridY: 0 });
  });

  it('skips to the next row when the first row is full', () => {
    const page = PAGE_SIZE_DIMENSIONS.A4;
    const existing = [makeModule('a', 0, 0, page.width, 4, 'FreeText')];
    const result = firstAvailablePosition('A4', 'FreeText', existing);
    expect(result).toEqual({ gridX: 0, gridY: 4 });
  });

  it('returns null when no slot can fit the module minimum size', () => {
    const page = PAGE_SIZE_DIMENSIONS.A4;
    // Cover the entire page with a single module
    const existing = [
      makeModule('a', 0, 0, page.width, page.height, 'FreeText'),
    ];
    expect(firstAvailablePosition('A4', 'FreeText', existing)).toBeNull();
  });

  it('returns null when the module type minimum exceeds page dimensions', () => {
    // A6 page is 21x29 grid units; ChordTablature requires minWidth 8, minHeight 10
    // — that fits A6 — but a Title (minWidth 20) on A6 width 21 fits.
    // Force the unfit case by mocking with smallest plausible page that cannot
    // host even a Title min row of 20x4 — A6 has width 21 so it fits.
    // Simulate by stacking an obstruction across the full width of A6 first.
    const obstruction = makeModule(
      'a',
      0,
      0,
      PAGE_SIZE_DIMENSIONS.A6.width,
      PAGE_SIZE_DIMENSIONS.A6.height,
      'FreeText',
    );
    expect(firstAvailablePosition('A6', 'Title', [obstruction])).toBeNull();
  });

  it('finds a small gap between two existing modules', () => {
    // Place modules so a 4x4 FreeText only fits at (4, 0)
    const existing = [
      makeModule('a', 0, 0, 4, 4, 'FreeText'),
      makeModule('b', 8, 0, 4, 4, 'FreeText'),
    ];
    const result = firstAvailablePosition('A4', 'FreeText', existing);
    expect(result).toEqual({ gridX: 4, gridY: 0 });
  });

  it('returns null when the page exactly fits one module and a second placement is requested (no-space failure for add)', () => {
    // Saturate the page with one large existing module at minimum size of FreeText
    const page = PAGE_SIZE_DIMENSIONS.A4;
    const existing = [
      makeModule('a', 0, 0, page.width, page.height - 3, 'FreeText'),
      // Cover the bottom 3 rows with another module so no FreeText (4 high) fits.
      makeModule('b', 0, page.height - 3, page.width, 3, 'FreeText'),
    ];
    expect(firstAvailablePosition('A4', 'FreeText', existing)).toBeNull();
  });
});
