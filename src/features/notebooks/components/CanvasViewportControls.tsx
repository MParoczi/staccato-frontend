import { useTranslation } from 'react-i18next';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import {
  GRID_ZOOM_MAX,
  GRID_ZOOM_MIN,
} from '@/lib/constants/grid';
import { cn } from '@/lib/utils';

interface CanvasViewportControlsProps {
  className?: string;
}

/**
 * Labeled zoom-in / zoom-out / reset controls for the canvas viewport.
 *
 * Each control routes through the shared `useUIStore` zoom helpers so
 * clamping and stepping match the documented 50%-200% / 10% behavior.
 * The current zoom percentage is announced through an `aria-live`
 * region so assistive technology users hear the new value when it
 * changes. Buttons rely on the shared shadcn/ui `Button`'s
 * `focus-visible` ring for visible focus treatment.
 */
export function CanvasViewportControls({
  className,
}: CanvasViewportControlsProps) {
  const { t } = useTranslation();
  const zoom = useUIStore((state) => state.zoom);
  const zoomIn = useUIStore((state) => state.zoomIn);
  const zoomOut = useUIStore((state) => state.zoomOut);
  const resetZoom = useUIStore((state) => state.resetZoom);

  const percentage = Math.round(zoom * 100);

  return (
    <div
      role="group"
      aria-label={t('notebooks.canvas.viewport.label')}
      data-testid="canvas-viewport-controls"
      className={cn('flex items-center gap-1', className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={zoomOut}
        disabled={zoom <= GRID_ZOOM_MIN}
        aria-label={t('notebooks.canvas.viewport.zoomOut')}
        data-testid="canvas-zoom-out"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </Button>
      <span
        aria-live="polite"
        aria-label={t('notebooks.canvas.viewport.currentZoom', {
          value: percentage,
        })}
        data-testid="canvas-zoom-percentage"
        className="min-w-10 text-center text-xs tabular-nums opacity-60"
      >
        {t('notebooks.shell.zoom.percentage', { value: percentage })}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={zoomIn}
        disabled={zoom >= GRID_ZOOM_MAX}
        aria-label={t('notebooks.canvas.viewport.zoomIn')}
        data-testid="canvas-zoom-in"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={resetZoom}
        aria-label={t('notebooks.canvas.viewport.resetZoom')}
        data-testid="canvas-zoom-reset"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
