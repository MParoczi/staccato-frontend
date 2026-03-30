import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  selectedModuleId: string | null;
  zoom: number;
  theme: 'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  setSelectedModuleId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      selectedModuleId: null,
      zoom: 1,
      theme: 'system',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSelectedModuleId: (id) => set({ selectedModuleId: id }),
      setZoom: (zoom) => set({ zoom: Math.min(3.0, Math.max(0.25, zoom)) }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'staccato-ui',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
