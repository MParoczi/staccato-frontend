import type {
  CreateModuleInput,
  Module,
  UpdateModuleLayoutInput,
  BuildingBlock,
} from '@/lib/types';
import { apiClient } from './client';

/**
 * Load all modules for a lesson page.
 *
 * `GET /pages/{pageId}/modules` returns the array of `Module` records that
 * belong to the page in the order the backend supplies them (typically by
 * `zIndex` ascending). The result feeds the `['pages', pageId, 'modules']`
 * TanStack Query cache.
 */
export async function getModules(pageId: string): Promise<Module[]> {
  const res = await apiClient.get<Module[]>(`/pages/${pageId}/modules`);
  return res.data;
}

/**
 * Create a new module on a lesson page.
 *
 * `POST /pages/{pageId}/modules` expects a snapped, in-bounds, non-overlapping
 * layout payload chosen by the client (typically via `firstAvailablePosition`).
 * The server returns the persisted `Module` including its assigned `id` and
 * `zIndex`.
 */
export async function createModule(
  pageId: string,
  data: CreateModuleInput,
): Promise<Module> {
  const res = await apiClient.post<Module>(`/pages/${pageId}/modules`, data);
  return res.data;
}

/**
 * Persist a module move, resize, or z-index change.
 *
 * `PATCH /modules/{moduleId}/layout` is dedicated to layout updates and is
 * invoked after drag/resize/layer optimistic mutations resolve. The full
 * `UpdateModuleLayoutInput` payload is required and must already be snapped
 * to whole grid units. The server returns the saved `Module` for cache
 * reconciliation.
 */
export async function updateModuleLayout(
  moduleId: string,
  data: UpdateModuleLayoutInput,
): Promise<Module> {
  const res = await apiClient.patch<Module>(
    `/modules/${moduleId}/layout`,
    data,
  );
  return res.data;
}

/**
 * Update non-layout content of a module via `PATCH /modules/{moduleId}`.
 *
 * Layout fields are accepted by the backend for backward compatibility but
 * the canvas feature must use `updateModuleLayout` for layout persistence so
 * content and layout updates remain decoupled.
 */
export async function updateModule(
  moduleId: string,
  data: Partial<{
    gridX: number;
    gridY: number;
    gridWidth: number;
    gridHeight: number;
    zIndex: number;
    content: BuildingBlock[];
  }>,
): Promise<Module> {
  const res = await apiClient.patch<Module>(`/modules/${moduleId}`, data);
  return res.data;
}

/**
 * Delete a module from its lesson page.
 *
 * `DELETE /modules/{moduleId}` returns `204 No Content`. Optimistic removal
 * from the `['pages', pageId, 'modules']` cache happens on the caller; this
 * helper only owns the network request.
 */
export async function deleteModule(moduleId: string): Promise<void> {
  await apiClient.delete(`/modules/${moduleId}`);
}
