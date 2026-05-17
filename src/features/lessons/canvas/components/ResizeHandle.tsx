import { useRef } from 'react'
import type { Module } from '@/types'
import { MODULE_TYPE_REGISTRY } from '../lib/moduleRegistry'
import type { ModuleType } from '../lib/moduleRegistry'

const CELL = 32

export type HandleDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export function getHandleStyle(dir: HandleDirection): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 8,
    height: 8,
    background: 'var(--primary)',
    borderRadius: 2,
    zIndex: 10,
    cursor: `${dir}-resize`,
    // Handles stick out 4px from the shell edges — requires overflow:visible on the shell
  }
  if (dir.includes('n')) base.top = -4
  if (dir.includes('s')) base.bottom = -4
  if (dir.includes('e')) base.right = -4
  if (dir.includes('w')) base.left = -4
  if (dir === 'n' || dir === 's') { base.left = '50%'; base.marginLeft = -4 }
  if (dir === 'e' || dir === 'w') { base.top = '50%'; base.marginTop = -4 }
  return base
}

// The live preview patch type — sub-pixel values allowed here
type LayoutPatch = {
  gridX: number
  gridY: number
  gridWidth: number
  gridHeight: number
}

interface ResizeHandleProps {
  direction: HandleDirection
  module: Module
  scale: number
  maxCols: number
  maxRows: number
  onResize: (patch: LayoutPatch) => void          // called on every pointer move (live preview)
  onResizeCommit: (patch: LayoutPatch) => void    // called on pointer up (snap + clamp)
}

export function ResizeHandle({
  direction,
  module,
  scale,
  maxCols,
  maxRows,
  onResize,
  onResizeCommit,
}: ResizeHandleProps) {
  // Store the drag start state so we compute deltas from the original position
  const startRef = useRef<{
    pointerX: number
    pointerY: number
    module: Module
  } | null>(null)

  function handlePointerDown(e: React.PointerEvent) {
    // CRITICAL: stopPropagation prevents DndContext from activating a drag
    // when the user grabs a resize handle
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      module: { ...module },  // snapshot at drag start
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startRef.current) return
    const { pointerX, pointerY, module: orig } = startRef.current

    // CRITICAL: divide by scale to convert screen-px delta to canvas-px delta
    const dxCanvas = (e.clientX - pointerX) / scale
    const dyCanvas = (e.clientY - pointerY) / scale

    const def = MODULE_TYPE_REGISTRY[orig.moduleType as ModuleType]
      ?? MODULE_TYPE_REGISTRY.TextBlock

    // Compute new layout from deltas — in grid units (may be fractional during live preview)
    let gridX = orig.gridX
    let gridY = orig.gridY
    let gridWidth = orig.gridWidth
    let gridHeight = orig.gridHeight

    // East handles increase width
    if (direction.includes('e')) {
      gridWidth = Math.max(def.minWidth, orig.gridWidth + dxCanvas / CELL)
    }
    // West handles move left edge (x decreases, width increases)
    if (direction.includes('w')) {
      const newW = Math.max(def.minWidth, orig.gridWidth - dxCanvas / CELL)
      gridX = orig.gridX + orig.gridWidth - newW
      gridWidth = newW
    }
    // South handles increase height
    if (direction.includes('s')) {
      gridHeight = Math.max(def.minHeight, orig.gridHeight + dyCanvas / CELL)
    }
    // North handles move top edge (y decreases, height increases)
    if (direction.includes('n')) {
      const newH = Math.max(def.minHeight, orig.gridHeight - dyCanvas / CELL)
      gridY = orig.gridY + orig.gridHeight - newH
      gridHeight = newH
    }

    // Live preview — fractional values allowed, caller does NOT persist yet
    onResize({ gridX, gridY, gridWidth, gridHeight })
  }

  function handlePointerUp() {
    if (!startRef.current) return
    // Snap to grid and clamp to bounds — caller will persist this
    // We re-read current localModule state via the parent's onResizeCommit
    // The fractional patch from the last onResize call is what we commit
    // Get the current display values from the module prop (which was updated live):
    const def = MODULE_TYPE_REGISTRY[module.moduleType as ModuleType]
      ?? MODULE_TYPE_REGISTRY.TextBlock

    // Snap each dimension to integer grid units
    const snappedWidth = Math.max(def.minWidth, Math.round(module.gridWidth))
    const snappedHeight = Math.max(def.minHeight, Math.round(module.gridHeight))
    let snappedX = Math.round(module.gridX)
    let snappedY = Math.round(module.gridY)

    // Clamp to canvas bounds
    snappedX = Math.max(0, Math.min(maxCols - snappedWidth, snappedX))
    snappedY = Math.max(0, Math.min(maxRows - snappedHeight, snappedY))

    onResizeCommit({ gridX: snappedX, gridY: snappedY, gridWidth: snappedWidth, gridHeight: snappedHeight })
    startRef.current = null
  }

  return (
    <div
      data-resize-handle={direction}
      style={getHandleStyle(direction)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  )
}
