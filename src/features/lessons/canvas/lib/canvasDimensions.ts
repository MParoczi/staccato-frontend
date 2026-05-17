import type { NotebookPageSize } from '@/types'

export const CELL = 32

export const CANVAS_CONFIG = {
  A4:     { maxCols: 24, maxRows: 35, width: 768,  height: 1120 },
  Letter: { maxCols: 25, maxRows: 33, width: 800,  height: 1056 },
  A5:     { maxCols: 17, maxRows: 24, width: 544,  height: 768  },
} as const satisfies Record<NotebookPageSize, { maxCols: number; maxRows: number; width: number; height: number }>
