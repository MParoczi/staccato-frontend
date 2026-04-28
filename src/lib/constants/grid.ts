import type { PageSize } from '@/lib/types';

export const GRID_UNIT_MILLIMETERS = 5;
export const GRID_BASE_UNIT_PX = 20;
export const GRID_DOT_RADIUS_PX = 1;

export const GRID_ZOOM_MIN = 0.5;
export const GRID_ZOOM_MAX = 2;
export const GRID_ZOOM_STEP = 0.1;
export const GRID_ZOOM_DEFAULT = 1;

/**
 * Canvas review-target style tokens.
 *
 * Each token resolves through a CSS variable defined in `src/index.css` so
 * the notebook canvas paints the documented warm "paper" tone in light mode
 * while still respecting the dark-mode overrides. The light-mode values are
 * tuned to the representative review targets called out in the feature
 * spec (FR-006, FR-007, FR-015, FR-023):
 *
 *   paper        #F7F1E3
 *   dot          #A79B8B
 *   selection    #8A6A43
 *   handle       #B08968
 *   conflict     #B85C4B
 *   pageBorder   #E2D6C2
 *   pageShadow   0 10px 30px rgba(92, 74, 52, 0.14)
 */
export const GRID_CANVAS_STYLE_TOKENS = {
  paper: 'var(--notebook-paper)',
  dot: 'var(--notebook-dot)',
  selection: 'var(--notebook-selection)',
  handle: 'var(--notebook-handle)',
  hover: 'var(--notebook-hover)',
  conflict: 'var(--notebook-conflict)',
  pageBorder: 'var(--notebook-page-border)',
  pageShadow: 'var(--notebook-page-shadow)',
} as const;

export const PAGE_SIZE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 42, height: 59 },
  A5: { width: 29, height: 42 },
  A6: { width: 21, height: 29 },
  B5: { width: 35, height: 50 },
  B6: { width: 25, height: 35 },
};
