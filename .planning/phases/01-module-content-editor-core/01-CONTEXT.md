# Phase 1 — Module Content Editor (Core) — CONTEXT.md

*Created: 2026-04-28 via `/gsd-discuss-phase 1` (text-mode fallback, all gray areas discussed)*

## Domain

A user can open a placed module on the notebook canvas, edit its `content: BuildingBlock[]` inline with autosave, undo/redo, and a dirty-state guard, without disturbing F8 grid placement or F7 module styling. This phase ships the **core editor framework** — the block registry, the autosave + undo/redo + dirty-guard infrastructure, the bold-only `TextSpan` editor, and the **`Text` block as the seed implementation** that proves the registry round-trips through the backend. Phases 2–8 register additional block types into this same framework.

REQ: `EDIT-01` (and partial seed of `BLOCK-01` — see decision 1 below).

## Canonical Refs

Downstream agents (researcher, planner, executor) MUST read these:

- `.planning/ROADMAP.md` — Phase 1 success criteria 1–5 and dependencies (CANVAS-01, STYLE-01).
- `.planning/REQUIREMENTS.md` — REQ `EDIT-01` definition + STAB-02 stabilization track (a11y, coverage, code-splitting).
- `.planning/PROJECT.md` — solo-dev passion project, YOLO mode, personal-grade quality bar.
- `.planning/codebase/STACK.md` — confirms React 19, Vite 8, Tailwind v4, shadcn/ui (`radix-ui`), Zustand 5, TanStack Query v5, RHF, Zod 4, Lucide.
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md` — feature folder layout under `src/features/`, hook + component naming, test colocation.
- `.planning/codebase/TESTING.md` — Vitest + Testing Library conventions; STAB-02 raises coverage gate to ≥60 %.
- `.planning/codebase/INTEGRATIONS.md` — Axios client + TanStack Query mutation patterns; reference for the new `PUT /modules/{id}` integration.
- `frontend-speckit-prompts.md` lines ~1402–1547 — Speckit Feature 9 PRD prompt block (the primary functional spec for this phase).
- `src/lib/types/modules.ts` — `Module` and `BuildingBlock` shapes already defined.
- `src/lib/types/common.ts` — `ModuleType` (12 values) and `BuildingBlockType` (10 values) enums.
- `src/api/modules.ts` — existing module API client; `PUT /modules/{moduleId}` endpoint is **not yet implemented**, must be added here.
- `src/features/notebooks/components/ModuleCard.tsx` — current read-only render target for a placed module; entry point for view↔edit mode swap.
- `src/features/notebooks/hooks/useModuleLayoutMutations.ts` — pattern reference for the new `useModuleContentMutation` (optimistic update + invalidation shape).
- `src/features/styling/utils/module-type-config.ts` — likely home for the new `MODULE_ALLOWED_BLOCKS` constant.
- `src/features/styling/hooks/useNotebookStyles.ts` + `utils/style-defaults.ts` — F7 style record the editor must read for typography/color tokens.

> No external ADRs exist for this phase.

## Code Context (from scout)

- **Module model already typed.** `Module.content: BuildingBlock[]` and `BuildingBlock = { type: BuildingBlockType, [k: string]: unknown }` are in place. The editor mutates this array.
- **All 10 block-type discriminators enumerated** in `common.ts`. The registry can be exhaustively keyed by `BuildingBlockType` with a TS `Record` for compile-time completeness.
- **No PUT endpoint** for full-module update exists in `src/api/modules.ts`; only PATCH-layout (Phase F8). Must be added.
- **No `MODULE_ALLOWED_BLOCKS` constant** exists yet — `module-type-config.ts` is the likely home (already used for per-module-type config).
- **F8 selection model** lives on `GridCanvas` / `ModuleCard` — reuse `isSelected` state to gate single-click edit-mode entry.
- **F7 style record** is read via `useNotebookStyles`; both Renderer and Editor must subscribe so block typography matches view mode.
- **`@dnd-kit/core`** and **`@dnd-kit/sortable`** are already in the dep tree (used by F8 grid drag) — reuse for vertical block reorder, no new dependency.
- **`AlertDialog`** from shadcn/ui is already wired for delete-notebook / delete-lesson confirms — reuse the same primitive for the dirty-state navigation guard.

## Decisions

### 1. Phase 1 ships the `Text` block as the registry's seed implementation

- **Phase 1 delivers:** registry framework + `Text` block (Renderer + Editor) + placeholders for the other 9 block types.
- **Phase 2 (BLOCK-01) still owns:** `SectionHeading`, `BulletList`, `NumberedList` (and any other heading/list semantics), built on the registry seeded here.
- **Rationale:** without one real block, Phase 1 has no end-to-end UAT path (autosave, undo/redo, TextSpan, MODULE_ALLOWED_BLOCKS gating are all unverifiable). `Text` is the simplest block and the only one that exercises the full TextSpan editor pipeline that every later text-bearing block reuses.
- **Boundary clarification:** the `Text` block here is the bare-minimum paragraph block (TextSpan-bearing). Heading variants (h1/h2/h3) and lists land in Phase 2.

### 2. TextSpan editor uses `contentEditable` with manual span tracking

- One encapsulated `<TextSpanEditor value={TextSpan[]} onChange />` component.
- Two pure utility modules with their own unit tests (this is where bugs hide):
  - `splitSpansAtSelection(spans, anchorOffset, focusOffset)` — splits at selection boundaries and returns affected indices.
  - `mergeAdjacentSpans(spans)` — collapses neighbours with identical `bold` value, runs after every mutation.
- **Bold toggle:** Ctrl/Cmd-B and toolbar button both call the same selection-aware toggle. If selection is collapsed, toggle the "next typed char" mode (track pending bold state in component state).
- **Rejected:** controlled-textarea (stiff bold UX) and Lexical/TipTap/Slate (bundle weight against STAB-02 main-chunk budget; overkill for one formatting toggle).
- **No italic, underline, color, or font-size** — explicitly out of scope, ever, per F9 prompt.

### 3. Undo/redo lives on a single whole-module session stack

- **State shape:** `{ past: BuildingBlock[][], present: BuildingBlock[], future: BuildingBlock[][] }` reducer scoped to the active edit session.
- **Covers:** text edits, bold-toggle ops, block add, block delete, block reorder, MODULE_ALLOWED_BLOCKS-rejected attempts (no — only successful state transitions push history).
- **Cap:** 50 history entries (drop oldest); cleared when the user exits edit mode.
- **Bindings:** `Ctrl/Cmd+Z` → undo, `Ctrl/Cmd+Shift+Z` (and `Ctrl+Y` on Windows) → redo.
- **Push policy:** debounced text edits coalesce inside a single typing burst (150ms) — one history entry per "logical action," not per keystroke.
- **Rejected:** per-block history (surprising on reorder) and hybrid (two stacks → race conditions and ordering ambiguity for the user).

### 4. Dirty-state guard fires only on route change

- React Router v7 `useBlocker` against the editor's `isDirty` flag.
- If a save is in-flight when navigation is attempted, the blocker awaits the in-flight PUT and then either allows navigation (success) or shows the AlertDialog with "Discard / Keep editing" (failure).
- **Click-outside the module:** flushes the debounced save and exits edit mode silently — no dialog. (The PUT is the safety net, per F9.)
- **`beforeunload` / tab-close:** **not** wired. Autosave + the route-change guard are sufficient; `beforeunload` produces theatrical false-positives.
- **AlertDialog reuse:** reuse the shadcn primitive already used by delete-notebook / delete-lesson dialogs for visual consistency.

### 5. Block reorder shares the 1000ms autosave debounce

- Reorder, text edit, bold toggle, block add, block delete — all flow through the same `useDebouncedSave(1000ms)` hook.
- Optimistic local state updates immediately; PUT fires on the trailing edge.
- Click-outside exit and edit-mode close flush any pending save synchronously before unmounting.
- **Rejected:** immediate-PUT-on-drop. Two save paths = two failure modes; race against subsequent text edits is real.

### 6. Edit-mode entry: F9 gestures + explicit Edit button

- **Single-click** on an already-selected module → enter edit mode.
- **Double-click** on an unselected module → select + enter edit mode.
- **Explicit "Edit" button** in the module chrome (visible on selection, before edit mode is active) → enter edit mode. Provides keyboard activation (Enter / Space) for a11y and STAB-02 jsx-a11y compliance.
- **Exit:** click-outside (flush + exit), `Escape` key (flush + exit), explicit Save button (flush + exit), explicit Cancel button (revert to original `content` snapshot taken on edit-mode entry, then exit — undo stack discarded).
- **Edit-mode visual cue:** subtle warm-brown border / glow around the module per F9 prompt; tied to a CSS variable so STYLE-01 can tweak.

### Cross-cutting locked details (from F9 prompt + ROADMAP)

These are not gray areas — captured here so the planner does not re-derive them.

- **Endpoint:** `PUT /modules/{moduleId}` with full module payload (`{ moduleType, gridX, gridY, gridWidth, gridHeight, zIndex, content }`). Add to `src/api/modules.ts`.
- **Save indicator:** subtle text in earthy muted tone — "Saving…" → "Saved" with a Lucide `Check` icon → fade out after ~1.5s. Lives near the editor toolbar.
- **Add Block dropdown:** shadcn `Popover`; options filtered by `MODULE_ALLOWED_BLOCKS[moduleType]`; block-type icons (Lucide) + i18n labels (en + hu).
- **Breadcrumb modules:** content always `[]`; show "Content is auto-generated from subtitle modules" message instead of an editor. (Phase 8 actually wires the auto-generation; this phase only enforces the empty-content invariant.)
- **Title modules:** `MODULE_ALLOWED_BLOCKS.Title = ['Date', 'Text']`.
- **FreeText modules:** all 10 block types allowed.
- **Other module types:** mapping defined in F9 prompt — capture the full table in PLAN.md, source it from `src/features/styling/utils/module-type-config.ts`.
- **Error responses:** translate `INVALID_BUILDING_BLOCK` (422) and `BREADCRUMB_CONTENT_NOT_EMPTY` (422) via `react-i18next` and surface as toast.
- **Block delete confirmation:** confirm only when the block has non-empty content; empty blocks delete without confirmation.
- **Keyboard shortcuts in edit mode:** `Ctrl+B` bold, `Ctrl+Z` / `Ctrl+Shift+Z` undo/redo, `Escape` exit, `Enter` (block-specific — Phase 2 owns text-block Enter behavior).
- **Edit chrome design system:** earthy app system (toolbar, dropdown, drag handles, delete buttons, save indicator). Module body content: notebook typography from F7 style record. No emojis anywhere.
- **i18n:** every user-visible string in `src/i18n/en.json` + `src/i18n/hu.json`.

## Deferred Ideas (out of scope — capture for backlog)

- **Real-time multi-user editing / conflict resolution.** Last-write-wins is fine for v1 (solo dev).
- **Italic / underline / color / font-size formatting.** Explicitly out per F9; would belong in a later "rich-text upgrade" milestone.
- **Comments / suggestions on blocks.**
- **Search-and-replace inside a module.**
- **Markdown / paste-from-clipboard auto-conversion** (paste handling is plain-text only in v1).
- **Block templates / snippets** (preset blocks the user can drop in).
- **Auto-generated breadcrumb content** for Breadcrumb modules — Phase 8's job; this phase only enforces empty-content.

## Locked Acceptance Criteria (from ROADMAP)

1. Opening a module on the canvas reveals an editor surface that does not break grid layout.
2. Edits autosave (1000ms debounce) and surface a "saving / saved" status; explicit Save and Cancel buttons exist.
3. Undo/redo works within the active editing session via keyboard (`Ctrl/Cmd-Z` / `Ctrl/Cmd-Shift-Z`).
4. Closing/navigating with unsaved dirty state prompts the user (`AlertDialog` confirm) — *route change only, per Decision 4.*
5. Editor obeys the existing module styling system (Phase F7) — typography, color tokens, dotted-paper context.

Plus phase-specific:
6. The `Text` block round-trips through `PUT /modules/{id}` and re-hydrates identically.
7. The block registry exhaustively keys every `BuildingBlockType`; unimplemented types render a `[Type — coming soon]` placeholder.
8. `MODULE_ALLOWED_BLOCKS` is enforced both in the Add-Block dropdown (UI gate) and on the optimistic local-state mutation (defense-in-depth against future programmatic mutations).
9. Breadcrumb modules show the auto-generated message and never enter the block editor.

## Stabilization Track Touchpoints (STAB-02)

- a11y: explicit Edit button (Decision 6) gives keyboard activation; ensure focus management on edit-mode enter/exit; aria-labels on drag handles + delete buttons.
- coverage: `splitSpansAtSelection` + `mergeAdjacentSpans` + `useDebouncedSave` + reducer for undo/redo are all pure / hook-pure → easy unit tests; aim for ≥80 % on these to lift the global gate.
- code-splitting: editor surface is non-trivial — wrap in `React.lazy()` so it doesn't bloat the canvas-route initial chunk.

## Next Steps

`/clear` then:

`/gsd-ui-phase 1` *(recommended — produce UI-SPEC.md design contract for the editor chrome, save indicator, Add Block popover, edit-mode visual state)*

then:

`/gsd-plan-phase 1`

Or, to skip the UI design contract and go straight to planning:

`/gsd-plan-phase 1`

