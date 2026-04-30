# Staccato Frontend — ROADMAP.md

*Last updated: 2026-04-28 after initialization*

**Milestone:** v1 — Personal-grade music notebook (no public timeline; solo dev passion project)

**Strategy:** One GSD phase wraps exactly one Speckit feature. Each phase plan **references** `specs/NNN-<slug>/plan.md` (created via `/speckit.plan`) instead of duplicating it. The Speckit prompts for features 9–17 are pre-written in `frontend-speckit-prompts.md` lines 1402–2465 — use them verbatim to drive `/speckit.specify` + `/speckit.plan` for each phase.

**Snapshot:** 9 phases · 9 active v1 requirements · 100 % coverage · 1 continuous stabilization track.

## Phase Summary

| # | Phase | Goal | Requirements | Speckit | UI hint |
|---|-------|------|--------------|---------|---------|
| 1 | Module Content Editor (Core) | Inline editor that mounts inside a placed module with save/cancel, autosave, undo/redo, dirty-state guards | EDIT-01 | F9 (`009-module-content-editor`) | yes |
| 2 | Text & List Blocks | Paragraph + ordered/unordered list + heading blocks renderable inside a module | BLOCK-01 | F10 (`010-text-list-blocks`) | yes |
| 3 | Table Block | Rows × columns table block with cell editing, header toggle, alignment | BLOCK-02 | F11 (`011-table-block`) | yes |
| 4 | Musical Notes Block | Note/rest input with durations, accidentals, staff/time-signature context, basic engraving | BLOCK-03 | F12 (`012-musical-notes-block`) | yes |
| 5 | Chord Library & Fretboard | Chord library browser route + fretboard renderer (tunings, fret count, shape display) | CHORD-01 | F13 (`013-chord-library-fretboard`) | yes |
| 6 | Chord Progression Block | Chord-symbol sequence block with bar grouping + transposition | CHORD-02 | F14 (`014-chord-progression-block`) | yes |
| 7 | Chord Tablature Group Block | Multiple chord shapes side-by-side as fretboard tablature group | CHORD-03 | F15 (`015-chord-tablature-group`) | yes |
| 8 | Breadcrumb Module | Lightweight nav-style module showing notebook → lesson → page context inside the canvas | BLOCK-04 | F16 (`016-breadcrumb-module`) | yes |
| 9 | PDF Export & SignalR | Backend-driven PDF render of notebook/lesson with SignalR progress + `/app/exports` history | EXPORT-01 | F17 (`017-pdf-export-signalr`) | yes |
| ⟳ | **Stabilization (continuous)** | a11y plugin, coverage gate, MSW server, code splitting, SignalR dynamic import | STAB-02 | — | no |

## Phase Details

### Phase 1: Module Content Editor (Core) ✓ Complete (2026-04-30)

**Goal:** A user can open a placed module, edit its content inline with autosave, undo/redo, dirty-state guards, and a save/cancel affordance — without disturbing the grid placement system.

**Status:** Shipped 2026-04-30 across 6 plans / 27+ commits on branch `009-module-content-editor`. All 9 locked acceptance criteria covered by `ModuleCard.roundtrip.test.tsx`. SUMMARY.md exists for every plan; phase verification at `.planning/phases/01-module-content-editor-core/01-VERIFICATION.md`.

**Requirements:** EDIT-01

**Speckit reference:** `specs/009-module-content-editor/` — drive via the `/speckit.specify` + `/speckit.plan` prompts at `frontend-speckit-prompts.md` lines ~1402–1547.

**Success criteria:**
1. Opening a module on the canvas reveals an editor surface that does not break grid layout.
2. Edits autosave (debounced) and surface a "saving / saved" status; explicit Save and Cancel buttons exist.
3. Undo/redo works within the active editing session via keyboard (Ctrl/Cmd-Z / Ctrl/Cmd-Shift-Z).
4. Closing/navigating with unsaved dirty state prompts the user (`AlertDialog` confirm).
5. Editor obeys the existing module styling system (Phase F7) — typography, color tokens, dotted-paper context.

**Dependencies:** CANVAS-01 (F8), STYLE-01 (F7) — both validated.

---

### Phase 2: Text & List Blocks

**Goal:** Inside the module editor, the user can compose paragraphs, headings, and ordered/unordered lists; the block tree round-trips through the backend.

**Requirements:** BLOCK-01

**Speckit reference:** `specs/010-text-list-blocks/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~1548–1656.

**Success criteria:**
1. User can add a paragraph, h1/h2/h3 heading, ordered list, or unordered list block inside a module.
2. Lists support nested items (at least one level) and item add/delete.
3. Block tree persists to the backend and re-hydrates identically on reload.
4. Blocks honour the module's style record (Phase F7 typography tokens).
5. Keyboard shortcuts: Enter creates a new block of the same kind; Backspace at a list item start unindents/converts to paragraph.

**Dependencies:** EDIT-01 (Phase 1).

---

### Phase 3: Table Block

**Goal:** A table block where the user can build rows × columns, edit each cell, toggle a header row, and set per-column alignment.

**Requirements:** BLOCK-02

**Speckit reference:** `specs/011-table-block/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~1657–1746.

**Success criteria:**
1. Insert/remove rows and columns via inline controls.
2. Each cell holds inline text (no nested blocks in v1).
3. Header row toggle visually distinguishes the first row and persists.
4. Per-column alignment (left/center/right) persists.
5. Table block round-trips through the backend with no data loss.

**Dependencies:** EDIT-01 (Phase 1), BLOCK-01 (Phase 2 — for inline-text rendering parity).

---

### Phase 4: Musical Notes Block

**Goal:** A musical-notation block for entering notes and rests with durations, accidentals, and a basic staff context (time signature). Engraving need not be publication-grade — readable is enough.

**Requirements:** BLOCK-03

**Speckit reference:** `specs/012-musical-notes-block/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~1747–1837.

**Success criteria:**
1. User can input notes (C–B + accidentals) and rests with durations from whole to sixteenth.
2. The block displays a single staff with chosen clef + time signature.
3. Notes/rests laid out in measures with bar lines.
4. Block persists to backend and re-hydrates identically.
5. Notes block respects the module's style record where applicable (note color/size tokens).

**Dependencies:** EDIT-01 (Phase 1).

---

### Phase 5: Chord Library & Fretboard

**Goal:** A standalone `/app/chords` route where users browse a chord library and render any chord on a configurable fretboard component (instrument tuning, fret count, finger numbers).

**Requirements:** CHORD-01

**Speckit reference:** `specs/013-chord-library-fretboard/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~1838–1979.

**Success criteria:**
1. `/app/chords` lists chords (filterable by root, quality) from `GET /chords`.
2. Selecting a chord shows its fretboard rendering with selectable instrument (`GET /instruments`) and tuning.
3. Fretboard renderer is a standalone component reusable by the chord progression and tablature blocks (Phases 6–7).
4. UI strings localized (en + hu).
5. Loads under typical network conditions without blocking other routes (standalone fetch path).

**Dependencies:** SIDEBAR-01 (F6 — entry already in nav).

---

### Phase 6: Chord Progression Block

**Goal:** A block that shows a sequence of chord symbols, optionally grouped into bars, with a transposition control.

**Requirements:** CHORD-02

**Speckit reference:** `specs/014-chord-progression-block/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~1980–2118.

**Success criteria:**
1. User can append chord symbols (root + quality, optional bass note) inline; each symbol is searchable from the chord library.
2. Bar/measure grouping toggle: visual bars or flat sequence.
3. Transposition control shifts every symbol up/down by a chosen interval; persists.
4. Block round-trips through the backend with no data loss.
5. Reuses the chord library data layer from Phase 5 (no new backend endpoints).

**Dependencies:** CHORD-01 (Phase 5).

---

### Phase 7: Chord Tablature Group Block

**Goal:** A block that displays multiple chord shapes as fretboard tabs side-by-side (a "shape group") for instrument-specific reference.

**Requirements:** CHORD-03

**Speckit reference:** `specs/015-chord-tablature-group/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~2119–2221.

**Success criteria:**
1. User can add 1..N chord shapes to a single group block.
2. Each shape renders via the fretboard component from Phase 5.
3. Per-shape labels/captions optional and persist.
4. Group block round-trips through the backend with no data loss.
5. Layout adapts to module width without overflowing the grid cell.

**Dependencies:** CHORD-01 (Phase 5).

---

### Phase 8: Breadcrumb Module

**Goal:** A lightweight, nav-style module that, when placed on a page, displays the current notebook → lesson → page context. Useful as a standing header on long pages.

**Requirements:** BLOCK-04

**Speckit reference:** `specs/016-breadcrumb-module/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~2222–2319.

**Success criteria:**
1. Placing a Breadcrumb module on a page renders the current notebook → lesson → page chain.
2. Each segment is a `<Link>` (React Router) to the appropriate route.
3. Module respects the styling system (typography + color tokens).
4. Module stays valid across navigation (renders the new chain when the page changes).
5. Behaves on the smallest grid cell width without truncating illegibly (ellipsis where appropriate).

**Dependencies:** CANVAS-01, STYLE-01.

---

### Phase 9: PDF Export & SignalR

**Goal:** From a notebook (or single lesson), the user requests a PDF export; the backend renders it; the UI shows live progress via SignalR; the finished export appears in `/app/exports` with a download link.

**Requirements:** EXPORT-01

**Speckit reference:** `specs/017-pdf-export-signalr/` — Speckit prompt at `frontend-speckit-prompts.md` lines ~2320–end.

**Success criteria:**
1. From the notebook toolbar, user can trigger a "Export to PDF" action and pick scope (whole notebook / single lesson).
2. SignalR `HubConnection` opens for the duration of an in-flight export and reports progress (queued, rendering N/M pages, finished, failed); UI shows a non-blocking progress affordance (toast + drawer).
3. `/app/exports` lists historical exports (paged, sorted newest-first) with download links and status badges.
4. SignalR connection is dynamic-imported (not eagerly bundled) to keep the main chunk small.
5. Network failure during export is recoverable: UI shows the failure, user can retry; no token leakage in URLs.

**Dependencies:** AUTH-03 (token), CANVAS-01 (notebook content rendered), all blocks (so exports actually contain content). Phase 9 lands last so the export covers the full block taxonomy.

---

### Continuous: Stabilization (STAB-02)

**Not a discrete phase** — folded into phases as opportune. Verified at end-of-milestone audit.

**Success criteria:**
1. `eslint-plugin-jsx-a11y` installed and clean (zero violations or all explicitly disabled with rationale).
2. Vitest coverage threshold ≥ 60 % lines globally; configured in `vite.config.ts` `test.coverage` block; `@vitest/coverage-v8` provider added.
3. MSW handlers + `setupServer()` wired in `src/test-setup.ts` for integration tests of feature flows.
4. Route-level code splitting via `React.lazy()` for `LoginPage`, `RegisterPage`, `NotebookLayout` and its children, `ProfilePage`, `ExportsPage`, `ChordsPage`.
5. `@microsoft/signalr` only loaded on authenticated routes (dynamic import inside Phase 9 wrapper).
6. Bundle audit run with `rollup-plugin-visualizer` at end of milestone; main chunk under a chosen budget (set in Phase 9 plan).

## Build Order Rationale

- **Phase 1 (Editor Core) blocks Phases 2-4 and 8** — every block needs the editor surface.
- **Phase 5 (Chord Library + Fretboard)** is shared infrastructure for **Phase 6 + 7**; ship the renderer once.
- **Phase 9 (Export)** lands last so the export covers the complete block taxonomy from Phases 1-8.
- **Phases 2 → 3 → 4 → 5 → 6 → 7 → 8** are otherwise independent enough to reorder if motivation dictates, but the listed order minimizes context-switching cost (text → table → music notes → chord ecosystem → misc).
- **Stabilization** is continuous; revisit between phases.

## Phase Lifecycle (GSD-native)

For each phase the standard flow is:

1. `/gsd-spec-phase N` *(optional)* — Socratic spec refinement; produces `.planning/phases/NN-<slug>/SPEC.md` with falsifiable requirements. Skip if the PRD prompt block from `frontend-speckit-prompts.md` is already concrete enough.
2. `/gsd-discuss-phase N` — gather context, surface assumptions and gray areas. Feed the matching PRD prompt block from `frontend-speckit-prompts.md` as initial context.
3. `/gsd-ui-phase N` *(frontend phases)* — produces `UI-SPEC.md` design contract.
4. `/gsd-plan-phase N` — produces `PLAN.md` with task breakdown, dependencies, threat model, and goal-backward verification. Plan-check agent runs (per `config.json`).
5. `/gsd-execute-phase N` — wave-based execution with atomic commits.
6. `/gsd-verify-work` and/or `/gsd-validate-phase` — confirm goals achieved and tests cover requirements (per `config.json`).
7. `/gsd-transition` — move REQ from Active → Validated in `PROJECT.md`, tick `REQUIREMENTS.md`, advance `STATE.md`.

Optional gates between steps: `/gsd-code-review` → `/gsd-code-review-fix`, `/gsd-secure-phase`, `/gsd-ui-review`.

## Coverage Validation

- 9 active v1 requirements ↔ 9 phases ↔ 9 Speckit features (F9-F17). 1:1:1 mapping.
- 1 continuous track (STAB-02) covered by end-of-milestone gate.
- 100 % coverage. No orphan requirements. No empty phases.

