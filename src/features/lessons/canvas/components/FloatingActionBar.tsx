import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingActionBarProps {
  moduleGridY: number
  scale: number
  onBringForward: () => void
  onSendBackward: () => void
  onDelete: () => void
}

const ACTION_BAR_HEIGHT = 36  // approximate px height of the bar

const CELL = 32

export function FloatingActionBar({
  moduleGridY,
  scale,
  onBringForward,
  onSendBackward,
  onDelete,
}: FloatingActionBarProps) {
  // D-06: flip below if the module top is too close to the canvas top
  const moduleTopPx = moduleGridY * CELL * scale
  const flipped = moduleTopPx < ACTION_BAR_HEIGHT + 8

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        ...(flipped
          ? { top: 'calc(100% + 4px)' }
          : { bottom: 'calc(100% + 4px)' }),
        zIndex: 100,
        // Do NOT add transform here — it would interact with parent's transform
      }}
      // D-05: stop click from bubbling to module shell (which would re-select) or canvas root (which would deselect)
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 rounded-md border bg-background shadow-md px-1 py-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBringForward}
          title="Bring forward"
          aria-label="Bring forward"
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSendBackward}
          title="Send backward"
          aria-label="Send backward"
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          title="Delete module"
          aria-label="Delete module"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
