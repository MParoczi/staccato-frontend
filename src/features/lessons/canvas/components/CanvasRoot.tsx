import { useRef, useEffect, useState, useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCanvasScale } from '../hooks/useCanvasScale'
import { CANVAS_CONFIG } from '../lib/canvasDimensions'
import { createScaleModifier } from '../lib/scaleModifier'
import { getModules, createModule } from '../api/modulesApi'
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

  // Local state mirrors server state; updated optimistically for drag/resize in Plan 3
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

  function handleDragEnd(_event: DragEndEvent) {
    // Full drag handling implemented in Plan 3
    // Plan 2: drag activates (module "lifts") but returns to original position on release
  }

  function handleDeselectAll() {
    setSelectedModuleId(null)
  }

  // Stubs for z-order and delete — wired fully in Plan 3
  function handleBringForward(moduleId: string) {
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, zIndex: m.zIndex + 1 } : m
    ))
  }

  function handleSendBackward(moduleId: string) {
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, zIndex: Math.max(0, m.zIndex - 1) } : m
    ))
  }

  function handleDeleteRequest(moduleId: string) {
    setDeleteDialogModuleId(moduleId)
  }

  function handleDeleteConfirm() {
    // Full DELETE mutation wired in Plan 3; stub for now
    setDeleteDialogModuleId(null)
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
              onSelect={setSelectedModuleId}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </DndContext>
      </div>

      {/* DeleteModuleDialog renders outside the scale transform — uses Radix portal */}
      <DeleteModuleDialog
        open={deleteDialogModuleId !== null}
        onOpenChange={(open) => { if (!open) setDeleteDialogModuleId(null) }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
