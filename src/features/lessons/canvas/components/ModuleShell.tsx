import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Module } from '@/types'
import { MODULE_TYPE_REGISTRY } from '../lib/moduleRegistry'
import type { ModuleType } from '../lib/moduleRegistry'
import { FloatingActionBar } from './FloatingActionBar'
import { ResizeHandle } from './ResizeHandle'
import type { HandleDirection } from './ResizeHandle'

const CELL = 32

interface ModuleShellProps {
  module: Module
  isSelected: boolean
  scale: number
  maxCols: number
  maxRows: number
  onSelect: (id: string) => void
  onBringForward: (id: string) => void
  onSendBackward: (id: string) => void
  onDeleteRequest: (id: string) => void
  onResize: (id: string, patch: { gridX: number; gridY: number; gridWidth: number; gridHeight: number }) => void
  onResizeCommit: (id: string, patch: { gridX: number; gridY: number; gridWidth: number; gridHeight: number }) => void
}

export function ModuleShell({
  module,
  isSelected,
  scale,
  maxCols,
  maxRows,
  onSelect,
  onBringForward,
  onSendBackward,
  onDeleteRequest,
  onResize,
  onResizeCommit,
}: ModuleShellProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: module.id,
  })

  const def = MODULE_TYPE_REGISTRY[module.moduleType as ModuleType]
    ?? MODULE_TYPE_REGISTRY.TextBlock  // fallback for unknown types

  const Icon = def.icon

  // CRITICAL: Use style prop, never Tailwind dynamic classes for position/size/transform
  // Tailwind v4 purges dynamic class names at build time — they work in dev but break in production
  const shellStyle: React.CSSProperties = {
    position: 'absolute',
    left: module.gridX * CELL,
    top: module.gridY * CELL,
    width: module.gridWidth * CELL,
    height: module.gridHeight * CELL,
    zIndex: isDragging ? 9999 : (isSelected ? module.zIndex + 1 : module.zIndex),
    transform: CSS.Transform.toString(transform),
    touchAction: 'none',  // required for PointerSensor on touch devices
    outline: isSelected ? '2px solid var(--ring)' : undefined,
    borderRadius: 4,
    overflow: 'visible',  // allow action bar and handles to render outside bounds
  }

  return (
    <div
      ref={setNodeRef}
      style={shellStyle}
      onClick={(e) => {
        e.stopPropagation()  // prevent canvas root deselect-all from firing
        onSelect(module.id)
      }}
      {...attributes}
      {...listeners}
    >
      {/* Header */}
      <div
        style={{
          background: def.headerColor,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 8px',
          borderRadius: '4px 4px 0 0',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <Icon style={{ width: 14, height: 14, color: 'white', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {def.label}
        </span>
      </div>

      {/* Body placeholder */}
      <div
        style={{
          flex: 1,
          height: module.gridHeight * CELL - 28,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
          Content editor — Phase 7+
        </span>
      </div>

      {/* Resize handles — 8 directions, replacing stub divs from Plan 2 */}
      {isSelected && (['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const).map((dir) => (
        <ResizeHandle
          key={dir}
          direction={dir as HandleDirection}
          module={module}
          scale={scale}
          maxCols={maxCols}
          maxRows={maxRows}
          onResize={(patch) => onResize(module.id, patch)}
          onResizeCommit={(patch) => onResizeCommit(module.id, patch)}
        />
      ))}

      {/* Floating action bar — rendered when selected */}
      {isSelected && (
        <FloatingActionBar
          moduleGridY={module.gridY}
          scale={scale}
          onBringForward={() => onBringForward(module.id)}
          onSendBackward={() => onSendBackward(module.id)}
          onDelete={() => onDeleteRequest(module.id)}
        />
      )}
    </div>
  )
}
