# Research: Grid Canvas & Module Placement

**Feature**: 008-grid-canvas-module-placement  
**Date**: 2026-04-22

## R1: Drag Engine and Snapped Preview

**Decision**: Use `@dnd-kit/core` only for drag interactions. Each module becomes a `useDraggable`, the canvas page surface becomes a `useDroppable`, and the canvas uses a custom collision detection strategy that converts candidate drag coordinates into snapped grid coordinates before evaluating the drop target. A separate `DragOverlay` renders the semi-transparent ghost module at the snapped position.

**Rationale**: This matches the requested architecture, keeps the dependency footprint inside the constitution-approved stack, and avoids coupling drag motion to full-canvas rerenders. `DragOverlay` lets the live dragged preview move independently while memoized module cards remain stable.

**Alternatives considered**:
- **Native pointer events only**: More manual bookkeeping for pointer capture, accessibility, and drag lifecycle state than needed.
- **`@dnd-kit/sortable`**: The canvas is absolute-positioned, not list-based, so sortable abstractions are the wrong fit.
- **React DnD**: Adds an unnecessary alternative drag framework outside the approved stack.

**Implementation details**:
- Use draggable metadata containing module id and original `ModuleLayout`.
- Compute overlay position from snapped grid coordinates, not raw pixel transform.
- Reject out-of-bounds drops before mutation dispatch.

## R2: Resize Interaction Model

**Decision**: Implement custom resize handles as eight small divs on the selected module (four corners, four edges). On `mousedown`, start a lightweight resize session, track window-level pointer movement, convert deltas through `pixelsToGridUnits`, and derive a candidate `ModuleLayout` based on the active handle.

**Rationale**: dnd-kit does not provide native resize behavior, and the requested custom approach gives full control over grid snapping, min-size enforcement, and page-bound clipping without introducing a resize library.

**Alternatives considered**:
- **A third-party resize library**: Not required for this feature and would duplicate logic already needed for grid snapping and overlap checks.
- **Reusing dnd-kit for resize**: Overcomplicates resize semantics because edge/corner drag math differs from whole-module drag behavior.

**Implementation details**:
- Maintain a transient `ResizeSession` object with starting pointer position, starting layout, and active handle.
- Edge handles change one axis; corner handles change both axes.
- Candidate layouts pass through min-size, bounds, and overlap validation before preview/commit.

## R3: Grid Measurement and Zoom Math

**Decision**: Centralize canvas math in a shared utility with `gridUnitsToPixels(units, zoom)` and `pixelsToGridUnits(px, zoom) = Math.round(px / gridUnitsToPixels(1, zoom))`. All drag, resize, overlay, and wheel-interaction calculations must go through these helpers.

**Rationale**: The spec requires layout semantics to remain stable across zoom levels. A single conversion layer prevents drift between rendering math and interaction math.

**Alternatives considered**:
- **Inline per-component math**: High risk of inconsistent rounding and off-by-one layout bugs.
- **CSS-only scaling with `zoom`/`transform` and no logical conversion utility**: Does not provide reliable snapped layout coordinates for persistence.

**Implementation details**:
- Keep one base pixel size for one grid unit in `src/lib/constants/grid.ts`.
- Use the same helper for page width/height, dot spacing, module frames, overlay coordinates, and resize delta rounding.
- Clamp zoom to 0.5-2.0 in 0.1 increments even if the store currently allows a wider raw range.

## R4: Overlap Detection and Layout Validation

**Decision**: Use a pure `checkOverlap(movingModule, allModules, excludeId?) => conflictingModule | null` helper with the axis-aligned rectangle test from the spec, plus `isWithinPageBounds()` and `meetsMinimumSize()` helpers for a single validation pipeline.

**Rationale**: Typical page density is only 10-20 modules, so a simple `O(n)` loop is fast, easy to test, and sufficient. Shared validation utilities keep drag, resize, add-module, and layer operations consistent.

**Alternatives considered**:
- **Spatial index / quadtree**: Unnecessary complexity for the page sizes and module counts in scope.
- **Rely on backend validation only**: Fails the spec's requirement for immediate conflict previews and fast user feedback.

**Implementation details**:
- Overlap is invalid only when rectangles intersect; touching edges/corners remain valid.
- The validator returns both a boolean validity result and the conflicting module when present so the UI can highlight it.
- Page-bound checks allow exact boundary contact but reject any overflow.

## R5: Add Module Placement Strategy

**Decision**: Use MVP option (a): after module type selection, auto-place the new module at the first available valid position that fits the type's minimum size. Scan the page grid top-to-bottom, left-to-right.

**Rationale**: This is explicitly required by the current clarification and keeps Feature 8 focused on canvas layout rather than click-to-place interaction design.

**Alternatives considered**:
- **Click-to-place on canvas**: Deferred by request; adds extra interaction states and empty-space hit testing.
- **Center-of-viewport placement**: Faster to implement but does not guarantee a valid, non-overlapping starting position.

**Implementation details**:
- Use `MODULE_MIN_SIZES[moduleType]` for initial width/height.
- Stop at the first valid in-bounds slot.
- If no slot exists, abort creation and show a localized error.

## R6: Optimistic Layout Persistence

**Decision**: Wrap layout-changing operations in TanStack Query mutations that optimistically update `['pages', pageId, 'modules']`, debounce the layout save by 500 ms after drag/resize completion, call `PATCH /modules/{id}/layout`, and restore the previous cache snapshot on error.

**Rationale**: This follows both the feature spec and constitution Principle II. Users get immediate visual confirmation while still reconciling with the backend source of truth.

**Alternatives considered**:
- **Wait for server before moving UI**: Too sluggish for drag/resize workflows.
- **Update local component state only**: Would duplicate server state and violate the constitution.
- **Patch on every drag frame**: Wasteful and explicitly rejected by the debounce requirement.

**Implementation details**:
- Add a dedicated `updateModuleLayout(moduleId, layout)` helper in `src/api/modules.ts` targeting `PATCH /modules/{id}/layout`.
- Use `onMutate` to snapshot and set the cache, `onError` to rollback, and `onSettled`/success reconciliation to hydrate the saved module returned by the server.
- Reuse the same mutation helper for z-index changes when only `zIndex` changes.

## R7: Canvas Viewport Controls

**Decision**: The canvas container owns wheel behavior: `Ctrl+wheel` changes zoom in 10% increments within 50%-200%; plain wheel scroll pans vertically within the scroll container. Keyboard shortcuts remain `Ctrl++`, `Ctrl+-`, and `Ctrl+0`.

**Rationale**: This matches the spec and the requested architecture while keeping the page surface readable at different scales. Handling wheel events on the canvas container avoids app-wide scroll interception.

**Alternatives considered**:
- **Only toolbar zoom buttons**: Does not satisfy the requested wheel interaction.
- **Browser-native zoom**: Would distort the whole app shell instead of the notebook canvas.

**Implementation details**:
- Persist zoom as part of the existing UI preference state in `uiStore`.
- Keep the selected module selected while zoom changes.
- Use a dedicated control cluster anchored inside the canvas viewport for zoom in/out/reset.

## R8: Rendering and Memoization Strategy

**Decision**: Render each positioned module as a `React.memo` component keyed by module id, keep the drag overlay separate from the real module list, and scope this feature to lightweight module shells only. Content-heavy rendering stays lazy/virtualized work for Feature 9.

**Rationale**: The canvas is the main performance hotspot in the constitution. Separating overlay rendering from static modules reduces drag-frame churn.

**Alternatives considered**:
- **Single large canvas component rendering everything on every pointer move**: Higher rerender cost and poorer drag responsiveness.
- **Premature virtualization for module frames**: Not necessary for 10-20 positioned modules; virtualization is more relevant to heavy module body content.

**Implementation details**:
- Stabilize callbacks/derived props passed to `ModuleCard`.
- Limit rerenders to selection changes, module data changes, or explicit conflict-state changes.
- Memoize style lookup by module type.

## R9: Backend Contract Alignment

**Decision**: Treat the feature contract as authoritative: `GET /pages/{pageId}/modules`, `POST /pages/{pageId}/modules`, `PATCH /modules/{moduleId}/layout`, and `DELETE /modules/{moduleId}`. The existing generic `updateModule()` helper in `src/api/modules.ts` should not be reused for layout persistence unless it is reworked to the `/layout` endpoint.

**Rationale**: The spec explicitly calls out a dedicated layout endpoint and server reconciliation behavior. Making layout persistence explicit keeps content updates and layout updates decoupled.

**Alternatives considered**:
- **Keep using `PATCH /modules/{id}` for layout**: Conflicts with the documented contract for this feature.
- **Create a generic mutation wrapper with mixed content/layout payloads**: Blurs API intent and complicates testing.

**Implementation details**:
- Add a specific `UpdateModuleLayoutInput` type.
- Expect the response to return the saved module including authoritative `zIndex` and layout values.
- Preserve server error messages for rollback feedback.

