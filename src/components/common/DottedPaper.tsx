import { useMemo } from 'react';
import type { PageSize } from '@/lib/types';
import { PAGE_SIZE_DIMENSIONS } from '@/lib/constants/grid';
import { cn } from '@/lib/utils';

interface DottedPaperProps {
  pageSize: PageSize;
  zoom: number;
  className?: string;
  children?: React.ReactNode;
}

export function DottedPaper({ pageSize, zoom, className, children }: DottedPaperProps) {
  const dimensions = PAGE_SIZE_DIMENSIONS[pageSize];

  const aspectRatio = useMemo(
    () => `${dimensions.width} / ${dimensions.height}`,
    [dimensions],
  );

  // Dot spacing scales with the grid dimensions — 5mm grid equivalent
  // Adjust dot size inversely with zoom to keep dots visually subtle at high zoom
  const dotSpacing = 20;
  const dotRadius = Math.max(0.5, 1 / zoom);

  return (
    <div
      className={cn('relative mx-auto origin-top', className)}
      style={{
        aspectRatio,
        backgroundColor: 'var(--notebook-paper)',
        backgroundImage:
          `radial-gradient(circle, var(--notebook-dot) ${dotRadius}px, transparent ${dotRadius}px)`,
        backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
      }}
    >
      {children}
    </div>
  );
}
