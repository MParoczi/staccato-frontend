import { describe, it, expect } from 'vitest'
import { snapToGrid, pxToGrid, CELL } from './snapToGrid'

describe('snapToGrid', () => {
  it('snaps 0 to 0', () => expect(snapToGrid(0)).toBe(0))
  it('snaps exactly on grid to same value', () => expect(snapToGrid(64)).toBe(64))
  it('rounds down when below midpoint', () => expect(snapToGrid(15)).toBe(0))
  it('rounds up when above midpoint', () => expect(snapToGrid(17)).toBe(32))
  it('snaps negative value', () => expect(snapToGrid(-10)).toBe(0))
  it('uses custom cellSize', () => expect(snapToGrid(10, 8)).toBe(8))
  it('CELL constant is 32', () => expect(CELL).toBe(32))
})

describe('pxToGrid', () => {
  it('converts 0 to 0', () => expect(pxToGrid(0)).toBe(0))
  it('converts one cell to 1', () => expect(pxToGrid(32)).toBe(1))
  it('rounds 47px to 1 grid unit', () => expect(pxToGrid(47)).toBe(1))
  it('rounds 48px to 2 grid units', () => expect(pxToGrid(48)).toBe(2))
})
