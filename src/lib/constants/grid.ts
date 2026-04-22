import type { PageSize } from '@/lib/types';

export const GRID_UNIT_MILLIMETERS = 5;
export const GRID_BASE_UNIT_PX = 20;
export const GRID_DOT_RADIUS_PX = 1;

export const GRID_ZOOM_MIN = 0.5;
export const GRID_ZOOM_MAX = 2;
export const GRID_ZOOM_STEP = 0.1;
export const GRID_ZOOM_DEFAULT = 1;

export const GRID_CANVAS_STYLE_TOKENS = {
  paper: 'var(--notebook-paper)',
  dot: 'var(--notebook-dot)',
  selection: 'var(--notebook-selection)',
  hover: 'var(--notebook-hover)',
  conflict: 'oklch(0.72 0.09 42 / 0.24)',
  pageBorder: 'oklch(0.88 0.015 75)',
  pageShadow: '0 18px 40px -24px rgb(74 52 38 / 0.35)',
} as const;

export const PAGE_SIZE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 42, height: 59 },
  A5: { width: 29, height: 42 },
  A6: { width: 21, height: 29 },
  B5: { width: 35, height: 50 },
  B6: { width: 25, height: 35 },
};
