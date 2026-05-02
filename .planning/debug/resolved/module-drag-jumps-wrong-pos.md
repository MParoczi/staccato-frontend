---
slug: module-drag-jumps-wrong-pos
status: resolved
trigger: "Module drag-and-drop placement is broken: grabbing a module in the top-left corner and moving it slightly causes it to jump to incorrect positions on screen. Drop-target validation appears inverted — valid grid cells render as invalid (collision/red), and invalid cells (e.g. far outside the page) render as valid (green/empty preview)."
created: 2026-05-02
updated: 2026-05-02
---

# Debug Session: module-drag-jumps-wrong-pos

## Symptoms

- **Expected behavior:** When dragging a module on the notebook grid canvas, the drag preview should follow the cursor smoothly and snap to the grid cell directly under the cursor. Drop targets should highlight green when the cell is empty/valid and red when the cell would collide with another module or fall outside the page.
- **Actual behavior:**
  1. Grabbing a module in the top-left corner of the page and moving the cursor a tiny amount causes the drag preview to jump far away from the cursor (large positional offset).
  2. The preview snaps roughly to where the cursor *is*, but the underlying validity check is inverted: the snap target visually shows red/invalid in cells that are actually empty (image 4 — preview rendered at top-left of the page, valid empty area, but overlaps with the original module's home cell?), and shows green/valid in places far outside the page (images 2 & 3 — preview floating above the page, or off the right of the page entirely).
- **Error messages:** None reported (visual-only symptom).
- **Timeline:** Surfaced during manual UAT on 2026-05-02 against the current build of the notebook grid canvas (Phase 008 — grid-canvas-module-placement).
- **Reproduction:**
  1. Open a notebook → lesson → page that already has at least one module placed in the top-left.
  2. Mouse-down on that module's drag handle.
  3. Move the cursor by ~1px to begin dragging.
  4. Observe the drag preview position vs cursor, and observe drop-target color/validity in different regions of and outside the page.

## Visual Evidence (from user)

- Image 1: Initial state — Theory module placed at top-left of page (cells ~col 0–4, row 0–3). Body "asd".
- Image 2: After tiny drag start — drag preview rendered as a small green-tinted rectangle floating in the upper-middle of the page (~col 11–17, row 2–5). The original module slot is now empty. Cursor presumably near top-left where grab started; preview is wildly offset.
- Image 3: Different drag position — preview rendered as a green rectangle entirely **outside** the right edge of the page canvas (around the right-hand empty area), yet still rendered in the green/valid color. Should be red/invalid.
- Image 4: Preview rendered as a **red/invalid** rectangle at roughly col 4–10, row 9–13 — an empty area of the page that should be a valid drop target.

## Likely Subsystems Involved

- `src/features/notebooks/` — module drag/drop, grid canvas, placement logic.
- Pointer→grid-cell coordinate transform (likely uses `getBoundingClientRect`, `clientX/clientY`, page zoom, scroll offset).
- Collision / overlap detection against existing module footprints on the active page.
- Drag handle pointer-down offset (`pointerOffset` within the module being dragged).

## Hypotheses (initial — to validate)

1. **Pointer offset not subtracted on drag start.** The drag preview's top-left is being placed at `cursor` instead of `cursor - grabOffsetWithinModule`. Grabbing in the top-left of a module that's at the top-left of the page should yield grabOffset ≈ (0,0), so this alone doesn't explain the jump — unless the offset is being *added* (doubled) or the page-relative origin is wrong.
2. **Coordinate space mismatch.** Drag math mixes viewport coords (clientX/Y), page-element-relative coords, and grid-cell coords. The page is offset from the viewport by the sidebar (~280px) and top toolbar (~40px); failing to subtract the page's `getBoundingClientRect().left/top` would shift the preview by exactly that amount → matches the "preview appears far from cursor" symptom.
3. **Zoom factor applied twice or not at all.** Notebook supports zoom (currently 100%). If the hit-test divides by zoom but the render position multiplies, or vice-versa, the preview would land in the wrong cell. At 100% zoom this should be a no-op, so less likely unless zoom default ≠ 1.
4. **Inverted collision predicate.** `isValidDrop` may return the negation of what it should — e.g. returning `true` when the cell *is* occupied. This would explain the green-where-it-should-be-red and red-where-it-should-be-green inversion in images 3 & 4.
5. **Self-collision with origin slot.** When dragging a module, its own current footprint isn't excluded from the collision check, so the dragged module always "collides with itself" → red. This matches image 4 if the preview overlaps the module's home cell. But images 2 & 3 show green in places that shouldn't be valid, so this is at most half the story.
6. **Page-bounds check missing or inverted.** No bounds clamp on drop target → preview can render outside the page (images 2 & 3) without being marked invalid.

## Current Focus

- hypothesis: Coordinate transform from pointer event to grid cell is incorrect — likely missing subtraction of the page element's bounding rect origin and/or double-applying the grab offset, combined with an inverted/missing valid-drop predicate (self-collision not excluded + page-bounds not enforced).
- test: Read the drag handler implementation in `src/features/notebooks/` and trace the math from `onPointerDown` → `onPointerMove` → preview render coords → `isValidDrop`.
- expecting: Find a `clientX/clientY` used directly without subtracting page rect, OR an `isValidDrop` that includes the dragged module's own cells in occupancy, OR both.
- next_action: Locate grid-canvas drag/drop source files and read the coordinate-math + validity-predicate code paths.
- reasoning_checkpoint: (pending — set after first read pass)
- tdd_checkpoint: (pending)

## Evidence

(none yet — investigation starting)

## Eliminated

(none yet)

## Resolution

- **root_cause:** `<DragOverlay>` from `@dnd-kit/core` positions the visual
  drag ghost using a pixel-accurate cursor delta
  (`transform: translate3d(rect.left + delta.x, rect.top + delta.y, 0)`),
  while `useCanvasInteractions.handleDragMove` rounds the same delta to
  whole grid units via `pixelsToGridUnits` for the validity check and the
  eventual commit. With no snap modifier on the `DndContext`, the two
  diverge by up to half a grid unit on each axis. Near a snap boundary or
  the page edge that divergence is enough to:
    - Push the snapped target *out of bounds* while the visual ghost is
      still inside the page → ghost rendered green where it visually
      "looks invalid" (image 3 — ghost past the right edge but valid).
    - Push the snapped target *back into the origin cell* (or onto the
      page edge) while the visual ghost is in an empty area → ghost
      rendered red where it visually "looks valid" (image 4 — red ghost
      in clear empty space).
    - Make the ghost feel like it "jumps" at drag start because the
      pixel-accurate visual moves smoothly while the snap target steps
      in 20 px increments at zoom 1 (image 2).
  No bug in the validity predicate, page-bounds check, or self-overlap
  exclusion — they were operating on a `previewLayout` that no longer
  matched what the user was seeing on screen.

- **fix:** Add a snap-to-grid `Modifier` to the `DndContext`:
    - New `src/features/notebooks/utils/snap-to-grid-modifier.ts` exports
      `createSnapToGridModifier(zoom)` which rounds `transform.x/y` to
      multiples of `GRID_BASE_UNIT_PX * zoom`, using the same
      `Math.round` rule as `pixelsToGridUnits` so visual and validity
      stay locked.
    - `GridCanvas.tsx` builds a memoized `[createSnapToGridModifier(zoom)]`
      array (re-created when zoom changes) and passes it to
      `<DndContext modifiers={...}>`. The visual ghost now steps in
      whole grid units, and the cell under the ghost is always the cell
      the validator just classified, eliminating the visual / validity
      inversion.
    - Added `snap-to-grid-modifier.test.ts` covering zoom=1, zoom=2,
      zero-grid-size guard, and `scaleX/scaleY` preservation.

- **verification:**
    - `pnpm vitest run src/features/notebooks/components/GridCanvas.test.tsx src/features/notebooks/hooks/useCanvasInteractions.test.tsx`
      → 21/21 pass (no regressions in the existing canvas suite).
    - `pnpm vitest run src/features/notebooks/utils/snap-to-grid-modifier.test.ts`
      → 4/4 pass.
    - `pnpm run lint` → 0 errors. (Single pre-existing warning in
      `.github/get-shit-done/bin/lib/state.cjs`, unrelated to this fix.)

- **files_changed:**
    - `src/features/notebooks/utils/snap-to-grid-modifier.ts` (new)
    - `src/features/notebooks/utils/snap-to-grid-modifier.test.ts` (new)
    - `src/features/notebooks/components/GridCanvas.tsx` (import +
      memoized modifier array + `<DndContext modifiers={...}>`)

## Cycle 2 — snap-modifier alone was insufficient

User retest 2026-05-02: "It behaves exactly the same. The ghost of the
module is totally disconnected from the cursor."

- **Cycle-1 hypothesis miss:** the snap divergence (≤ ½ grid unit) was
  too small to explain "totally disconnected from cursor". The actual
  offset is much larger and constant per drag.

- **Cycle-2 evidence:** searched for any CSS transform on a parent of
  the canvas. Found `src/routes/notebook-layout.tsx` line 131:
  ```tsx
  <div className="w-full" style={{
    transform: `scale(${zoom})`,
    transformOrigin: 'top center',
    width: `${100 / zoom}%`,
  }}>
    <Outlet />
  </div>
  ```
  The `<Outlet />` renders `LessonPage` → `GridCanvas` → `<DndContext>`
  → `<DragOverlay>`. dnd-kit's `<DragOverlay>` uses `position: fixed`
  internally. **A CSS `transform` on an ancestor establishes a new
  containing block for `position: fixed` descendants** (CSS
  Transforms 1, §6). Even at zoom=1, `transform: scale(1)` creates the
  containing block, so the overlay's `transform: translate3d(rect.left
  + delta.x, rect.top + delta.y, 0)` is now interpreted relative to
  the transformed div instead of the viewport — offsetting the ghost
  by the transformed div's viewport position (and at zoom !== 1 also
  visually re-scaling the already-zoom-scaled `DottedPaper` content,
  i.e. double-scaling). The `<DragOverlay>` was effectively trapped
  inside the page-canvas coordinate space instead of being a
  viewport-anchored ghost.

- **Cycle-2 fix:** portal the `<DragOverlay>` to `document.body` via
  `createPortal` so it lives outside the transformed ancestor and its
  `position: fixed` resolves against the viewport again. Implemented
  in `GridCanvas.tsx`:
  ```tsx
  {createPortal(
    <DragOverlay dropAnimation={null}>
      {dragPreview && activeModule ? (
        <ModuleDragOverlay … />
      ) : null}
    </DragOverlay>,
    document.body,
  )}
  ```
  The earlier snap-to-grid modifier from Cycle 1 is retained — together
  they give a viewport-anchored ghost that snaps in whole grid units
  in lock-step with the validity check.

- **Cycle-2 verification:**
    - `pnpm vitest run` for `GridCanvas.test.tsx`,
      `useCanvasInteractions.test.tsx`,
      `snap-to-grid-modifier.test.ts` → 25/25 pass.
    - `pnpm run lint` → 0 errors (pre-existing GSD-tooling warning
      only).

- **Known related defect (out-of-scope for this session):** the canvas
  is *double-scaled* at zoom !== 1 — `DottedPaper` already multiplies
  page width by `zoom`, and the parent layout *also* applies
  `transform: scale(zoom)`. Visual size = `840 * zoom * zoom`. At the
  user's reported zoom = 1.0 this is invisible (1 × 1 = 1) but the
  zoom-shortcut path (50 %–200 %) will mis-render and the
  `pixelsToGridUnits(delta, zoom)` math will mis-snap by a factor of
  `zoom`. Recommended follow-up: either pass a constant `zoom = 1` to
  `DottedPaper` / `ModuleCard` / drag math (let the parent transform do
  all visual scaling), or remove the parent transform and keep only
  the internal scaling. Tracked here for the user to file when they
  hit it; explicitly NOT changed in this fix to keep the cycle-2 patch
  minimal and avoid touching the `notebook-layout.test.tsx`
  cross-browser-zoom assertion.

- **Cycle-2 files_changed:**
    - `src/features/notebooks/components/GridCanvas.tsx` (added
      `createPortal` import; wrapped `<DragOverlay>` in `createPortal(
      …, document.body)`).

