import { useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';

/**
 * Shared selection/deselection state for the lesson-page canvas.
 *
 * Phase 3 (User Story 1) only wires selection and empty-canvas
 * deselection. Drag/resize sessions, wheel handling, and zoom lock are
 * added by User Story 2 and User Story 4 through the same hook.
 */
export function useCanvasInteractions() {
  const selectedModuleId = useUIStore((state) => state.selectedModuleId);
  const setSelectedModuleId = useUIStore(
    (state) => state.setSelectedModuleId,
  );
  const clearSelectedModule = useUIStore(
    (state) => state.clearSelectedModule,
  );

  const selectModule = useCallback(
    (moduleId: string) => {
      setSelectedModuleId(moduleId);
    },
    [setSelectedModuleId],
  );

  /**
   * Clicking the lesson-page canvas surface (not a module) clears the
   * current selection. Event delegation: we only deselect when the
   * pointer target is the surface element itself, so clicks that bubble
   * up from a child module card (which stops propagation) are ignored.
   */
  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) {
        clearSelectedModule();
      }
    },
    [clearSelectedModule],
  );

  return {
    selectedModuleId,
    selectModule,
    clearSelection: clearSelectedModule,
    handleCanvasPointerDown,
  };
}
