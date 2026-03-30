import type { PageSize } from '@/lib/types';

export const PAGE_SIZE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 42, height: 59 },
  A5: { width: 29, height: 42 },
  A6: { width: 21, height: 29 },
  B5: { width: 35, height: 50 },
  B6: { width: 25, height: 35 },
};
