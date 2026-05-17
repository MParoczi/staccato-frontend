import { describe, it, expect } from 'vitest'
import { findAutoPlacement } from './autoPlacement'
import type { Module } from '@/types'

function makeModule(overrides: Partial<Module>): Module {
  return {
    id: 'test',
    pageId: 'page',
    moduleType: 'TextBlock',
    gridX: 0, gridY: 0, gridWidth: 4, gridHeight: 3,
    zIndex: 1,
    content: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('findAutoPlacement', () => {
  it('places first module at (0, 0) when canvas is empty', () => {
    const result = findAutoPlacement([], 'TextBlock', 24, 35)
    expect(result).toEqual({ found: true, gridX: 0, gridY: 0, gridWidth: 6, gridHeight: 4 })
  })

  it('skips occupied cells and finds next available slot', () => {
    const existing = [makeModule({ gridX: 0, gridY: 0, gridWidth: 6, gridHeight: 4 })]
    const result = findAutoPlacement(existing, 'TextBlock', 24, 35)
    expect(result.found).toBe(true)
    if (result.found) {
      // Should start at col 6 (first non-overlapping position in row 0)
      expect(result.gridX).toBe(6)
      expect(result.gridY).toBe(0)
    }
  })

  it('returns found:false when canvas is full', () => {
    // Fill entire A4 canvas with 1×1 modules
    const existing: Module[] = []
    for (let row = 0; row < 35; row++) {
      for (let col = 0; col < 24; col++) {
        existing.push(makeModule({ id: `${col}-${row}`, gridX: col, gridY: row, gridWidth: 1, gridHeight: 1 }))
      }
    }
    // TextBlock defaultWidth=6, defaultHeight=4 — no room
    const result = findAutoPlacement(existing, 'TextBlock', 24, 35)
    expect(result.found).toBe(false)
  })

  it('respects maxCols boundary — does not place module hanging off right edge', () => {
    // col 20 + width 6 = 26 > maxCols 24 — should not place here
    const result = findAutoPlacement([], 'TextBlock', 6, 35)
    // Only 6 cols available, TextBlock defaultWidth=6, should fit at col 0
    expect(result.found).toBe(true)
    if (result.found) expect(result.gridX).toBe(0)
  })
})
