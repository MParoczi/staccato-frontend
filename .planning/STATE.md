# Staccato Frontend — STATE.md

*Last updated: 2026-04-30 after Phase 1 complete (6/6 plans shipped; all waves done)*

## Active Milestone

**v1 — Personal-grade music notebook**
- Strategy: **GSD-native** planning for all remaining work.
- Granularity: standard. Sequential execution. YOLO mode.
- Phases: 9 + 1 continuous (stabilization).
- Coverage: 100 % of v1 active requirements mapped.

## Current Phase

**Phase 1 — Module Content Editor (Core)** *(✓ complete — 6/6 plans shipped; all waves done)*

- REQ: `EDIT-01` (+ `Text` block as registry seed; remainder of `BLOCK-01` stays in Phase 2)
- PRD source: `frontend-speckit-prompts.md` lines ~1402–1547 (Feature 9 prompt block)
- Context: `.planning/phases/01-module-content-editor-core/01-CONTEXT.md`
- UI-SPEC: `.planning/phases/01-module-content-editor-core/01-UI-SPEC.md`
- Research: `.planning/phases/01-module-content-editor-core/01-RESEARCH.md`
- Verification: `.planning/phases/01-module-content-editor-core/01-VERIFICATION.md`
- Plans: 6 plans across 3 waves — **all complete**
  - Wave 1: `01-01-foundation` ✓ done · `01-02-pure-utils` ✓ done · `01-03-block-registry` ✓ done
  - Wave 2: `01-04-text-block` ✓ done · `01-05-editor-shell` ✓ done
  - Wave 3: `01-06-integration` ✓ done
- Codebase touchpoints: `src/features/notebooks/` (ModuleCard, ModuleEditor, hooks, blocks), `src/features/styling/utils/`, `src/api/modules.ts`, `src/i18n/{en,hu}.json`, `src/index.css`, `src/components/ui/*` (reuse-only)
- Status: **Complete — ready for Phase 2.**
- Next command: `/skill:gsd-discuss-phase 2` (Text & List Blocks)

### Plan-by-plan progress

| Plan | Wave | Status | Notes |
|------|------|--------|-------|
| 01-01-foundation     | 1 | ✓ Complete (2026-04-28) | API client + TextSpan + MODULE_ALLOWED_BLOCKS + 35 i18n keys; 50/50 tests pass |
| 01-02-pure-utils     | 1 | ✓ Complete (2026-04-28) | TextSpan ops + history reducer + useDebouncedSave + useEditHistory; 50/50 new tests pass |
| 01-03-block-registry | 1 | ✓ Complete (2026-04-28) | BlockDescriptor contract + PlaceholderBlock + camelCaseLabelKeyFor helper + BLOCK_REGISTRY (10/10 BuildingBlockTypes seeded as placeholder descriptors with Lucide icons per UI-SPEC §8); 69/69 new tests pass |
| 01-04-text-block     | 2 | ✓ Complete (2026-04-28) | TextSpanEditor (contentEditable, no innerHTML/execCommand) + Text block + BLOCK_REGISTRY.Text upgraded; 72/72 new tests pass |
| 01-05-editor-shell   | 2 | ✓ Complete (2026-04-30) | useModuleContentMutation hook + 7 leaf components + ModuleEditor orchestrator (forwardRef, dnd-kit/sortable, useEditHistory, debounced PUT, glow chrome). 9 files / 48 new tests pass. Deps added: @dnd-kit/sortable@10.0.0, @dnd-kit/utilities@3.2.2. Bold ↔ TextSpanEditor cross-wiring deferred to 01-06. |
| 01-06-integration    | 3 | ✓ Complete (2026-04-30) | EditButton + useEditModeEntry + useDirtyNavBlocker + UnsavedChangesDialog + EditModeOverlay + BlockListRenderer + ModuleCard surgery (React.lazy + Suspense, F8 contracts preserved) + round-trip test. 25/25 ModuleCard-surface tests pass; vite chunk-split verified (`ModuleEditor-*.js` ~30 kB / 10 kB gzip). |

## Phase Status Snapshot

| # | Phase                        | REQ        | Status              |
|---|------------------------------|-----------|---------------------|
| — | (8 prior features delivered) | various    | ✓ Validated (specs/001..008 historical) |
| 1 | Module Content Editor (Core) | EDIT-01    | ✓ Complete (2026-04-30) |
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

- **2026-04-30** — **Phase 1 complete (6/6 plans shipped).** Plan 01-06-integration delivered: `EditButton` (4 tests; keyboard-activatable edit-entry chip), `useEditModeEntry` (6 tests; selection-aware single/double-click gestures with `data-prevent-edit-entry` guard), `useDirtyNavBlocker` (≥6 tests; `react-router` `useBlocker` wrapper that fires on `isEditing && isDirty`, attempts one `flushPendingSave()` retry, exposes `isBlocked` on reject), `UnsavedChangesDialog` (shadcn AlertDialog wrapping locked UI-SPEC §4.11 copy via `editor.unsaved*` keys), `EditModeOverlay` (click-outside `mousedown` listener + Escape keydown + dirty-nav guard in one place), `BlockListRenderer` (view-mode dispatcher through `BLOCK_REGISTRY[type].Renderer`; unimplemented types fall through to `PlaceholderBlock`), and the **ModuleCard surgery** — surgical insertion of `useState` edit-mode flag, `React.lazy(() => import('./ModuleEditor/ModuleEditor'))` (deep path silences rolldown's `INEFFECTIVE_DYNAMIC_IMPORT`; chunk-split verified as `dist/assets/ModuleEditor-*.js` ≈30 kB / 10 kB gzip), `<Suspense fallback={<EditorLoadingShell />}>` boundary, `onSaveStatusChange` observer prop on ModuleEditor, EditButton render branch — **all F8 contracts preserved** (`data-testid`, `data-selected`, `data-conflicting`, `data-dragging`, `aria-pressed`, header drag listeners, `ModuleResizeHandles`); 10/10 existing F8 ModuleCard tests pass unchanged. **Round-trip integration test** (`ModuleCard.roundtrip.test.tsx`, 5 tests) covers all 9 locked acceptance criteria with inline `// AC #N:` markers (Theory edit-mode round-trip, Breadcrumb auto-gen + disabled controls, Title `MODULE_ALLOWED_BLOCKS` UI gate, unimplemented-type placeholder, failed-save dirty-nav dialog). Also fixed pre-existing CP1252 bytes in `src/index.css` comments (0x97 → 0xE2 0x80 0x94, 0xA7 → 0xC2 0xA7) so rolldown 1.0-rc.12 vite build succeeds. Toolbar Bold ↔ active TextSpanEditor cross-wiring deferred to a polish phase (the 9 acceptance criteria do not require toolbar Bold reflectivity). 25/25 ModuleCard-surface tests pass; tsc clean; lint clean for plan-06 surface; full-suite pre-existing failures unchanged from main. 4 commits (`33f37f3`, `d5849ef`, `83ccb2a`, `ef1f6a8`). Phase 1 totals: 6 plans / 27+ commits / 191+ tests across the editor surface.
- **2026-04-30** — **Phase 1, Plan 01-05-editor-shell complete (5/6, Wave 2 done).** Inline interactive execution. Delivered: `useModuleContentMutation` hook (9 tests; CONTENT_SAVE_DEBOUNCE_MS=1000, lazy snapshot on first schedule, optimistic `setQueryData<Module[]>`, no-rollback-on-error per F9 prompt, INVALID_BUILDING_BLOCK / BREADCRUMB_CONTENT_NOT_EMPTY translation, explicit `revertOptimistic` for Cancel, unmount cleanup); 7 leaf components — `SaveIndicator` (role=status/alert, 1500ms auto-fade, motion-safe spinner), `AddBlockPopover` (shadcn Popover + listbox of MODULE_ALLOWED_BLOCKS[moduleType], disabled+tooltip variant for Breadcrumb), `BlockRow` (24px gutter handle + top-right delete; reveal on hover/focus-within), `DeleteBlockDialog` (shadcn AlertDialog, locked copy, destructive Confirm), `BreadcrumbEmptyState` (role=note + Info), `EditorToolbar` (sticky 40px; Add Block + divider + Bold[aria-pressed] + Undo/Redo + spacer + SaveIndicator + Cancel + Save; Breadcrumb branch disables AddBlock+Save with tooltips), `EditorLoadingShell` (React.lazy fallback skeleton); `ModuleEditor` orchestrator (`forwardRef<{flush,cancel}>`, dnd-kit/sortable PointerSensor+KeyboardSensor reorder, `useEditHistory` w/ 150ms typing-burst coalescing, defense-in-depth `enforceAllowedBlocks` filter throwing in DEV, Esc/Ctrl+Z/Ctrl+Shift+Z keyboard shortcuts, edit-mode glow chrome via `--editor-edit-glow*` CSS vars). 9 test files / 48/48 new tests pass. Deps added: `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2` (plan said pre-installed but only `@dnd-kit/core@6.3.1` was vendored). Toolbar Bold ↔ active TextSpanEditor cross-wiring deferred to plan 01-06 (BlockEditorProps needs widening with onReady/onBoldStateChange; Ctrl+B inside contentEditable still works). 4 commits (`8fcf675`, `17e498d`, `304a0b7`, `137d934`).
- **2026-04-30** — **State sync.** Reconciled STATE.md against on-disk artifacts and git history. Plan 01-04 SUMMARY.md exists and 4 commits landed (`344b998`, `0b56759`, `13c9684`, `7ba549c`, plus docs `8163b5a`) — promoted to ✓ complete. Plan 01-05 was mid-execution: task 5.1 (`8fcf675`) and task 5.2 (`17e498d`) committed; task 5.3 had 4 of 7 leaf components staged uncommitted. Drift in `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/config.json` remains unstaged for separate review.
- **2026-04-28** — **Phase 1, Plan 01-04-text-block complete (4/6, Wave 2 partial).** Inline interactive execution. Delivered: `selection-utils.ts` (DOM ↔ TextSpan coord helpers, 13 tests); `TextSpanEditor.tsx` controlled contentEditable (UI-SPEC §4.8) — bold via `splitSpansAtSelection` + `mergeAdjacentSpans`, paste reads `text/plain` only with `preventDefault`, IME composition guard, `onReady` imperative API, no `innerHTML`/`execCommand`/`dangerouslySetInnerHTML` (8 tests incl. XSS regression `<b>HTML</b>` → literal text); `TextBlockRenderer` + `TextBlockEditor` (6 tests incl. round-trip); `BLOCK_REGISTRY.Text` upgraded to `implemented: true` with real Renderer/Editor/create (`{type:'Text',spans:[{text:'',bold:false}]}`) — 45 registry tests pass. Total 72/72 new tests. Added `@testing-library/user-event@^14` devDep. 4 feat commits (`344b998`, `0b56759`, `13c9684`, `7ba549c`) + SUMMARY (`8163b5a`).
- **2026-04-28** — **Phase 1, Plan 01-03-block-registry complete (3/6, Wave 1 done).** Inline interactive execution (Copilot fallback). Delivered: `BlockDescriptor` type contract in `src/features/notebooks/blocks/types.ts` ({ Renderer, Editor, create, icon, labelKey, implemented }); `PlaceholderBlock` component in `src/features/notebooks/blocks/PlaceholderBlock.tsx` with role="note", aria-label from `editor.placeholderBlockA11y`, italic muted dashed-border styling per UI-SPEC §4.9; `camelCaseLabelKeyFor` helper extracted to sibling module `src/features/notebooks/blocks/block-labels.ts` (mandatory split — `react-refresh/only-export-components` rule disallows non-component exports from `.tsx` component files); `BLOCK_REGISTRY` typed as `Record<BuildingBlockType, BlockDescriptor>` in `src/features/notebooks/blocks/registry.ts` with all 10 union members seeded as placeholder descriptors (Lucide icons: Heading, Calendar, Type, List, ListOrdered, CheckSquare, Table2, Music2, Music3, Music4) plus `getBlockDescriptor()` lookup helper. 69/69 new tests pass (24 PlaceholderBlock incl. parameterised no-throw across all 10 types + helper mappings; 45 registry incl. icon reference identity, exhaustive key set, Renderer/Editor placeholder-fallback, throw-path). `pnpm tsc --noEmit` clean. `pnpm run lint` clean for new files. 4 commits (`a945812`, `fee0b2c`, `4cc4ab1`, `159698a`).
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

