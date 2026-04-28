import { describe, it, expect, beforeEach } from 'vitest';
import { clampCanvasZoom, useUIStore } from './uiStore';
import {
  GRID_ZOOM_DEFAULT,
  GRID_ZOOM_MAX,
  GRID_ZOOM_MIN,
  GRID_ZOOM_STEP,
} from '@/lib/constants/grid';

describe('clampCanvasZoom', () => {
  it('returns the default zoom when given a non-finite value', () => {
    expect(clampCanvasZoom(Number.NaN)).toBe(GRID_ZOOM_DEFAULT);
    expect(clampCanvasZoom(Number.POSITIVE_INFINITY)).toBe(GRID_ZOOM_DEFAULT);
  });

  it('clamps below the minimum to the minimum', () => {
    expect(clampCanvasZoom(0.1)).toBe(GRID_ZOOM_MIN);
    expect(clampCanvasZoom(0)).toBe(GRID_ZOOM_MIN);
  });

  it('clamps above the maximum to the maximum', () => {
    expect(clampCanvasZoom(5)).toBe(GRID_ZOOM_MAX);
    expect(clampCanvasZoom(2.5)).toBe(GRID_ZOOM_MAX);
  });

  it('snaps values to the configured 10% step', () => {
    expect(clampCanvasZoom(0.74)).toBe(0.7);
    expect(clampCanvasZoom(0.76)).toBe(0.8);
    expect(clampCanvasZoom(1.05)).toBe(1.1);
  });

  it('keeps values that already align to the step grid', () => {
    expect(clampCanvasZoom(0.5)).toBe(0.5);
    expect(clampCanvasZoom(1.0)).toBe(1.0);
    expect(clampCanvasZoom(2.0)).toBe(2.0);
  });
});

describe('useUIStore canvas zoom and selection helpers', () => {
  beforeEach(() => {
    useUIStore.setState({
      zoom: GRID_ZOOM_DEFAULT,
      selectedModuleId: null,
    });
  });

  it('setZoom snaps and clamps within the 50%-200% range', () => {
    useUIStore.getState().setZoom(0.1);
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_MIN);

    useUIStore.getState().setZoom(2.5);
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_MAX);

    useUIStore.getState().setZoom(0.76);
    expect(useUIStore.getState().zoom).toBe(0.8);
  });

  it('zoomIn increments by one step and clamps at the max', () => {
    useUIStore.getState().setZoom(1);
    useUIStore.getState().zoomIn();
    expect(useUIStore.getState().zoom).toBeCloseTo(1 + GRID_ZOOM_STEP, 5);

    useUIStore.getState().setZoom(GRID_ZOOM_MAX);
    useUIStore.getState().zoomIn();
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_MAX);
  });

  it('zoomOut decrements by one step and clamps at the min', () => {
    useUIStore.getState().setZoom(1);
    useUIStore.getState().zoomOut();
    expect(useUIStore.getState().zoom).toBeCloseTo(1 - GRID_ZOOM_STEP, 5);

    useUIStore.getState().setZoom(GRID_ZOOM_MIN);
    useUIStore.getState().zoomOut();
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_MIN);
  });

  it('resetZoom restores the default zoom', () => {
    useUIStore.getState().setZoom(1.4);
    useUIStore.getState().resetZoom();
    expect(useUIStore.getState().zoom).toBe(GRID_ZOOM_DEFAULT);
  });

  it('setSelectedModuleId stores the active module id', () => {
    useUIStore.getState().setSelectedModuleId('module-1');
    expect(useUIStore.getState().selectedModuleId).toBe('module-1');
  });

  it('clearSelectedModule resets the selection to null', () => {
    useUIStore.getState().setSelectedModuleId('module-1');
    useUIStore.getState().clearSelectedModule();
    expect(useUIStore.getState().selectedModuleId).toBeNull();
  });
});
