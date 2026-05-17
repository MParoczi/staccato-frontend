import { describe, it, expect } from 'vitest'
import { CANVAS_CONFIG, CELL } from './canvasDimensions'

describe('CANVAS_CONFIG', () => {
  it('A4 width equals maxCols * CELL', () => {
    expect(CANVAS_CONFIG.A4.width).toBe(CANVAS_CONFIG.A4.maxCols * CELL)
  })
  it('A4 height equals maxRows * CELL', () => {
    expect(CANVAS_CONFIG.A4.height).toBe(CANVAS_CONFIG.A4.maxRows * CELL)
  })
  it('Letter width equals maxCols * CELL', () => {
    expect(CANVAS_CONFIG.Letter.width).toBe(CANVAS_CONFIG.Letter.maxCols * CELL)
  })
  it('A5 height equals maxRows * CELL', () => {
    expect(CANVAS_CONFIG.A5.height).toBe(CANVAS_CONFIG.A5.maxRows * CELL)
  })
  it('A4 dimensions are 768 x 1120', () => {
    expect(CANVAS_CONFIG.A4.width).toBe(768)
    expect(CANVAS_CONFIG.A4.height).toBe(1120)
  })
  it('CELL constant is 32', () => expect(CELL).toBe(32))
})
