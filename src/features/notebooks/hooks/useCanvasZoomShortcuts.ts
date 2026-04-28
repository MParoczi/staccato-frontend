import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface UseCanvasZoomShortcutsArgs {
  /**
   * When `true`, all keyboard zoom shortcuts are ignored. Owners pass
   * the canvas's `isInteracting` flag here so an active drag or resize
   * session never accidentally triggers a zoom change mid-gesture.
   */
  disabled?: boolean;
}

/**
 * Listen for the canvas zoom keyboard shortcuts:
 * - `Ctrl+Plus` (or `Ctrl+=`) → zoom in by one 10% step
 * - `Ctrl+Minus` (or `Ctrl+_`) → zoom out by one 10% step
 * - `Ctrl+0` → reset zoom to 100%
 *
 * The handlers route through the shared `useUIStore` zoom helpers, so
 * clamping to the documented 50%-200% range happens automatically. The
 * shortcut is also accepted with the macOS Meta (Cmd) key so the canvas
 * stays usable on Apple keyboards.
 */
export function useCanvasZoomShortcuts(
  args: UseCanvasZoomShortcutsArgs = {},
) {
  const { disabled = false } = args;
  const zoomIn = useUIStore((state) => state.zoomIn);
  const zoomOut = useUIStore((state) => state.zoomOut);
  const resetZoom = useUIStore((state) => state.resetZoom);

  useEffect(() => {
    if (disabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomIn();
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        resetZoom();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, zoomIn, zoomOut, resetZoom]);
}
