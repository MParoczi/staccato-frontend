# Requirements: v0.6 — Canvas & Module Placement

**Milestone:** v0.6 Canvas & Module Placement
**Phase:** 6
**Status:** Active — defined 2026-05-17
**Stack additions:** `@dnd-kit/core ^6.3.1`, `@dnd-kit/utilities ^3.2.2`

---

## Canvas Requirements

- [ ] **CANVAS-01** — Dotted-grid canvas renders on each lesson page; background is CSS `radial-gradient` at 32 px cell size matching the notebook's page dimensions (A4 / A5 / Letter per notebook setting)
- [ ] **CANVAS-02** — Users can load a lesson page and see all previously placed modules rendered at their saved positions and sizes
- [ ] **CANVAS-03** — Users can drag a module to a new position; position snaps to the 32 px grid on release; new position is persisted via `PATCH /modules/{id}/layout`
- [ ] **CANVAS-04** — Users can resize a module via 8 drag handles; size snaps to the grid; per-type minimum dimensions are enforced; new size is persisted via `PATCH /modules/{id}/layout`
- [ ] **CANVAS-05** — Users can adjust module z-order via Bring Forward / Send Backward controls; z-index is persisted via `PATCH /modules/{id}/layout`
- [ ] **CANVAS-06** — Modules stay within canvas bounds; drag and resize operations are clamped to prevent overflow beyond the page boundary

## Module Requirements

- [ ] **MOD-01** — Users can open a module palette and select from all 12 module types; selecting a type creates a new module at an auto-selected empty-area position via `POST /pages/{pageId}/modules`; the module appears immediately on the canvas
- [ ] **MOD-02** — Users can select a module by clicking it; a selected module shows resize handles and an action bar (z-order controls + delete); clicking the canvas background deselects all modules
- [ ] **MOD-03** — Each module shell displays its type name, a type-specific Lucide icon, and a per-type header color; the body shows an empty placeholder (content editing deferred to Phase 7+)
- [ ] **MOD-04** — Users can delete a module; deletion is confirmed before calling `DELETE /modules/{id}`; the module disappears immediately from the canvas (TanStack Query cache updated)
- [ ] **MOD-05** — Module type, position (gridX / gridY), size (gridWidth / gridHeight), and z-index are fully persisted to the backend; reloading the page restores the exact canvas state

---

## Future Requirements (Deferred)

- Multi-select (rubber-band or Shift+click) — deferred post-v0.6
- Keyboard nudge (arrow keys move selected module by 1 cell) — deferred post-v0.6
- Module copy/paste / duplicate — deferred to Phase 7+
- Undo/redo (50-step history, 150ms coalescing) — Phase 7 (per spec)
- Canvas zoom — deferred post-v0.6
- Module locking (prevent accidental drag) — deferred post-v0.6
- Content editing inside module shells — Phase 7 (text), Phase 8 (chord), Phase 9 (rich)

---

## Out of Scope

- Infinite canvas scroll — canvas is fixed to physical page dimensions; no infinite canvas in v1
- Auto-layout / snap-to-neighbor — conflicts with free-form notebook feel
- Real-time collaborative cursors — out of scope per PROJECT.md
- Any content editing inside modules — shells only in Phase 6; editors in Phase 7–9
- CSS `resize` property for resizing — custom handles only (CSS resize can't be grid-snapped)

---

## Technical Context (from Research)

### New Dependencies
```
@dnd-kit/core        ^6.3.1   — DndContext, useDraggable, DragOverlay, sensors
@dnd-kit/utilities   ^3.2.2   — CSS.Transform helper for style-prop transforms
```

### Module Type Registry (12 types)
| # | Type | Min (w × h) | Header Color |
|---|------|-------------|--------------|
| 1 | Title | 8 × 2 | Amber |
| 2 | Subtitle | 6 × 2 | Amber/muted |
| 3 | TextBlock | 4 × 3 | Blue |
| 4 | OrderedList | 4 × 3 | Blue |
| 5 | UnorderedList | 4 × 3 | Blue |
| 6 | CheckboxList | 4 × 3 | Green |
| 7 | Table | 6 × 4 | Purple |
| 8 | ChordDiagram | 3 × 4 | Orange |
| 9 | ChordProgression | 4 × 3 | Orange |
| 10 | ChordTablatureGroup | 6 × 4 | Orange |
| 11 | MusicalNotes | 6 × 3 | Red |
| 12 | SheetMusic | 8 × 5 | Red |

### Grid Constants
- Cell size: 32 px
- MAX_COLS: 24 (A4), 25 (Letter), 17 (A5)
- MAX_ROWS: 35 (A4), 33 (Letter), 24 (A5)

### Key Pitfalls
- Use `style={{ transform: CSS.Transform.toString(t) }}` — never Tailwind dynamic classes (purged at build)
- AbortController per module for PATCH race condition prevention
- Single `snapToGrid(px)` utility at all write paths to prevent coordinate drift
- Canvas root: `position: relative` only — no `transform` (breaks Radix portal z-index)

---

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| CANVAS-01 | 6 | Plan 1 — Foundation | Pending |
| CANVAS-02 | 6 | Plan 4 — Integration | Pending |
| CANVAS-03 | 6 | Plan 3 — Interactions | Pending |
| CANVAS-04 | 6 | Plan 3 — Interactions | Pending |
| CANVAS-05 | 6 | Plan 3 — Interactions | Pending |
| CANVAS-06 | 6 | Plan 3 — Interactions | Pending |
| MOD-01 | 6 | Plan 2 — Shell | Pending |
| MOD-02 | 6 | Plan 2 — Shell | Pending |
| MOD-03 | 6 | Plan 2 — Shell | Pending |
| MOD-04 | 6 | Plan 3 — Interactions | Pending |
| MOD-05 | 6 | Plan 4 — Integration | Pending |

---

*Previous milestone requirements archived at:*
- `.planning/milestones/v0.5-REQUIREMENTS.md` — Lessons & Pages (LES-01–04, PAGE-01–02)
- `.planning/milestones/v0.4-REQUIREMENTS.md` — Notebook Management (NB-01–05, ERR-01–02)
