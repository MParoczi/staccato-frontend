import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasZoomShortcuts } from './useCanvasZoomShortcuts';
import { useUIStore } from '@/stores/uiStore';
import { GRID_ZOOM_DEFAULT } from '@/lib/constants/grid';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

function dispatchKey(
  key: string,
  init: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  window.dispatchEvent(event);
  return event;
}

describe('useCanvasZoomShortcuts', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().setZoom(GRID_ZOOM_DEFAULT);
    });
  });

  it('zooms in by one step on Ctrl+Plus', () => {
    renderHook(() => useCanvasZoomShortcuts());
    let event!: KeyboardEvent;
    act(() => {
      event = dispatchKey('+', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBeCloseTo(1.1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('zooms in on Ctrl+= (the unshifted Plus on US keyboards)', () => {
    renderHook(() => useCanvasZoomShortcuts());
    act(() => {
      dispatchKey('=', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBeCloseTo(1.1);
  });

  it('zooms out by one step on Ctrl+Minus', () => {
    renderHook(() => useCanvasZoomShortcuts());
    let event!: KeyboardEvent;
    act(() => {
      event = dispatchKey('-', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBeCloseTo(0.9);
    expect(event.defaultPrevented).toBe(true);
  });

  it('resets zoom to the default on Ctrl+0', () => {
    act(() => {
      useUIStore.getState().setZoom(1.5);
    });
    renderHook(() => useCanvasZoomShortcuts());
    let event!: KeyboardEvent;
    act(() => {
      event = dispatchKey('0', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_DEFAULT);
    expect(event.defaultPrevented).toBe(true);
  });

  it('also accepts the macOS Meta key as the modifier', () => {
    renderHook(() => useCanvasZoomShortcuts());
    act(() => {
      dispatchKey('+', { metaKey: true });
    });
    expect(useUIStore.getState().zoom).toBeCloseTo(1.1);
  });

  it('ignores key presses without a modifier', () => {
    renderHook(() => useCanvasZoomShortcuts());
    let event!: KeyboardEvent;
    act(() => {
      event = dispatchKey('+');
    });
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_DEFAULT);
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not change zoom while disabled (e.g. during drag/resize)', () => {
    const { rerender } = renderHook(
      ({ disabled }: { disabled: boolean }) =>
        useCanvasZoomShortcuts({ disabled }),
      { initialProps: { disabled: true } },
    );
    act(() => {
      dispatchKey('+', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_DEFAULT);

    // Re-enable and verify the listener reattaches.
    rerender({ disabled: false });
    act(() => {
      dispatchKey('+', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBeCloseTo(1.1);
  });

  it('clamps to the documented 50%-200% range', () => {
    renderHook(() => useCanvasZoomShortcuts());
    act(() => {
      useUIStore.getState().setZoom(2);
      dispatchKey('+', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBe(2);

    act(() => {
      useUIStore.getState().setZoom(0.5);
      dispatchKey('-', { ctrlKey: true });
    });
    expect(useUIStore.getState().zoom).toBe(0.5);
  });
});
