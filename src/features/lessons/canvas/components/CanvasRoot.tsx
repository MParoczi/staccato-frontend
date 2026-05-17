import { useRef, useEffect } from 'react'
import { useCanvasScale } from '../hooks/useCanvasScale'
import { CANVAS_CONFIG } from '../lib/canvasDimensions'
import type { NotebookPageSize } from '@/types'

interface CanvasRootProps {
  pageId: string
  pageSize: NotebookPageSize
}

export function CanvasRoot({ pageId: _pageId, pageSize }: CanvasRootProps) {
  const config = CANVAS_CONFIG[pageSize]
  const { wrapperRef, scale } = useCanvasScale(config.width)
  const scaleRef = useRef(scale)

  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  return (
    // Outer wrapper: ResizeObserver target — NO transform here (Radix portal rule)
    <div
      ref={wrapperRef}
      style={{ height: config.height * scale, position: 'relative' }}
    >
      {/* Inner canvas: fixed px size, scale applied here only */}
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
      >
        {/* DndContext, ModuleShells added in Plans 2–3 */}
      </div>
    </div>
  )
}
