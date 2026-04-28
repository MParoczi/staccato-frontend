# Phase 1 — Module Content Editor (Core) — DISCUSSION-LOG.md

*Session: 2026-04-28 · Mode: text-mode fallback (vscode_askquestions unavailable) · All 6 gray areas discussed*

This is a human-readable transcript of the discussion. The canonical decisions live in `01-CONTEXT.md`. Downstream agents (researcher, planner, executor) should NOT consume this file.

## Setup

- Phase 1 not yet started; no SPEC.md, no prior CONTEXT.md, no checkpoint.
- Prior context loaded: `PROJECT.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, all `.planning/codebase/*.md`.
- Speckit Feature 9 PRD prompt block (`frontend-speckit-prompts.md` ~1402–1547) used as primary functional spec.
- Codebase scout: `src/lib/types/{modules,common}.ts`, `src/api/modules.ts`, `src/features/notebooks/components/ModuleCard.tsx`, `src/features/styling/utils/module-type-config.ts`, `src/features/notebooks/hooks/useModuleLayoutMutations.ts`.

## Gray Areas Presented

The agent identified 6 implementation gray areas after subtracting items already locked by ROADMAP success criteria and the F9 prompt:

1. Phase 1 scope: framework-only vs framework + `Text` seed.
2. TextSpan editor approach: `contentEditable` vs controlled textarea vs library.
3. Undo/redo scope: per-block vs whole-module session vs hybrid.
4. Dirty-state guard scope: route-only vs route+click-outside vs route+click-outside+beforeunload.
5. Reorder/autosave timing: shared 1000ms debounce vs immediate PUT.
6. Edit-mode entry: F9 gestures only vs explicit Edit button only vs both.

User selected: **all**.

## Per-Area Discussion

### Area 1 — Phase 1 scope

- **Options:** (a) strict framework, (b) framework + `Text` seed.
- **Recommendation:** b — without one real block, Phase 1 has no end-to-end UAT; Phase 2 inherits registry risk; smallest viable end-to-end slice.
- **User selected:** **b**.
- **Boundary note:** the `Text` block here is paragraph-only; Heading variants and lists stay in Phase 2 (BLOCK-01).

### Area 2 — TextSpan editor approach

- **Options:** (a) contentEditable + manual span tracking, (b) controlled textarea + bold-on-range, (c) library (Lexical/TipTap/Slate).
- **Recommendation:** a — F9 explicitly recommends contentEditable; library overkill against STAB-02 main-chunk budget; encapsulate in `<TextSpanEditor>` with tested `splitSpansAtSelection` / `mergeAdjacentSpans` utilities.
- **User selected:** **a**.

### Area 3 — Undo/redo scope

- **Options:** (a) per-block, (b) whole-module session stack, (c) hybrid.
- **Recommendation:** b — reorder + edit + delete should walk back together; single reducer; simpler than (c).
- **User selected:** **b**.
- **Locked specifics:** 50-entry cap, cleared on edit-mode exit, 150ms typing-burst coalescing, `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` (+ `Ctrl+Y` Windows redo).

### Area 4 — Dirty-state guard scope

- **Options:** (a) route only, (b) route + click-outside, (c) route + click-outside + beforeunload.
- **Recommendation:** a — F9 says click-outside flushes save (PUT is the safety net); `beforeunload` is theatrical.
- **User selected:** **a**.
- **Locked specifics:** React Router v7 `useBlocker`; if save in-flight when blocked, await it; on save failure, show shadcn `AlertDialog` with Discard / Keep editing.

### Area 5 — Reorder/autosave timing

- **Options:** (a) shared 1000ms debounce, (b) immediate PUT on drop.
- **Recommendation:** a — one save path, one set of failure modes, no race against subsequent edits.
- **User selected:** **a**.

### Area 6 — Edit-mode entry & exit

- **Options:** (a) F9 gestures only, (b) explicit Edit button only, (c) both.
- **Recommendation:** c — gesture-only fails keyboard/screen-reader path (jsx-a11y / STAB-02); Edit button is cheap and Enter-key-activatable.
- **User selected:** **c**.
- **Locked exit triggers:** click-outside (flush + exit), Escape (flush + exit), Save button (flush + exit), Cancel button (revert from snapshot + exit, history discarded).

## Deferred Ideas (captured for backlog)

- Real-time multi-user editing / conflict resolution beyond last-write-wins.
- Italic / underline / color / font-size formatting (explicitly out per F9).
- Comments / suggestions on blocks.
- Search-and-replace inside a module.
- Markdown / clipboard auto-conversion (paste = plain text only in v1).
- Block templates / snippets.
- Auto-generation of Breadcrumb content (Phase 8 owns; this phase only enforces empty-content invariant).

## Agent Discretion (no question asked — locked from F9 prompt and ROADMAP)

- Endpoint shape (`PUT /modules/{moduleId}` full payload).
- 1000ms autosave debounce value.
- Save-indicator copy ("Saving…" → "Saved" + Lucide Check, ~1.5s fade).
- Add-Block dropdown = shadcn `Popover`; block-type icons via Lucide; en+hu labels.
- `MODULE_ALLOWED_BLOCKS` lives in `src/features/styling/utils/module-type-config.ts`.
- Breadcrumb modules: content forced to `[]`; show auto-generation message in lieu of editor.
- Title modules allow `['Date', 'Text']`; FreeText allows all; full table sourced from F9 prompt + captured in PLAN.md.
- Edit-mode visual cue: warm-brown border/glow tied to a CSS variable.
- Block-delete confirmation only when block has non-empty content.
- Editor surface wrapped in `React.lazy()` (STAB-02 code-splitting).
- All user-visible strings in `src/i18n/{en,hu}.json`.

## Outcome

CONTEXT.md written at `.planning/phases/01-module-content-editor-core/01-CONTEXT.md` with 6 numbered decisions plus locked cross-cutting details, canonical refs, code context from scout, and deferred ideas.

Next command: `/gsd-ui-phase 1` then `/gsd-plan-phase 1` (or skip UI-phase and go straight to plan).

