import { useMemo } from 'react';
import type { PageSize } from '@/lib/types';
import {
  GRID_BASE_UNIT_PX,
  GRID_CANVAS_STYLE_TOKENS,
  GRID_DOT_RADIUS_PX,
  GRID_ZOOM_DEFAULT,
  PAGE_SIZE_DIMENSIONS,
} from '@/lib/constants/grid';
import {
  getPagePixelDimensions,
  gridUnitsToPixels,
} from '@/features/notebooks/utils/grid-layout';
import { cn } from '@/lib/utils';

interface DottedPaperProps {
  pageSize: PageSize;
  /**
   * Canvas zoom factor in the documented 50%-200% range. Controls dot
   * spacing and the rendered pixel size of the paper. Defaults to 100%.
   */
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders the lesson-page paper surface with the warm off-white fill, a
 * subtle page-edge border and shadow (the canvas review-target styling),
 * and the dotted 5 mm grid that scales with the active zoom factor.
 *
 * The component renders at the true grid pixel size (`PAGE_SIZE_DIMENSIONS`
 * × `GRID_BASE_UNIT_PX` × `zoom`) so positioned children can use absolute
 * grid-derived pixel coordinates without compensating for layout-driven
 * scaling. An `aspectRatio` is also set so the surface keeps the correct
 * proportions when consumers override its sizing via className.
 */
export function DottedPaper({
  pageSize,
  zoom = GRID_ZOOM_DEFAULT,
  className,
  children,
}: DottedPaperProps) {
  const dimensions = PAGE_SIZE_DIMENSIONS[pageSize];

  const aspectRatio = useMemo(
    () => `${dimensions.width} / ${dimensions.height}`,
    [dimensions],
  );

  const pixels = useMemo(
    () => getPagePixelDimensions(pageSize, zoom),
    [pageSize, zoom],
  );

  const dotSpacing = useMemo(
    () => gridUnitsToPixels(1, zoom),
    [zoom],
  );

  return (
    <div
      data-testid="dotted-paper"
      className={cn(
        'relative mx-auto origin-top rounded-sm border',
        className,
      )}
      style={{
        aspectRatio,
        width: `${pixels.width}px`,
        height: `${pixels.height}px`,
        backgroundColor: GRID_CANVAS_STYLE_TOKENS.paper,
        backgroundImage: `radial-gradient(circle, ${GRID_CANVAS_STYLE_TOKENS.dot} ${GRID_DOT_RADIUS_PX}px, transparent ${GRID_DOT_RADIUS_PX}px)`,
        backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
        borderColor: GRID_CANVAS_STYLE_TOKENS.pageBorder,
        boxShadow: GRID_CANVAS_STYLE_TOKENS.pageShadow,
        // Anchor the dot grid to the top-left corner so the first dot sits
        // exactly at (0, 0) regardless of zoom level.
        backgroundPosition: '0 0',
      }}
    >
      {children}
    </div>
  );
}

// Re-export the base unit so consumers (`GridCanvas`, tests) can derive
// related measurements without importing from multiple places.
export { GRID_BASE_UNIT_PX };
