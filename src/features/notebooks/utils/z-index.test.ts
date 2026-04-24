import { describe, it, expect } from 'vitest';
import {
  bringToFront,
  getMaxZIndex,
  isOnBottom,
  isOnTop,
  sendToBack,
} from './z-index';
import type { Module } from '@/lib/types';

function makeModule(id: string, zIndex: number): Module {
  return {
    id,
    lessonPageId: 'page-1',
    moduleType: 'Theory',
    gridX: 0,
    gridY: 0,
    gridWidth: 1,
    gridHeight: 1,
    zIndex,
    content: [],
  };
}

describe('getMaxZIndex', () => {
  it('returns -1 when there are no modules', () => {
    expect(getMaxZIndex([])).toBe(-1);
  });

  it('returns the highest zIndex in the list', () => {
    expect(
      getMaxZIndex([makeModule('a', 0), makeModule('b', 4), makeModule('c', 2)]),
    ).toBe(4);
  });
});

describe('bringToFront', () => {
  it('returns one above the current other-module max', () => {
    const modules = [
      makeModule('a', 0),
      makeModule('b', 1),
      makeModule('c', 2),
    ];
    expect(bringToFront(modules, 'a')).toBe(3);
  });

  it('returns the current zIndex when the module is the only one', () => {
    expect(bringToFront([makeModule('a', 5)], 'a')).toBe(5);
  });

  it('returns the current zIndex when the module is already on top', () => {
    const modules = [makeModule('a', 0), makeModule('b', 4)];
    expect(bringToFront(modules, 'b')).toBe(4);
  });

  it('returns 0 for an unknown module id', () => {
    expect(bringToFront([makeModule('a', 0)], 'missing')).toBe(0);
  });
});

describe('sendToBack', () => {
  it('always returns 0', () => {
    expect(sendToBack()).toBe(0);
  });
});

describe('isOnTop / isOnBottom', () => {
  const modules = [
    makeModule('a', 0),
    makeModule('b', 2),
    makeModule('c', 5),
  ];

  it('isOnTop is true only for the highest-zIndex module', () => {
    expect(isOnTop(modules, 'a')).toBe(false);
    expect(isOnTop(modules, 'b')).toBe(false);
    expect(isOnTop(modules, 'c')).toBe(true);
  });

  it('isOnBottom is true only when zIndex is 0', () => {
    expect(isOnBottom(modules, 'a')).toBe(true);
    expect(isOnBottom(modules, 'b')).toBe(false);
    expect(isOnBottom(modules, 'c')).toBe(false);
  });

  it('returns false for unknown ids', () => {
    expect(isOnTop(modules, 'missing')).toBe(false);
    expect(isOnBottom(modules, 'missing')).toBe(false);
  });
});
