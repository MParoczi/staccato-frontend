import type { Module } from '@/lib/types';

/**
 * Returns the highest `zIndex` currently used by any module on the page,
 * or `-1` when the list is empty so callers can simply add `1` to obtain
 * the next bring-to-front value.
 */
export function getMaxZIndex(modules: readonly Module[]): number {
  let max = -1;
  for (const module of modules) {
    if (module.zIndex > max) {
      max = module.zIndex;
    }
  }
  return max;
}

/**
 * Compute the `zIndex` to apply when the user runs "Bring to Front" on the
 * given module. Returns the current value when the module is already on
 * top so the UI can short-circuit without dispatching a no-op mutation.
 */
export function bringToFront(
  modules: readonly Module[],
  moduleId: string,
): number {
  const target = modules.find((m) => m.id === moduleId);
  if (!target) {
    return 0;
  }
  const others = modules.filter((m) => m.id !== moduleId);
  if (others.length === 0) {
    return target.zIndex;
  }
  const otherMax = getMaxZIndex(others);
  if (target.zIndex > otherMax) {
    return target.zIndex;
  }
  return otherMax + 1;
}

/**
 * Compute the `zIndex` to apply when the user runs "Send to Back". The spec
 * defines this as resetting the value to `0`.
 */
export function sendToBack(): number {
  return 0;
}

/**
 * Returns true when the module already sits at the top of the stacking
 * order, used by menu state to disable the "Bring to Front" entry.
 */
export function isOnTop(modules: readonly Module[], moduleId: string): boolean {
  const target = modules.find((m) => m.id === moduleId);
  if (!target) {
    return false;
  }
  return target.zIndex >= getMaxZIndex(modules);
}

/**
 * Returns true when the module already sits at the bottom of the stacking
 * order, used by menu state to disable the "Send to Back" entry.
 */
export function isOnBottom(
  modules: readonly Module[],
  moduleId: string,
): boolean {
  const target = modules.find((m) => m.id === moduleId);
  if (!target) {
    return false;
  }
  return target.zIndex === 0;
}
