import { describe, it, expect } from 'vitest';
import { checkOverlap, rectanglesOverlap } from './overlap';
import type { Module } from '@/lib/types';

function rect(
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

describe('rectanglesOverlap', () => {
  it('returns true for clearly intersecting rectangles', () => {
    expect(
      rectanglesOverlap(
        { gridX: 0, gridY: 0, gridWidth: 4, gridHeight: 4 },
        { gridX: 2, gridY: 2, gridWidth: 4, gridHeight: 4 },
      ),
    ).toBe(true);
  });

  it('returns true when one rectangle fully contains another', () => {
    expect(
      rectanglesOverlap(
        { gridX: 0, gridY: 0, gridWidth: 10, gridHeight: 10 },
        { gridX: 2, gridY: 2, gridWidth: 4, gridHeight: 4 },
      ),
    ).toBe(true);
  });

  it('returns false for rectangles whose right/left edges touch', () => {
    expect(
      rectanglesOverlap(
        { gridX: 0, gridY: 0, gridWidth: 4, gridHeight: 4 },
        { gridX: 4, gridY: 0, gridWidth: 4, gridHeight: 4 },
      ),
    ).toBe(false);
  });

  it('returns false for rectangles whose bottom/top edges touch', () => {
    expect(
      rectanglesOverlap(
        { gridX: 0, gridY: 0, gridWidth: 4, gridHeight: 4 },
        { gridX: 0, gridY: 4, gridWidth: 4, gridHeight: 4 },
      ),
    ).toBe(false);
  });

  it('returns false for rectangles whose corners touch', () => {
    expect(
      rectanglesOverlap(
        { gridX: 0, gridY: 0, gridWidth: 4, gridHeight: 4 },
        { gridX: 4, gridY: 4, gridWidth: 4, gridHeight: 4 },
      ),
    ).toBe(false);
  });

  it('returns false for rectangles that do not touch at all', () => {
    expect(
      rectanglesOverlap(
        { gridX: 0, gridY: 0, gridWidth: 4, gridHeight: 4 },
        { gridX: 10, gridY: 10, gridWidth: 4, gridHeight: 4 },
      ),
    ).toBe(false);
  });
});

describe('checkOverlap', () => {
  const modules: Module[] = [
    rect('a', 0, 0, 4, 4),
    rect('b', 6, 0, 4, 4),
    rect('c', 0, 6, 4, 4),
  ];

  it('returns null when there is no conflict', () => {
    const candidate = rect('moving', 5, 5, 1, 1);
    expect(checkOverlap(candidate, modules)).toBeNull();
  });

  it('returns the conflicting module when overlap exists', () => {
    const candidate = rect('moving', 1, 1, 4, 4);
    const conflict = checkOverlap(candidate, modules);
    expect(conflict?.id).toBe('a');
  });

  it('skips the candidate when it shares an id with a stored module', () => {
    const candidate = rect('a', 0, 0, 4, 4);
    expect(checkOverlap(candidate, modules)).toBeNull();
  });

  it('honors an explicit excludeId override', () => {
    const candidate = rect('moving', 0, 0, 4, 4);
    expect(checkOverlap(candidate, modules, 'a')).toBeNull();
  });

  it('returns the first conflicting module encountered', () => {
    const candidate = rect('moving', 0, 0, 10, 10);
    const conflict = checkOverlap(candidate, modules);
    expect(conflict?.id).toBe('a');
  });
});
