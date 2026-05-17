export const CELL = 32

/** Snap a canvas-pixel value to the nearest 32-px grid cell boundary. Returns pixels. */
export function snapToGrid(px: number, cellSize: number = CELL): number {
  return (Math.round(px / cellSize) * cellSize) || 0
}

/** Convert a canvas-pixel value to grid units (snapped integer). */
export function pxToGrid(px: number, cellSize: number = CELL): number {
  return Math.round(px / cellSize)
}
