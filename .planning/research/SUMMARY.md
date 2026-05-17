# Research Summary: v0.6 Canvas & Module Placement

## Executive Summary

Phase 6 adds a free-form 2D canvas inside `LessonPage` where musicians can place, drag, resize, and z-order content modules on a dotted-grid. The grid unit is 32 px (5 mm at 2x density); the canvas is fixed to logical page dimensions (A4 ~794×1123 px) — no infinite scroll, no auto-layout. The only new dependency is `@dnd-kit/core` + `@dnd-kit/utilities`; everything else (resize handles, snapping math, z-index) is custom code.

All canvas state stays local or in TanStack Query — no new Zustand stores. Transient drag and resize state lives inside individual `CanvasModule` components; the server-of-record module list lives in TanStack Query keyed by `['modules', pageId]`. PATCH /layout is called once per drag/resize interaction, never on every pixel, and guarded by an AbortController to prevent race conditions.

Phase 6 ships shells only — 12 module types rendered as styled containers with header, icon, and placeholder text. No content editing. Phase 7 fills the editor layer via `React.lazy`.

---

## Stack Additions

Install exactly these two packages (pnpm):

```
@dnd-kit/core        ^6.3.1
@dnd-kit/utilities   ^3.2.2
```

Do NOT add: `@dnd-kit/sortable`, `@dnd-kit/modifiers`, `react-grid-layout`, `react-rnd`, `re-resizable`, or `interact.js`.

---

## Feature Table Stakes (must-have for v0.6)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Add module | Toolbar button → type picker → places at default grid position |
| 2 | Drag to move | dnd-kit `useDraggable`; snap to 32 px grid on drop only |
| 3 | Resize | 8 custom pointer-event handles; snap + enforce per-type min dimensions |
| 4 | Z-order | Bring Forward / Send Backward buttons in per-module action bar |
| 5 | Delete module | Delete button; confirmation dialog |
| 6 | Select module | Click to select (shows handles + action bar); click canvas to deselect |
| 7 | Module shells | 12 types: styled header (color + icon), empty body, placeholder text |
| 8 | Dotted-grid | CSS `radial-gradient` background; 32×32 px cells |

Defer: multi-select, keyboard nudge, copy/paste, undo/redo, canvas zoom.

**12 module type shells:** Title (Amber), Subtitle (Amber/muted), TextBlock (Blue), OrderedList (Blue), UnorderedList (Blue), CheckboxList (Green), Table (Purple), ChordDiagram (Orange), ChordProgression (Orange), ChordTablatureGroup (Orange), MusicalNotes (Red), SheetMusic (Red).

---

## Architecture Decisions

**State — where it lives:**

| State | Location |
|-------|----------|
| Module list | TanStack Query `['modules', pageId]` |
| Drag position | Local in `CanvasModule` via `useDraggable` |
| Selected module ID | Local state in `Canvas.tsx` |
| Resize preview | Local state in `Canvas.tsx` (`activeResize`) |

No Zustand store for canvas state.

**File structure** (all under `src/features/lessons/canvas/`):

```
canvasConstants.ts      CELL_SIZE=32, MAX_COLS, MAX_ROWS
moduleTypes.ts          12 type definitions as const
modulesApi.ts           CRUD API functions
useModules.ts           TanStack Query hook
useModuleMutations.ts   create / patchLayout / update / delete mutations
ModuleShell.tsx         type-specific shell renderer
ResizeHandles.tsx       8-handle overlay
CanvasModule.tsx        drag + resize wrapper
ModulePalette.tsx       add module toolbar
Canvas.tsx              DndContext host; selected state
```

`LessonPage.tsx` modified to replace CSS placeholder with `<Canvas pageId={...} />`.
`src/types/index.ts` extended with `Module`, `CreateModulePayload`, `PatchModuleLayoutPayload`.

**Coordinate system:**
```
position: left = gridX * 32, top = gridY * 32
size:      width = gridWidth * 32, height = gridHeight * 32
snap:      snapToGrid(px) = Math.round(px / CELL_SIZE)
clamp:     Math.max(0, Math.min(newGridX, MAX_COLS - module.gridWidth))
```

---

## Watch Out For

**P1 — Tailwind purges dynamic transform classes (HIGH)**
Never write `translate-x-[${x}px]`. Always use `style={{ transform: CSS.Transform.toString(transform) }}` from `@dnd-kit/utilities`.

**P2 — PATCH /layout race condition (MEDIUM)**
AbortController per module — `controllerRef.current?.abort()` before issuing new PATCH. Lives in `useModuleMutations.ts`.

**P3 — Grid coordinate off-by-one drift (HIGH)**
Always snap `gridX`/`gridY` before POST. Single `snapToGrid(px)` utility at all write paths.

**P4 — Canvas root must not have CSS `transform` (MEDIUM)**
`transform` on positioned ancestor creates stacking context, breaking Radix portal dialogs. Canvas container: `position: relative` only. DragOverlay portals to `document.body`.

---

## Gaps to Validate During Planning

- Confirm `PatchModuleLayoutPayload` field names against swagger before writing `modulesApi.ts`
- Confirm MAX_COLS/MAX_ROWS values per page size (A4: 24×35, Letter: 25×33, A5: 17×24)
- No unit tests for pointer-event drag/resize (manual UAT only); unit tests cover coordinate math + API payloads
