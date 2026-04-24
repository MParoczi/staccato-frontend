import type { BuildingBlockType, ModuleType } from './common';

export interface BuildingBlock {
  type: BuildingBlockType;
  [key: string]: unknown;
}

export interface Module {
  id: string;
  lessonPageId: string;
  moduleType: ModuleType;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
  content: BuildingBlock[];
}

/**
 * Pure layout payload extracted from a module for drag/resize/add/layer
 * operations. Used as the canonical shape for optimistic updates and
 * overlay previews.
 */
export interface ModuleLayout {
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
}

/**
 * Typed payload sent to `PATCH /modules/{moduleId}/layout`. All fields are
 * required and must already be snapped to whole grid units.
 */
export interface UpdateModuleLayoutInput {
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
}

/**
 * Payload sent to `POST /pages/{pageId}/modules` when creating a module
 * via the first-fit placement helper.
 */
export interface CreateModuleInput {
  moduleType: ModuleType;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
}

export type ResizeHandle =
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'nw';

/**
 * Transient state for an in-progress drag and overlay rendering.
 */
export interface DragPreviewState {
  activeModuleId: string;
  originLayout: ModuleLayout;
  previewLayout: ModuleLayout;
  conflictingModuleId: string | null;
  isValid: boolean;
}

/**
 * Transient state owned by custom resize handle pointer logic.
 */
export interface ResizeSession {
  moduleId: string;
  handle: ResizeHandle;
  startPointerX: number;
  startPointerY: number;
  startLayout: ModuleLayout;
  previewLayout: ModuleLayout;
  conflictingModuleId: string | null;
}
