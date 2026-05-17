# Phase 6: Canvas & Module Placement - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A functional 2D dotted-grid canvas renders on each lesson page. Users can place all 12 module type shells from a palette, drag them to reposition, resize them via 8 handles, adjust z-order, and delete them. All positions and sizes are persisted to the backend. Content editing inside module shells is out of scope (Phases 7–9).

</domain>

<decisions>
## Implementation Decisions

### Palette UX
- **D-01:** "Add module" button lives in the **existing LessonPage top controls bar** — not a floating canvas button and not a sidebar. It sits alongside the existing page navigation controls.
- **D-02:** Clicking "Add module" opens a **shadcn Popover** containing a **3×4 grid** of module type tiles. Each tile shows the type-specific Lucide icon and the module type name label. The Popover component is not yet installed — planner must add `pnpm dlx shadcn@4.6.0 add popover`.
- **D-03:** Selecting a module type **closes the popover immediately** and triggers module creation at the auto-selected position. No multi-add mode.

### Module Action Bar
- **D-04:** When a module is selected, a **floating action bar appears directly above** the selected module (positioned relative to the module element, not the top controls bar).
- **D-05:** Action bar contains exactly: **Bring Forward**, **Send Backward**, and **Delete**. Delete triggers the existing confirmation dialog pattern (shadcn Dialog). No module type label or other controls.
- **D-06:** If the floating bar would overflow above the canvas top boundary, it **flips below the module** instead. Standard flip behavior — same as Radix Tooltip/Popover flip.

### Canvas Sizing & Scaling
- **D-07:** The canvas element has **fixed pixel dimensions** matching the notebook's page size (A4 = 768×1120px, Letter = 800×1056px, A5 = 544×768px — computed as `MAX_COLS × 32` × `MAX_ROWS × 32`). A wrapper element applies **`transform: scale(ratio)`** to visually fit the available viewport width. The canvas itself never changes pixel size.
- **D-08:** Scale ratio = `containerWidth / canvasFixedWidth`. Computed on mount and on `ResizeObserver` changes to the wrapper. The canvas scrolls vertically (the scaled wrapper may still exceed viewport height).
- **D-09:** dnd-kit drag uses a **scale-corrected pointer sensor**: a custom sensor wrapper that reads the current scale ratio and divides `delta.x` and `delta.y` by the ratio before passing them to drag handlers. This ensures `snapToGrid()` receives accurate grid-unit coordinates regardless of scale.

### Module Auto-Placement
- **D-10:** When a module type is selected from the palette, the frontend finds placement coordinates via a **left-to-right, top-to-bottom grid scan** — first cell where the module's default `gridWidth × gridHeight` footprint fits without overlapping existing modules and stays within canvas bounds.
- **D-11:** If no empty slot is found (canvas is full), show a **Sonner toast** ("Canvas is full — move or delete a module first") and **cancel the add**. No module is created. The POST request is never sent.

### Claude's Discretion
- Exact pixel dimensions and aspect ratios for A5 and Letter page sizes (derive from MAX_COLS/MAX_ROWS constants in REQUIREMENTS.md)
- Visual design of the floating action bar (height, gap, icon sizes — follow existing shadcn sizing tokens)
- Whether the "Add module" button uses a `Plus` icon + text label or icon-only (based on available toolbar space)
- Z-index stacking values for the floating action bar vs. selected module vs. unselected modules
- ResizeObserver cleanup pattern (follow existing hook patterns in the codebase)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements & API Contracts
- `.planning/REQUIREMENTS.md` — CANVAS-01–06, MOD-01–05 with acceptance criteria, module type registry (12 types + min dimensions + header colors), grid constants, and key pitfalls
- `.planning/swagger.json` — Authoritative API contract for: `GET /pages/{pageId}/modules`, `POST /pages/{pageId}/modules` (CreateModuleRequest), `PATCH /modules/{moduleId}/layout` (PatchModuleLayoutRequest), `DELETE /modules/{moduleId}`

### Project Constraints & Decisions
- `.planning/PROJECT.md` — TypeScript constraints (erasableSyntaxOnly, verbatimModuleSyntax), XSS rules (no dangerouslySetInnerHTML), navigation rules, icon constraint (Lucide only), Tailwind v4 CSS-first
- `.planning/ROADMAP.md` — Phase 6 goal and 4-plan structure (Foundation → Shell → Interactions → Integration)
- `.planning/STATE.md` — Key decisions from prior phases carried forward (canvas file location, dnd-kit selection rationale, TanStack Query pattern, feature-scoped API module pattern)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/LessonPage.tsx` — The canvas placeholder (dotted radial-gradient div) lives here; this is where the real canvas component replaces the placeholder. The top controls bar is also defined here — "Add module" button integrates directly into this bar.
- `src/components/ui/dialog.tsx` — Use for the Delete module confirmation dialog (same pattern as DeletePageDialog, DeleteLessonDialog)
- `src/components/ui/sonner.tsx` — Use for the canvas-full toast (`toast.error(...)`) and any mutation errors
- `src/components/ui/button.tsx` — Use for Bring Forward, Send Backward, Delete buttons in the floating action bar and "Add module" in the toolbar
- `src/components/ui/tooltip.tsx` — Optional: wrap action bar icon-only buttons with tooltips
- `src/features/lessons/api/lessonPagesApi.ts` — Template for `src/features/lessons/canvas/api/modulesApi.ts`; typed async functions, single `client` import
- `src/types/index.ts` — Add `Module`, `ModuleType`, `CreateModulePayload`, `PatchModuleLayoutPayload` types here

### Established Patterns
- TanStack Query `useQuery` + `useMutation` for all server state (see `LessonPage.tsx`, `notebooksApi.ts`)
- `extractErrorMessage(error, fallback)` inline per component — already used in `LessonPage.tsx`; reuse same function signature for module mutation errors
- `AbortController` per in-flight PATCH (noted in REQUIREMENTS.md pitfalls — prevents race conditions when drag/resize events fire in rapid succession)
- `as const` unions for module type constants (no enum, per erasableSyntaxOnly constraint)
- Feature-scoped API modules: new canvas API lives at `src/features/lessons/canvas/api/modulesApi.ts`

### Integration Points
- `src/pages/LessonPage.tsx` — Canvas component replaces the `<div>` placeholder; "Add module" button added to the existing controls bar
- `src/types/index.ts` — New Module types added here (follows established pattern for Notebook, Lesson, LessonPage types)
- No router changes needed — LessonPage already has its own route at `/app/notebooks/:id/lessons/:lessonId`
- No Navbar breadcrumb changes needed for Phase 6

### Missing Dependencies
- `shadcn popover` component not installed — `pnpm dlx shadcn@4.6.0 add popover` needed before palette UI can be built
- `@dnd-kit/core ^6.3.1` and `@dnd-kit/utilities ^3.2.2` not yet installed — `pnpm add @dnd-kit/core @dnd-kit/utilities` needed

</code_context>

<specifics>
## Specific Ideas

- The module palette popover is a **3×4 grid** (3 columns, 4 rows = 12 types). Each tile: type icon (Lucide, ~20px) centered above the type name label. Tiles are compact — aim for ~80×64px per tile. The popover itself should be ~260px wide.
- The floating action bar above a selected module: slim pill/toolbar style (similar to how text editors show a floating format bar). Suggested: `flex items-center gap-1 rounded-md border bg-background shadow-md px-1 py-0.5`.
- Canvas scale mechanism: outer wrapper div with `ref` for ResizeObserver; inner canvas div with `width: {canvasWidth}px; height: {canvasHeight}px; transform: scale({scale}); transform-origin: top left`. Wrapper height should be set to `canvasHeight * scale` to prevent wrapper collapse after scale.
- The scale-corrected sensor: dnd-kit exposes `activationConstraint` and sensor options; for coordinate correction, the cleanest approach is a custom `PointerSensor` subclass or a wrapper that intercepts the `onMove` delta before it reaches the drag state.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 6-Canvas & Module Placement*
*Context gathered: 2026-05-17*
