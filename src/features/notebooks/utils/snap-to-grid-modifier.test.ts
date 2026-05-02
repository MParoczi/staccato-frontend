import { describe, it, expect } from 'vitest';
import { createSnapToGridModifier } from './snap-to-grid-modifier';
import { GRID_BASE_UNIT_PX } from '@/lib/constants/grid';

function makeArgs(transform: { x: number; y: number; scaleX: number; scaleY: number }) {
  // Cast through unknown — the modifier only consumes `transform`, the
  // remaining dnd-kit fields are not needed for this unit test.
  return {
    activatorEvent: null,
    active: null,
    activeNodeRect: null,
    draggingNodeRect: null,
    containerNodeRect: null,
    over: null,
    overlayNodeRect: null,
    scrollableAncestors: [],
    scrollableAncestorRects: [],
    transform,
    windowRect: null,
  } as unknown as Parameters<ReturnType<typeof createSnapToGridModifier>>[0];
}

describe('createSnapToGridModifier', () => {
  it('snaps the transform to whole grid units at zoom 1', () => {
    const modifier = createSnapToGridModifier(1);
    const next = modifier(
      makeArgs({ x: 27, y: 13, scaleX: 1, scaleY: 1 }),
    );
    // 27 px / 20 px-per-unit ≈ 1.35 → round → 1 unit → 20 px
    expect(next.x).toBe(GRID_BASE_UNIT_PX);
    // 13 px / 20 px-per-unit ≈ 0.65 → round → 1 unit → 20 px
    expect(next.y).toBe(GRID_BASE_UNIT_PX);
  });

  it('scales the snap step with the zoom factor', () => {
    const modifier = createSnapToGridModifier(2);
    // Grid unit at zoom 2 = 40 px; 70 px → round(1.75) = 2 → 80 px.
    const next = modifier(
      makeArgs({ x: 70, y: -50, scaleX: 1, scaleY: 1 }),
    );
    expect(next.x).toBe(80);
    expect(next.y).toBe(-40);
  });

  it('preserves the transform when grid size is zero', () => {
    const modifier = createSnapToGridModifier(0);
    const input = { x: 17, y: 5, scaleX: 1, scaleY: 1 };
    const next = modifier(makeArgs(input));
    expect(next).toEqual(input);
  });

  it('keeps scaleX/scaleY untouched on the snapped transform', () => {
    const modifier = createSnapToGridModifier(1);
    const next = modifier(
      makeArgs({ x: 25, y: 25, scaleX: 1, scaleY: 1 }),
    );
    expect(next.scaleX).toBe(1);
    expect(next.scaleY).toBe(1);
  });
});

