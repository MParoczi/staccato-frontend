import { useRef, useEffect, useState, useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCanvasScale } from '../hooks/useCanvasScale'
import { CANVAS_CONFIG, CELL } from '../lib/canvasDimensions'
import { createScaleModifier } from '../lib/scaleModifier'
import { getModules, createModule, deleteModule } from '../api/modulesApi'
import { MODULE_TYPE_REGISTRY } from '../lib/moduleRegistry'
import type { ModuleType } from '../lib/moduleRegistry'
import { findAutoPlacement } from '../lib/autoPlacement'
import { ModuleShell } from './ModuleShell'
import { DeleteModuleDialog } from './DeleteModuleDialog'
import type { NotebookPageSize, Module, CreateModulePayload } from '@/types'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { detail?: string } } }).response
    if (resp?.data?.detail) return resp.data.detail
  }
  return fallback
}

interface CanvasRootProps {
  pageId: string
  pageSize: NotebookPageSize
  onAddModuleRef?: React.MutableRefObject<((type: ModuleType) => void) | null>
}

export function CanvasRoot({ pageId, pageSize, onAddModuleRef }: CanvasRootProps) {
  const config = CANVAS_CONFIG[pageSize]
  const { wrapperRef, scale } = useCanvasScale(config.width)
  const scaleRef = useRef(scale)
  const queryClient = useQueryClient()

  useEffect(() => { scaleRef.current = scale }, [scale])

  // Server state: module list
  const { data: serverModules = [] } = useQuery({
    queryKey: ['modules', pageId],
    queryFn: () => getModules(pageId),
    enabled: !!pageId,
  })

  // Local state mirrors server state; updated optimistically for drag/resize
  const [localModules, setLocalModules] = useState<Module[]>([])
  useEffect(() => { setLocalModules(serverModules) }, [serverModules])

  // Selection state
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [deleteDialogModuleId, setDeleteDialogModuleId] = useState<string | null>(null)

  // Scale modifier for DndContext — divides raw pointer delta by scale ratio
  const scaleModifier = useMemo(() => createScaleModifier(() => scaleRef.current), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const createModuleMutation = useMutation({
    mutationFn: (payload: CreateModulePayload) => createModule(pageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', pageId] })
    },
    onError: (error: unknown) => {
      const msg = extractErrorMessage(error, 'Failed to add module')
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (moduleId: string) => deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', pageId] })
      setDeleteDialogModuleId(null)
      setSelectedModuleId(null)
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to delete module'))
    },
  })

  function handleAddModule(type: ModuleType) {
    const placement = findAutoPlacement(localModules, type, config.maxCols, config.maxRows)
    if (!placement.found) {
      toast.error('Canvas is full — move or delete a module first')
      return
    }
    const _def = MODULE_TYPE_REGISTRY[type]
    createModuleMutation.mutate({
      moduleType: type,
      gridX: placement.gridX,
      gridY: placement.gridY,
      gridWidth: placement.gridWidth,
      gridHeight: placement.gridHeight,
      zIndex: localModules.length,
      content: undefined,
    })
  }

  // Expose handler via ref so LessonPage's ModulePalette can call it
  useEffect(() => {
    if (onAddModuleRef) onAddModuleRef.current = handleAddModule
  })

  function handleDragEnd({ active, delta }: DragEndEvent) {
    // delta is already scale-corrected by createScaleModifier (in canvas-px)
    const module = localModules.find(m => m.id === String(active.id))
    if (!module) return

    // Convert canvas-px delta to grid units, then snap to integer grid units
    const rawNewX = module.gridX + delta.x / CELL
    const rawNewY = module.gridY + delta.y / CELL

    const snappedX = Math.round(rawNewX)
    const snappedY = Math.round(rawNewY)

    // Clamp to canvas bounds (CANVAS-06)
    const clampedX = Math.max(0, Math.min(config.maxCols - module.gridWidth, snappedX))
    const clampedY = Math.max(0, Math.min(config.maxRows - module.gridHeight, snappedY))

    // Update local state immediately (PATCH persistence in Plan 4)
    setLocalModules(prev => prev.map(m =>
      m.id === module.id ? { ...m, gridX: clampedX, gridY: clampedY } : m
    ))
  }

  function handleResize(
    moduleId: string,
    patch: { gridX: number; gridY: number; gridWidth: number; gridHeight: number }
  ) {
    // Live preview — fractional values allowed, no persistence yet
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, ...patch } : m
    ))
  }

  function handleResizeCommit(
    moduleId: string,
    patch: { gridX: number; gridY: number; gridWidth: number; gridHeight: number }
  ) {
    // Patch is already snapped and clamped by ResizeHandle.handlePointerUp
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, ...patch } : m
    ))
    // PATCH persistence added in Plan 4
  }

  function handleDeselectAll() {
    setSelectedModuleId(null)
  }

  function handleBringForward(moduleId: string) {
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, zIndex: m.zIndex + 1 } : m
    ))
    // PATCH persistence added in Plan 4
  }

  function handleSendBackward(moduleId: string) {
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, zIndex: Math.max(0, m.zIndex - 1) } : m
    ))
    // PATCH persistence added in Plan 4
  }

  function handleDeleteRequest(moduleId: string) {
    setDeleteDialogModuleId(moduleId)
  }

  function handleDeleteConfirm() {
    if (!deleteDialogModuleId) return
    deleteMutation.mutate(deleteDialogModuleId)
  }

  return (
    <div
      ref={wrapperRef}
      style={{ height: config.height * scale, position: 'relative' }}
    >
      <div
        style={{
          position: 'relative',
          width: config.width,
          height: config.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundImage:
            'radial-gradient(circle, color-mix(in oklch, var(--muted-foreground) 25%, transparent) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundColor: 'hsl(var(--background))',
        }}
        onClick={handleDeselectAll}
      >
        <DndContext sensors={sensors} modifiers={[scaleModifier]} onDragEnd={handleDragEnd}>
          {localModules.map((module) => (
            <ModuleShell
              key={module.id}
              module={module}
              isSelected={selectedModuleId === module.id}
              scale={scale}
              maxCols={config.maxCols}
              maxRows={config.maxRows}
              onSelect={setSelectedModuleId}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onDeleteRequest={handleDeleteRequest}
              onResize={handleResize}
              onResizeCommit={handleResizeCommit}
            />
          ))}
        </DndContext>
      </div>

      {/* DeleteModuleDialog renders outside the scale transform — uses Radix portal */}
      <DeleteModuleDialog
        open={deleteDialogModuleId !== null}
        onOpenChange={(open) => { if (!open) setDeleteDialogModuleId(null) }}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
