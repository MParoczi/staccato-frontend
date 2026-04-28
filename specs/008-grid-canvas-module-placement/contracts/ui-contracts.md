# UI Contracts: Grid Canvas & Module Placement

**Feature**: 008-grid-canvas-module-placement  
**Date**: 2026-04-22

## Canvas Surface Contract

- The lesson page renders as a warm off-white dotted-paper canvas sized from `PAGE_SIZE_DIMENSIONS[pageSize]`.
- A subtle border or shadow marks the page edges.
- Modules cannot be dragged or resized beyond the visible page boundary.
- Dot spacing, page size, modules, outlines, and handles scale together with zoom.

## Selection Contract

- Clicking a module selects it.
- Clicking empty canvas space clears selection.
- The selected module shows:
  - earthy selection outline
  - header drag handle area
  - eight resize handles
  - context menu entry point for delete/layer actions

## Drag Contract

- Only the selected module's header area is draggable.
- dnd-kit is the drag engine.
- During drag:
  - a snapped `DragOverlay` ghost is visible
  - the real module list remains rendered separately
  - invalid previews mark the conflicting module in muted terracotta
- On release:
  - valid result updates immediately and persists after 500 ms
  - invalid result reverts to the original layout and shows an error

## Resize Contract

- Resize handles exist at all four corners and four edge midpoints.
- Handle drag uses custom pointer tracking, not a resize library.
- Preview layout always snaps through `pixelsToGridUnits()`.
- Resize is rejected when it would:
  - go below module minimum size
  - leave page bounds
  - overlap another module

## Add Module Contract

- The Add Module control opens a 12-type picker with labeled icons.
- Selecting a type immediately attempts creation.
- Initial placement uses the first available valid position, scanning top-to-bottom then left-to-right.
- Click-to-place is out of scope for this feature.
- If no valid slot exists, creation is blocked and a user-facing error is shown.

## Delete and Layering Contract

- Delete is available only for the selected module.
- Empty modules delete immediately.
- Non-empty modules require confirmation.
- Bring to Front sets `zIndex` to one above the current maximum.
- Send to Back sets `zIndex` to `0`.
- Layering changes affect visual order only; overlap rules still apply.

## Zoom and Pan Contract

- Zoom controls provide zoom in, zoom out, and reset.
- Keyboard shortcuts: `Ctrl++`, `Ctrl+-`, `Ctrl+0`.
- Wheel behavior:
  - `Ctrl+wheel` => zoom in 10% steps within 50%-200%
  - plain scroll => vertical pan in the canvas container
- Changing zoom must not alter saved module coordinates.

## Feedback Contract

- Client-side validation errors appear before a network request when possible.
- Server-provided validation messages are surfaced directly on rollback.
- Success, validation, and rollback feedback are shown through localized toast notifications only, using Lucide icons where icons are present.

## Performance Contract

- `ModuleCard` is memoized.
- Non-dragged modules should not rerender on every drag frame.
- The overlay is rendered separately from the actual module list.
- Heavy module content rendering is deferred to Feature 9 and should be lazy/virtualized there.

