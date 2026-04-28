import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GRID_ZOOM_DEFAULT,
  GRID_ZOOM_MAX,
  GRID_ZOOM_MIN,
  GRID_ZOOM_STEP,
} from '@/lib/constants/grid';

interface UIState {
  sidebarOpen: boolean;
  selectedModuleId: string | null;
  zoom: number;
  theme: 'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  setSelectedModuleId: (id: string | null) => void;
  clearSelectedModule: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Snap a zoom value to the nearest 10% step (`GRID_ZOOM_STEP`) and clamp it
 * to the documented 50%-200% canvas range. Floating point math at one step
 * is rounded to two decimal places to avoid drift like `0.7000000000000001`.
 */
export function clampCanvasZoom(value: number): number {
  if (!Number.isFinite(value)) {
    return GRID_ZOOM_DEFAULT;
  }
  const stepped = Math.round(value / GRID_ZOOM_STEP) * GRID_ZOOM_STEP;
  const clamped = Math.min(GRID_ZOOM_MAX, Math.max(GRID_ZOOM_MIN, stepped));
  return Math.round(clamped * 100) / 100;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      selectedModuleId: null,
      zoom: GRID_ZOOM_DEFAULT,
      theme: 'system',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSelectedModuleId: (id) => set({ selectedModuleId: id }),
      clearSelectedModule: () => set({ selectedModuleId: null }),
      setZoom: (zoom) => set({ zoom: clampCanvasZoom(zoom) }),
      zoomIn: () => set({ zoom: clampCanvasZoom(get().zoom + GRID_ZOOM_STEP) }),
      zoomOut: () => set({ zoom: clampCanvasZoom(get().zoom - GRID_ZOOM_STEP) }),
      resetZoom: () => set({ zoom: GRID_ZOOM_DEFAULT }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'staccato-ui',
      partialize: (state) => ({
        theme: state.theme,
        zoom: state.zoom,
      }),
      merge: (persisted, current) => {
        const persistedState = (persisted ?? {}) as Partial<UIState>;
        const nextZoom =
          typeof persistedState.zoom === 'number'
            ? clampCanvasZoom(persistedState.zoom)
            : current.zoom;
        return {
          ...current,
          ...persistedState,
          zoom: nextZoom,
        };
      },
    },
  ),
);
