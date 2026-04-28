# Quickstart: Grid Canvas & Module Placement

**Feature**: 008-grid-canvas-module-placement  
**Branch**: `008-grid-canvas-module-placement`

## Prerequisites

- Node.js LTS installed
- Dependencies installed with `pnpm install`
- Backend API available for module endpoints
- A notebook with at least one lesson page to open in `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`
- Existing module styles available for the active notebook (Feature 7 context)

## Development Setup

```bash
# stay in the frontend workspace
cd C:/Users/shift/Desktop/PROJECTS/Staccato/Frontend

# install dependencies (adds @dnd-kit/core if not already present)
pnpm install

# run the app
pnpm run dev
```

## Feature Entry Point

The canvas replaces the current placeholder content in `src/features/notebooks/components/LessonPage.tsx`.

Route flow:

```text
/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId
  -> NotebookLayout (existing shell, zoom state owner)
  -> LessonPage (route container for one lesson page)
  -> GridCanvas (new positioned canvas surface)
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/notebooks/components/GridCanvas.tsx` | Main canvas surface with `DndContext`, bounds, wheel handling, and page rendering |
| `src/features/notebooks/components/CanvasViewportControls.tsx` | Zoom in/out/reset controls |
| `src/features/notebooks/components/ModuleCard.tsx` | Memoized positioned module shell with header drag handle and style application |
| `src/features/notebooks/components/ModuleDragOverlay.tsx` | Semi-transparent snapped drag ghost |
| `src/features/notebooks/components/ModuleResizeHandles.tsx` | Eight resize handles and pointer down wiring |
| `src/features/notebooks/components/AddModulePicker.tsx` | 12-type picker and creation trigger |
| `src/features/notebooks/components/ModuleContextMenu.tsx` | Delete, bring-to-front, send-to-back actions |
| `src/features/notebooks/hooks/usePageModules.ts` | Query hook for `['pages', pageId, 'modules']` |
| `src/features/notebooks/hooks/useModuleLayoutMutations.ts` | Optimistic create/move/resize/delete/layer mutations |
| `src/features/notebooks/hooks/useCanvasInteractions.ts` | Selection, drag preview, resize preview, wheel handling |
| `src/features/notebooks/hooks/useCanvasZoomShortcuts.ts` | Keyboard zoom shortcuts |
| `src/features/notebooks/utils/grid-layout.ts` | Shared grid/zoom conversion helpers |
| `src/features/notebooks/utils/overlap.ts` | `checkOverlap()` |
| `src/features/notebooks/utils/placement.ts` | First-fit placement scan |
| `src/features/notebooks/utils/layout-validation.ts` | Min-size, bounds, overlap validation |
| `src/features/notebooks/utils/z-index.ts` | Layering helpers |

## Files to Modify

| File | Change |
|------|--------|
| `src/api/modules.ts` | Add `updateModuleLayout()` for `PATCH /modules/{id}/layout`; align create/delete helpers to documented contracts |
| `src/features/notebooks/components/LessonPage.tsx` | Replace placeholder with real canvas composition, add module picker, controls, and selection feedback |
| `src/components/common/DottedPaper.tsx` | Support true grid sizing, page-edge border/shadow, and zoom-aware dot spacing or extract those concerns into the new canvas component |
| `src/lib/constants/grid.ts` | Add reusable base grid pixel size and zoom constants if centralized |
| `src/lib/types/modules.ts` | Add `ModuleLayout` / `UpdateModuleLayoutInput` types |
| `src/stores/uiStore.ts` | Persist zoom preference and clamp to 50%-200% in 10% steps |
| `src/i18n/en.json` | Add `notebooks.canvas.*` strings |
| `src/i18n/hu.json` | Add `notebooks.canvas.*` strings |
| `package.json` | Add `@dnd-kit/core` dependency |

## Architecture Overview

```text
LessonPage
├── lesson header / page actions (existing)
├── AddModulePicker
├── GridCanvas
│   ├── CanvasViewportControls
│   ├── page surface (warm dotted paper, fixed page bounds)
│   ├── DndContext
│   │   ├── ModuleCard (memoized × N)
│   │   │   ├── header drag handle
│   │   │   ├── ModuleResizeHandles
│   │   │   └── ModuleContextMenu
│   │   └── ModuleDragOverlay
│   └── toast-only validation / save feedback
└── page number footer (existing)
```

## Data Flow

1. `usePageModules(pageId)` loads modules into `['pages', pageId, 'modules']`
2. `LessonPage` reads notebook `pageSize` and notebook styles, then builds canvas props
3. `GridCanvas` converts page dimensions into pixel size using `gridUnitsToPixels()` and current zoom
4. Clicking a module updates `selectedModuleId` in `uiStore`; clicking empty canvas clears it
5. Dragging the selected module header uses dnd-kit + snapped collision logic to maintain a `DragPreviewState`
6. Resizing uses custom handle pointer tracking and the same grid validation pipeline
7. Valid drag/resize/layer results optimistically update the TanStack Query cache, then persist after 500 ms through `PATCH /modules/{id}/layout`
8. `AddModulePicker` chooses the first valid slot from `firstAvailablePosition()` and optimistically creates the module
9. Delete removes immediately, with restore on error; non-empty modules require confirmation
10. Validation, rollback, and success outcomes surface through localized toasts only
11. `Ctrl+wheel`, zoom buttons, and keyboard shortcuts update the persisted zoom preference without mutating saved layouts

## Testing Commands

```bash
pnpm test
pnpm run lint
```

## Test Priorities

1. **Utility tests**
   - `grid-layout.test.ts`: `gridUnitsToPixels`, `pixelsToGridUnits`, zoom clamping
   - `overlap.test.ts`: edge-touch validity, true overlap rejection, `excludeId` behavior
   - `placement.test.ts`: first-fit placement scan, no-space result
   - `layout-validation.test.ts`: min-size, bounds, and overlap composition
2. **API tests**
   - `src/api/modules.test.ts`: `GET /pages/{id}/modules`, `POST /pages/{id}/modules`, `PATCH /modules/{id}/layout`, `DELETE /modules/{id}`
3. **Hook tests**
   - `useModuleLayoutMutations.test.ts`: optimistic updates, rollback, delayed save semantics
4. **Component tests**
   - `ModuleCard.test.tsx`: selection affordances, memoized rerender expectations
   - `GridCanvas.test.tsx`: drag overlay preview, conflict highlight, wheel zoom behavior
5. **Integration tests**
   - `LessonPage.test.tsx`: load existing modules, select/deselect, add module, drag valid/invalid, resize valid/invalid, delete rollback, z-index actions
6. **Manual performance/latency checks**
   - confirm initial canvas render completes within the `SC-001` target under normal conditions
   - confirm add-module placement completes within the `SC-003` target under normal conditions
   - confirm invalid-action toasts appear within the `SC-005` target under normal conditions

## Manual Validation Checklist

- Confirm the page surface matches `PAGE_SIZE_DIMENSIONS[pageSize]` and shows a subtle page-edge border/shadow
- Confirm modules cannot be dragged or resized beyond page boundaries
- Confirm overlap preview highlights the conflicting module and release rejects invalid placement
- Confirm zoom stays within 50%-200% and keeps selection/handles visually aligned
- Confirm `Ctrl+wheel` zooms while normal wheel scroll pans the canvas vertically
- Confirm new modules auto-place at the first valid slot and show an error when no slot is available
- Confirm drag/resize saves optimistically and rolls back when the backend rejects the request
- Confirm layering changes affect visual order only and never bypass overlap rules

