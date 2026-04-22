# Data Model: Grid Canvas & Module Placement

**Feature**: 008-grid-canvas-module-placement  
**Date**: 2026-04-22

## Entities

### Module (existing — `src/lib/types/modules.ts`)

Represents one positioned module on a lesson page.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | `string` | UUID, server-assigned | Primary identifier |
| lessonPageId | `string` | UUID | FK to the lesson page |
| moduleType | `ModuleType` | One of 12 values | Determines min size and visual style |
| gridX | `number` | Integer, `>= 0` | Top-left grid column |
| gridY | `number` | Integer, `>= 0` | Top-left grid row |
| gridWidth | `number` | Integer, `>= minWidth(moduleType)` | Width in grid units |
| gridHeight | `number` | Integer, `>= minHeight(moduleType)` | Height in grid units |
| zIndex | `number` | Integer, `>= 0` | Visual stacking only |
| content | `BuildingBlock[]` | Existing backend payload | Used only for delete-confirmation emptiness checks in this feature |

**Validation rules**:
- Layout must remain within the active page dimensions.
- Layout must satisfy `MODULE_MIN_SIZES[moduleType]`.
- Layout must not overlap any sibling module on the same page.
- Edge or corner contact between modules is valid; intersecting rectangles are not.

### ModuleLayout (new shared helper type)

Pure layout payload extracted from a module for drag/resize/add/layer operations.

```typescript
interface ModuleLayout {
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
}
```

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| gridX | `number` | Integer, `>= 0` | Snapped top-left X |
| gridY | `number` | Integer, `>= 0` | Snapped top-left Y |
| gridWidth | `number` | Integer, `>= 1` | Candidate width |
| gridHeight | `number` | Integer, `>= 1` | Candidate height |
| zIndex | `number` | Integer, `>= 0` | Layering |

**Notes**:
- Used for optimistic updates and overlay previews.
- `Module` = persisted entity; `ModuleLayout` = reusable view/update shape.

### UpdateModuleLayoutInput (new — `src/lib/types/modules.ts`)

Typed payload sent to `PATCH /modules/{id}/layout`.

```typescript
interface UpdateModuleLayoutInput {
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
}
```

**Validation rules**:
- All fields required for layout persistence.
- Values must already be snapped to whole grid units before request dispatch.
- Client runs bounds/min-size/overlap validation before the mutation is allowed.

### PageCanvasViewModel (new feature-local type)

Aggregates page geometry, styles, viewport state, and current modules for rendering.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| pageId | `string` | Required | Active lesson page |
| pageSize | `PageSize` | One of `A4/A5/A6/B5/B6` | Comes from notebook detail |
| gridWidth | `number` | From `PAGE_SIZE_DIMENSIONS` | E.g. A4 = 42 |
| gridHeight | `number` | From `PAGE_SIZE_DIMENSIONS` | E.g. A4 = 59 |
| zoom | `number` | `0.5` to `2.0` in `0.1` increments | Persisted UI preference |
| selectedModuleId | `string \| null` | Optional | Current selection |
| modules | `Module[]` | Ordered for rendering | Same-page modules only |
| stylesByType | `Record<ModuleType, NotebookModuleStyle>` | Complete 12-type map | Used by `ModuleCard` rendering |

### DragPreviewState (new feature-local type)

Transient state for a drag-in-progress and overlay rendering.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| activeModuleId | `string` | Required while dragging | Module being moved |
| originLayout | `ModuleLayout` | Required | Saved layout before drag |
| previewLayout | `ModuleLayout` | Required | Snapped candidate layout |
| conflictingModuleId | `string \| null` | Optional | Module highlighted in conflict state |
| isValid | `boolean` | Derived | True only when bounds/min-size/overlap checks pass |

### ResizeSession (new feature-local type)

Transient state owned by custom resize handle logic.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| moduleId | `string` | Required | Module being resized |
| handle | `'n' \| 'ne' \| 'e' \| 'se' \| 's' \| 'sw' \| 'w' \| 'nw'` | One of 8 handles | Determines resize math |
| startPointerX | `number` | Pixels | Initial pointer position |
| startPointerY | `number` | Pixels | Initial pointer position |
| startLayout | `ModuleLayout` | Required | Layout at resize start |
| previewLayout | `ModuleLayout` | Required | Current snapped candidate |
| conflictingModuleId | `string \| null` | Optional | Highlight target |

### ModuleCreationRequest (existing API payload, clarified for this feature)

Payload for `POST /pages/{pageId}/modules`.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| moduleType | `ModuleType` | Required | Selected in picker |
| gridX | `number` | Integer, valid first-fit slot | Auto-computed by client |
| gridY | `number` | Integer, valid first-fit slot | Auto-computed by client |
| gridWidth | `number` | Integer, type minimum width | From `MODULE_MIN_SIZES` |
| gridHeight | `number` | Integer, type minimum height | From `MODULE_MIN_SIZES` |

**Validation rules**:
- No click-to-place state in this feature.
- Creation is rejected when no valid starting position exists.
- Backend validation codes to preserve in UI: `MODULE_OVERLAP`, `MODULE_OUT_OF_BOUNDS`, `MODULE_TOO_SMALL`, `DUPLICATE_TITLE_MODULE`.

### ZoomPreference (existing store state, refined for this feature)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| zoom | `number` | `0.5` to `2.0`, step `0.1` | Persisted in UI store |

**Behavior rules**:
- Reset command sets zoom to `1.0`.
- `Ctrl+wheel`, `Ctrl++`, and `Ctrl+-` adjust zoom within bounds.
- Zoom changes do not mutate saved module layouts.

## Relationships

```text
Notebook (1) ──── has ────> (1) PageCanvasViewModel
PageCanvasViewModel (1) ──── renders ────> (0..20 typical) Module
Module (1) ──── has ────> (1) ModuleLayout
ModuleType (1) ──── maps to ────> (1) NotebookModuleStyle
ModuleType (1) ──── maps to ────> (1) MODULE_MIN_SIZES entry

DragPreviewState / ResizeSession
   └── derive candidate ModuleLayout values from one Module
```

## Validation Pipeline

For drag, resize, add-module, and layer mutations:

1. Build a candidate `ModuleLayout`
2. Snap all pixel deltas through `pixelsToGridUnits()`
3. Enforce minimum size from `MODULE_MIN_SIZES[moduleType]`
4. Enforce page bounds from `PAGE_SIZE_DIMENSIONS[pageSize]`
5. Run `checkOverlap(candidate, allModules, excludeId)`
6. If valid, update TanStack Query cache optimistically
7. Persist with the appropriate API call
8. On error, restore the previous cached module list and surface the server message

## State Transitions

### Module Selection and Canvas Interaction

```text
[No Selection] --(click module)--> [Selected]
[Selected] --(click empty canvas)--> [No Selection]
[Selected] --(start drag from header)--> [Dragging Preview]
[Selected] --(mousedown on handle)--> [Resize Preview]
[Dragging Preview] --(valid release)--> [Optimistic Saving]
[Dragging Preview] --(invalid release)--> [Selected] (revert to origin)
[Resize Preview] --(valid release)--> [Optimistic Saving]
[Resize Preview] --(invalid release)--> [Selected] (revert to origin)
[Optimistic Saving] --(server success)--> [Selected]
[Optimistic Saving] --(server error)--> [Selected] (rollback + error feedback)
```

### Module Creation

```text
[Picker Closed] --(open add-module)--> [Picker Open]
[Picker Open] --(choose type + slot found)--> [Optimistic Creating]
[Picker Open] --(choose type + no slot found)--> [Picker Open] (show no-space error)
[Optimistic Creating] --(server success)--> [Selected] (new module selected)
[Optimistic Creating] --(server error)--> [Picker Open/Selected] (rollback + error feedback)
```

### Module Deletion and Layering

```text
[Selected] --(delete empty module)--> [Optimistic Deleting]
[Selected] --(delete non-empty module)--> [Confirm Delete]
[Confirm Delete] --(confirm)--> [Optimistic Deleting]
[Confirm Delete] --(cancel)--> [Selected]
[Optimistic Deleting] --(server success)--> [No Selection]
[Optimistic Deleting] --(server error)--> [Selected] (module restored)

[Selected] --(bring to front/send to back)--> [Optimistic Saving]
```

## Query Key Mapping

| Data | Query Key | staleTime | Notes |
|------|-----------|-----------|-------|
| Page modules | `['pages', pageId, 'modules']` | 0 | Refetch on focus; source of truth for create/move/resize/delete/layer actions |
| Notebook detail | `['notebooks', notebookId]` | 0 | Provides `pageSize` and styles source linkage |
| Notebook styles | `['notebooks', notebookId, 'styles']` | 0 | Used to build `stylesByType` for rendering |

## Derived Utility Contracts

```typescript
function gridUnitsToPixels(units: number, zoom: number): number;
function pixelsToGridUnits(px: number, zoom: number): number;
function checkOverlap(
  movingModule: Pick<Module, 'gridX' | 'gridY' | 'gridWidth' | 'gridHeight' | 'id'>,
  allModules: readonly Module[],
  excludeId?: string,
): Module | null;
function firstAvailablePosition(
  pageSize: PageSize,
  moduleType: ModuleType,
  allModules: readonly Module[],
): { gridX: number; gridY: number } | null;
```

