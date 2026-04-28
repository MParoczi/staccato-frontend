import { describe, it, expect } from 'vitest';
import {
  clampZoom,
  getPageGridDimensions,
  getPagePixelDimensions,
  gridUnitsToPixels,
  isWithinPageBounds,
  pixelsToGridUnits,
} from './grid-layout';
import {
  GRID_BASE_UNIT_PX,
  GRID_ZOOM_DEFAULT,
  GRID_ZOOM_MAX,
  GRID_ZOOM_MIN,
} from '@/lib/constants/grid';

describe('gridUnitsToPixels', () => {
  it('returns base pixels per unit at zoom 1', () => {
    expect(gridUnitsToPixels(1, 1)).toBe(GRID_BASE_UNIT_PX);
    expect(gridUnitsToPixels(5, 1)).toBe(5 * GRID_BASE_UNIT_PX);
  });

  it('scales with zoom factor', () => {
    expect(gridUnitsToPixels(1, 0.5)).toBe(GRID_BASE_UNIT_PX * 0.5);
    expect(gridUnitsToPixels(2, 2)).toBe(2 * GRID_BASE_UNIT_PX * 2);
  });

  it('returns 0 for 0 units', () => {
    expect(gridUnitsToPixels(0, 1.5)).toBe(0);
  });
});

describe('pixelsToGridUnits', () => {
  it('rounds to the nearest whole grid unit', () => {
    const oneUnit = gridUnitsToPixels(1, 1);
    expect(pixelsToGridUnits(oneUnit, 1)).toBe(1);
    expect(pixelsToGridUnits(oneUnit * 2.4, 1)).toBe(2);
    expect(pixelsToGridUnits(oneUnit * 2.6, 1)).toBe(3);
  });

  it('rounds correctly across zoom levels', () => {
    const oneUnitAt2x = gridUnitsToPixels(1, 2);
    expect(pixelsToGridUnits(oneUnitAt2x, 2)).toBe(1);
    expect(pixelsToGridUnits(oneUnitAt2x * 5, 2)).toBe(5);

    const oneUnitAtHalf = gridUnitsToPixels(1, 0.5);
    expect(pixelsToGridUnits(oneUnitAtHalf, 0.5)).toBe(1);
  });

  it('returns 0 when zoom yields no pixel size', () => {
    expect(pixelsToGridUnits(50, 0)).toBe(0);
  });

  it('round-trips snapped pixel values back to whole units', () => {
    const fivePx = gridUnitsToPixels(5, 1.4);
    expect(pixelsToGridUnits(fivePx, 1.4)).toBe(5);
  });
});

describe('clampZoom', () => {
  it('returns default for non-finite values', () => {
    expect(clampZoom(Number.NaN)).toBe(GRID_ZOOM_DEFAULT);
  });

  it('clamps below min and above max', () => {
    expect(clampZoom(0.1)).toBe(GRID_ZOOM_MIN);
    expect(clampZoom(5)).toBe(GRID_ZOOM_MAX);
  });

  it('snaps values to the 10% step', () => {
    expect(clampZoom(1.04)).toBe(1);
    expect(clampZoom(1.06)).toBe(1.1);
  });
});

describe('getPageGridDimensions', () => {
  it('returns the dimensions for A4', () => {
    expect(getPageGridDimensions('A4')).toEqual({ width: 42, height: 59 });
  });
});

describe('getPagePixelDimensions', () => {
  it('multiplies grid dimensions by base pixel size and zoom', () => {
    expect(getPagePixelDimensions('A4', 1)).toEqual({
      width: 42 * GRID_BASE_UNIT_PX,
      height: 59 * GRID_BASE_UNIT_PX,
    });
    expect(getPagePixelDimensions('A4', 0.5)).toEqual({
      width: 42 * GRID_BASE_UNIT_PX * 0.5,
      height: 59 * GRID_BASE_UNIT_PX * 0.5,
    });
  });
});

describe('isWithinPageBounds', () => {
  const a4 = 'A4' as const;

  it('accepts a layout fully inside the page', () => {
    expect(
      isWithinPageBounds(
        { gridX: 0, gridY: 0, gridWidth: 10, gridHeight: 10 },
        a4,
      ),
    ).toBe(true);
  });

  it('accepts edge contact at the right and bottom edges', () => {
    expect(
      isWithinPageBounds(
        { gridX: 32, gridY: 49, gridWidth: 10, gridHeight: 10 },
        a4,
      ),
    ).toBe(true);
  });

  it('rejects negative origin coordinates', () => {
    expect(
      isWithinPageBounds(
        { gridX: -1, gridY: 0, gridWidth: 10, gridHeight: 10 },
        a4,
      ),
    ).toBe(false);
    expect(
      isWithinPageBounds(
        { gridX: 0, gridY: -1, gridWidth: 10, gridHeight: 10 },
        a4,
      ),
    ).toBe(false);
  });

  it('rejects zero or negative dimensions', () => {
    expect(
      isWithinPageBounds(
        { gridX: 0, gridY: 0, gridWidth: 0, gridHeight: 5 },
        a4,
      ),
    ).toBe(false);
    expect(
      isWithinPageBounds(
        { gridX: 0, gridY: 0, gridWidth: 5, gridHeight: -1 },
        a4,
      ),
    ).toBe(false);
  });

  it('rejects layouts that extend past the page', () => {
    expect(
      isWithinPageBounds(
        { gridX: 33, gridY: 0, gridWidth: 10, gridHeight: 10 },
        a4,
      ),
    ).toBe(false);
    expect(
      isWithinPageBounds(
        { gridX: 0, gridY: 50, gridWidth: 10, gridHeight: 10 },
        a4,
      ),
    ).toBe(false);
  });
});
