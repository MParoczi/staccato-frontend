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
  const dotSpacing = 20;

  return (
    <div
      className={cn('relative mx-auto origin-top', className)}
      style={{
        aspectRatio,
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
        backgroundColor: 'var(--notebook-paper)',
        backgroundImage:
          'radial-gradient(circle, var(--notebook-dot) 1px, transparent 1px)',
        backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
      }}
    >
      {children}
    </div>
  );
}
