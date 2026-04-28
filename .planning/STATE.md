# Staccato Frontend — STATE.md

*Last updated: 2026-04-28 after Phase 1 plan 01-02 complete (2/6 plans done)*

## Active Milestone

**v1 — Personal-grade music notebook**
- Strategy: **GSD-native** planning for all remaining work.
- Granularity: standard. Sequential execution. YOLO mode.
- Phases: 9 + 1 continuous (stabilization).
- Coverage: 100 % of v1 active requirements mapped.

## Current Phase

**Phase 1 — Module Content Editor (Core)** *(executing — 2/6 plans complete)*

- REQ: `EDIT-01` (+ `Text` block as registry seed; remainder of `BLOCK-01` stays in Phase 2)
- PRD source: `frontend-speckit-prompts.md` lines ~1402–1547 (Feature 9 prompt block)
- Context: `.planning/phases/01-module-content-editor-core/01-CONTEXT.md`
- UI-SPEC: `.planning/phases/01-module-content-editor-core/01-UI-SPEC.md`
- Research: `.planning/phases/01-module-content-editor-core/01-RESEARCH.md`
- Plans: 6 plans across 3 waves
  - Wave 1: `01-01-foundation` ✓ done · `01-02-pure-utils` ✓ done · `01-03-block-registry`
  - Wave 2: `01-04-text-block`, `01-05-editor-shell`
  - Wave 3: `01-06-integration`
- Codebase touchpoints: `src/features/styling/`, `src/features/notebooks/`, `src/api/modules.ts`, `src/i18n/{en,hu}.json`, `src/index.css`, `src/components/ui/*` (reuse-only)
- Status: **In progress — resume from `01-03-block-registry`**
- Resume command: `/skill:gsd-execute-phase 1` (will auto-skip 01-01 and 01-02 because their SUMMARY.md exist)

### Plan-by-plan progress

| Plan | Wave | Status | Notes |
|------|------|--------|-------|
| 01-01-foundation     | 1 | ✓ Complete (2026-04-28) | API client + TextSpan + MODULE_ALLOWED_BLOCKS + 35 i18n keys; 50/50 tests pass |
| 01-02-pure-utils     | 1 | ✓ Complete (2026-04-28) | TextSpan ops + history reducer + useDebouncedSave + useEditHistory; 50/50 new tests pass |
| 01-03-block-registry | 1 | Pending | Resume here |
| 01-04-text-block     | 2 | Pending | |
| 01-05-editor-shell   | 2 | Pending | |
| 01-06-integration    | 3 | Pending | |

## Phase Status Snapshot

| # | Phase                        | REQ        | Status              |
|---|------------------------------|-----------|---------------------|
| — | (8 prior features delivered) | various    | ✓ Validated (specs/001..008 historical) |
| 1 | Module Content Editor (Core) | EDIT-01    | Pending              |
| 2 | Text & List Blocks           | BLOCK-01   | Blocked on Phase 1   |
| 3 | Table Block                  | BLOCK-02   | Blocked on Phase 1   |
| 4 | Musical Notes Block          | BLOCK-03   | Blocked on Phase 1   |
| 5 | Chord Library & Fretboard    | CHORD-01   | Pending              |
| 6 | Chord Progression Block      | CHORD-02   | Blocked on Phase 5   |
| 7 | Chord Tablature Group Block  | CHORD-03   | Blocked on Phase 5   |
| 8 | Breadcrumb Module            | BLOCK-04   | Pending              |
| 9 | PDF Export & SignalR         | EXPORT-01  | Blocked on Phases 1–8 |
| ⟳ | Stabilization                | STAB-02    | Continuous           |

## Open Questions / Decisions Pending

- Stabilization track sequencing: which items land alongside which phases vs. a dedicated end-of-milestone sweep.

## Recent Events

- **2026-04-28** — **Phase 1, Plan 01-02-pure-utils complete (2/6).** Inline interactive execution (gsd-executor subagent confirmed non-functional under Copilot — narrates tools but cannot invoke them; same fallback as 01-01). Delivered four pure / hook-pure modules: `splitSpanAt` / `splitSpansAtSelection` / `mergeAdjacentSpans` / `totalLength` in `src/features/notebooks/utils/text-spans.ts` (23 tests; collapsed/single-span/3-span splits, reversed-selection normalisation, idempotent merge); `historyReducer` + `HISTORY_CAP=50` in `src/features/notebooks/utils/edit-history.ts` (11 tests; 60-push cap walk-back, dedupe-on-equal, LIFO undo); `useDebouncedSave<T>` in `src/features/notebooks/hooks/useDebouncedSave.ts` (9 tests with `vi.useFakeTimers`; coalescing, flush short-circuit, unmount cleanup, rejection propagation, stable refs); `useEditHistory` in `src/features/notebooks/hooks/useEditHistory.ts` (7 tests; 60-push→walk-to-block-10, ref stability). 50/50 new tests pass. `pnpm tsc --noEmit` clean. `pnpm run lint` clean (1 unrelated pre-existing warning in GSD tooling). 4 commits (`41a54b3`, `26f0a21`, `a6629e2`, `36a6ac9`).
- **2026-04-28** — **Phase 1, Plan 01-01-foundation complete (1/6).** Inline interactive execution after gsd-executor subagent failed under Copilot runtime (empty tool output). Delivered: `updateModuleFull` PUT client in `src/api/modules.ts`; `TextSpan {text,bold}` + `isTextSpan` guard in `src/lib/types/text-spans.ts` (re-exported from barrel); `MODULE_ALLOWED_BLOCKS` + `isBlockAllowed` in `src/features/styling/utils/module-type-config.ts` with 26 new tests (50/50 pass); 35 `editor.*` i18n keys in EN + HU per UI-SPEC §9. Self-Check PASSED on all 14 acceptance criteria. 5 commits (`4b85292`, `1a2447b`, `fde1ee9`, `7b32ea2`, `6f094bb`). Pre-existing test infra noise (72 failures across 17 files, all MSW `onUnhandledRequest: error` issues from F2/F3/F7) confirmed unrelated to 01-01.
- **2026-04-28** — **Phase 1 planning complete.** `/gsd-plan-phase 1` produced `01-RESEARCH.md` (Executive Summary, Validation Architecture covering 30+ test invariants, Implementation Notes for contentEditable / TanStack Query optimistic flush / `useBlocker` / `@dnd-kit/sortable` / `React.lazy`, Threat Model covering XSS/cache-poisoning/race/422, STAB-02 hooks). Then 6 PLAN.md files in 3 waves: foundation (API + types + i18n + MODULE_ALLOWED_BLOCKS), pure utilities (TextSpan ops + undo reducer + debounced-save hook), block registry framework, TextSpan editor + Text block, editor shell (toolbar + Add Block popover + dnd-kit reorder + dialogs + save indicator + content-mutation hook), and integration into ModuleCard (edit-mode entry + click-outside + dirty-nav `useBlocker` guard + `React.lazy` boundary + end-to-end round-trip test). Every plan cites EDIT-01; CONTEXT decisions 1–6 covered in `must_haves.truths`.
- **2026-04-28** — **Phase 1 UI-SPEC approved.** `/gsd-ui-phase 1` produced `01-UI-SPEC.md` covering 12 surfaces (selection chrome + Edit button, edit-mode glow, toolbar, Add Block popover, per-block chrome, save indicator, delete-block dialog, TextSpan editor, placeholder block, breadcrumb empty state, nav-guard dialog, Title constraint). Inline 6-dimension check passed (1 non-blocking a11y documentation flag re: AlertDialog default focus — fix in planning). 30+ i18n keys locked in EN + HU. One new CSS var `--editor-edit-glow`; otherwise pure reuse of existing shadcn primitives.
- **2026-04-28** — **Phase 1 context captured.** `/gsd-discuss-phase 1` ran in text-mode fallback; all 6 gray areas discussed; recommendations accepted (1=b, 2=a, 3=b, 4=a, 5=a, 6=c). Key decisions: Phase 1 ships `Text` block as registry seed; contentEditable TextSpan editor; whole-module undo/redo stack; route-only dirty guard; shared 1000ms debounce for all mutations; F9 gestures + explicit Edit button.
- **2026-04-28** — **Speckit → GSD migration.** GSD adopted as primary planning system for phases 1–9. Speckit retained read-only as historical record (`specs/001..008/`). `frontend-speckit-prompts.md` retained as PRD source (feature briefs feed into `/gsd-discuss-phase`). Config updated to enable workflow agents (research, plan_check, verifier).
- **2026-04-28** — Project initialized via `/gsd-new-project`. Codebase map created (`.planning/codebase/`). PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json written and committed.
- **2026-04 (prior)** — Bug audit `issues/bug-audit-2026-04.md` (15 items) cleared.
- **2026-04 (prior)** — Speckit Feature 8 (Grid Canvas & Module Placement) shipped.

## Pointers

- **Project context:** `.planning/PROJECT.md`
- **Requirements:** `.planning/REQUIREMENTS.md`
- **Roadmap:** `.planning/ROADMAP.md`
- **Config:** `.planning/config.json`
- **Codebase map:** `.planning/codebase/{STACK,INTEGRATIONS,ARCHITECTURE,STRUCTURE,CONVENTIONS,TESTING,CONCERNS}.md`
- **PRD source:** `frontend-speckit-prompts.md` (read for Phase N's prompt block, feed to discuss-phase)
- **Historical Speckit specs:** `specs/001..008/` (delivered work — reference only)
- **Frontend dev guide:** `CLAUDE.md`

