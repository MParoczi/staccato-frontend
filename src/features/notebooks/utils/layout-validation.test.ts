import { describe, it, expect } from 'vitest';
import { meetsMinimumSize, validateLayout } from './layout-validation';
import type { Module } from '@/lib/types';

function makeModule(
  id: string,
  gridX: number,
  gridY: number,
  gridWidth: number,
  gridHeight: number,
): Module {
  return {
    id,
    lessonPageId: 'page-1',
    moduleType: 'Theory',
    gridX,
    gridY,
    gridWidth,
    gridHeight,
    zIndex: 0,
    content: [],
  };
}

describe('meetsMinimumSize', () => {
  it('returns true for the documented minimum size', () => {
    expect(
      meetsMinimumSize({ gridWidth: 8, gridHeight: 5 }, 'Theory'),
    ).toBe(true);
  });

  it('returns false when the width is below the minimum', () => {
    expect(
      meetsMinimumSize({ gridWidth: 7, gridHeight: 5 }, 'Theory'),
    ).toBe(false);
  });

  it('returns false when the height is below the minimum', () => {
    expect(
      meetsMinimumSize({ gridWidth: 8, gridHeight: 4 }, 'Theory'),
    ).toBe(false);
  });
});

describe('validateLayout', () => {
  it('returns a valid result for an in-bounds, sized, non-overlapping layout', () => {
    const result = validateLayout({
      layout: { gridX: 0, gridY: 0, gridWidth: 8, gridHeight: 5 },
      moduleType: 'Theory',
      pageSize: 'A4',
      allModules: [],
    });
    expect(result.isValid).toBe(true);
    expect(result.code).toBeNull();
    expect(result.conflictingModule).toBeNull();
  });

  it('returns OUT_OF_BOUNDS before checking other rules', () => {
    const result = validateLayout({
      layout: { gridX: 100, gridY: 0, gridWidth: 8, gridHeight: 5 },
      moduleType: 'Theory',
      pageSize: 'A4',
      allModules: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('OUT_OF_BOUNDS');
  });

  it('returns BELOW_MIN_SIZE when the candidate is too small', () => {
    const result = validateLayout({
      layout: { gridX: 0, gridY: 0, gridWidth: 4, gridHeight: 4 },
      moduleType: 'Theory',
      pageSize: 'A4',
      allModules: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('BELOW_MIN_SIZE');
  });

  it('returns OVERLAP and the conflicting module when intersecting a sibling', () => {
    const sibling = makeModule('sibling', 0, 0, 10, 10);
    const result = validateLayout({
      layout: { gridX: 5, gridY: 5, gridWidth: 8, gridHeight: 5 },
      moduleType: 'Theory',
      pageSize: 'A4',
      allModules: [sibling],
    });
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('OVERLAP');
    expect(result.conflictingModule?.id).toBe('sibling');
  });

  it('uses excludeId to skip the moving module itself', () => {
    const moving = makeModule('moving', 0, 0, 10, 10);
    const result = validateLayout({
      layout: { gridX: 0, gridY: 0, gridWidth: 10, gridHeight: 10 },
      moduleType: 'Theory',
      pageSize: 'A4',
      allModules: [moving],
      excludeId: 'moving',
    });
    expect(result.isValid).toBe(true);
  });

  it('treats edge contact between modules as valid', () => {
    const sibling = makeModule('sibling', 0, 0, 10, 10);
    const result = validateLayout({
      layout: { gridX: 10, gridY: 0, gridWidth: 8, gridHeight: 5 },
      moduleType: 'Theory',
      pageSize: 'A4',
      allModules: [sibling],
    });
    expect(result.isValid).toBe(true);
  });
});
