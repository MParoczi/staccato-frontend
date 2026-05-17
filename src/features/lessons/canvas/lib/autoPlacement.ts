import type { Module } from '@/types'
import { MODULE_TYPE_REGISTRY } from './moduleRegistry'
import type { ModuleType } from './moduleRegistry'

export type PlacementResult =
  | { found: true; gridX: number; gridY: number; gridWidth: number; gridHeight: number }
  | { found: false }

export function findAutoPlacement(
  existingModules: Module[],
  moduleType: ModuleType,
  maxCols: number,
  maxRows: number,
): PlacementResult {
  const def = MODULE_TYPE_REGISTRY[moduleType]
  const w = def.defaultWidth
  const h = def.defaultHeight

  const occupied = new Set<string>()
  for (const m of existingModules) {
    for (let row = m.gridY; row < m.gridY + m.gridHeight; row++) {
      for (let col = m.gridX; col < m.gridX + m.gridWidth; col++) {
        occupied.add(`${col},${row}`)
      }
    }
  }

  for (let row = 0; row <= maxRows - h; row++) {
    for (let col = 0; col <= maxCols - w; col++) {
      let clear = true
      outer: for (let r = row; r < row + h; r++) {
        for (let c = col; c < col + w; c++) {
          if (occupied.has(`${c},${r}`)) {
            clear = false
            break outer
          }
        }
      }
      if (clear) return { found: true, gridX: col, gridY: row, gridWidth: w, gridHeight: h }
    }
  }
  return { found: false }
}
