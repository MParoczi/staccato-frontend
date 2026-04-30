---
plan_id: 01-05-editor-shell
phase: 1
phase_name: Module Content Editor (Core)
status: complete
wave: 2
completed_at: 2026-04-30
commits: [8fcf675, 17e498d, 304a0b7, 137d934]
key-files:
  created:
    - src/features/notebooks/hooks/useModuleContentMutation.ts
    - src/features/notebooks/hooks/useModuleContentMutation.test.tsx
    - src/features/notebooks/components/ModuleEditor/SaveIndicator.tsx
    - src/features/notebooks/components/ModuleEditor/SaveIndicator.test.tsx
    - src/features/notebooks/components/ModuleEditor/AddBlockPopover.tsx
    - src/features/notebooks/components/ModuleEditor/AddBlockPopover.test.tsx
    - src/features/notebooks/components/ModuleEditor/BlockRow.tsx
    - src/features/notebooks/components/ModuleEditor/BlockRow.test.tsx
    - src/features/notebooks/components/ModuleEditor/DeleteBlockDialog.tsx
    - src/features/notebooks/components/ModuleEditor/DeleteBlockDialog.test.tsx
    - src/features/notebooks/components/ModuleEditor/BreadcrumbEmptyState.tsx
    - src/features/notebooks/components/ModuleEditor/BreadcrumbEmptyState.test.tsx
    - src/features/notebooks/components/ModuleEditor/EditorToolbar.tsx
    - src/features/notebooks/components/ModuleEditor/EditorToolbar.test.tsx
    - src/features/notebooks/components/ModuleEditor/EditorLoadingShell.tsx
    - src/features/notebooks/components/ModuleEditor/EditorLoadingShell.test.tsx
    - src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx
    - src/features/notebooks/components/ModuleEditor/ModuleEditor.test.tsx
    - src/features/notebooks/components/ModuleEditor/index.ts
  modified:
    - src/index.css
    - package.json
    - pnpm-lock.yaml
deps_added:
  - "@dnd-kit/sortable@10.0.0"
  - "@dnd-kit/utilities@3.2.2"
tests:
  - useModuleContentMutation: 9/9 pass
  - SaveIndicator: 4/4 pass
  - AddBlockPopover: 4/4 pass
  - BlockRow: 4/4 pass
  - DeleteBlockDialog: 4/4 pass
  - BreadcrumbEmptyState: 2/2 pass
  - EditorToolbar: 6/6 pass
  - EditorLoadingShell: 2/2 pass
  - ModuleEditor: 13/13 pass
  - total new: 48/48 pass
---

# Plan 01-05 — Editor shell: ModuleEditor surface, mutation hook, toolbar, dnd-kit reorder, dialogs, save indicator

## Self-Check: PASSED

All five `must_haves.truths` from the plan frontmatter hold:

1. **ModuleEditor handles every required surface.** Edit-mode glow (`data-edit-mode="true"` + inline outline / boxShadow using `--editor-edit-glow-ring` and `--editor-edit-glow`), toolbar (sticky 40 px, all buttons + tooltips), Add Block popover (filtered by `MODULE_ALLOWED_BLOCKS[moduleType]`), vertical block list with `@dnd-kit/sortable` reorder (`PointerSensor` + `KeyboardSensor`), per-block delete with non-empty AlertDialog confirmation (and immediate-delete for empty blocks), save indicator (Idle/Saving/Saved/Failed via `useModuleContentMutation.status`), and Breadcrumb empty-state branch.
2. **`useModuleContentMutation` mirrors `useModuleLayoutMutations` shape but targets `PUT /modules/{id}` via `updateModuleFull`.** Pre-edit snapshot captured lazily on first `schedule`; trailing-edge `CONTENT_SAVE_DEBOUNCE_MS = 1000`; explicit `flush()`, `cancel()`, `revertOptimistic()` API; status auto-resets to `idle` 1500 ms after `saved`; cleanup on unmount.
3. **`MODULE_ALLOWED_BLOCKS` enforced both in UI and pre-flight.** AddBlockPopover renders only `MODULE_ALLOWED_BLOCKS[moduleType]` entries (UI gate). ModuleEditor's `enforceAllowedBlocks(moduleType, next)` runs inside `pushContent()` before `mutation.schedule()` (defense-in-depth) — throws in `import.meta.env.DEV`, silently filters in prod.
4. **422 errors translated and toasted; cache stays at user's edit.** `INVALID_BUILDING_BLOCK` → `t('editor.errors.invalidBuildingBlock')`; `BREADCRUMB_CONTENT_NOT_EMPTY` → `t('editor.errors.breadcrumbContentNotEmpty')`; otherwise `readServerMessage(error, t('editor.saveFailed'))`. Per CONTEXT decision (F9 prompt line 1449), cache is **not** auto-rolled back on save failure — Cancel button is the explicit rollback affordance via `revertOptimistic()`.
5. **`--editor-edit-glow` (and `--editor-edit-glow-ring`) added to `src/index.css` `@theme`.** Lines 62–63. ModuleEditor's outermost div consumes them inline (`outlineColor`, `boxShadow`).

## What was built

### Task 5.1 — CSS glow tokens + TextSpanEditor placeholder utility (commit `8fcf675`)
- Two new `@theme` tokens in `src/index.css` (lines 62–63):
  - `--editor-edit-glow: color-mix(in oklab, var(--color-primary) 35%, transparent)`
  - `--editor-edit-glow-ring: var(--color-primary)`
- `[data-text-span-editor][data-empty="true"]:before` rule (lines 184–187) closes plan 01-04's bridge: TextSpanEditor sets `data-empty="true"` when `totalLength(value) === 0` and the CSS surfaces `attr(data-placeholder)` as ghost text.
- `pnpm run build` parses CSS cleanly (TS errors elsewhere are pre-existing, see Notes).

### Task 5.2 — `useModuleContentMutation` hook (commit `17e498d`)
Optimistic + debounced module-content persistence (`src/features/notebooks/hooks/useModuleContentMutation.ts`, 266 lines). Mirrors `useModuleLayoutMutations`'s snapshot/timer pattern.

- `CONTENT_SAVE_DEBOUNCE_MS = 1000` (CONTEXT decision 5).
- `SAVED_INDICATOR_LINGER_MS = 1500` — auto-fades `saved` → `idle`.
- `pendingContentRef` + `timerRef` for the debounce; `snapshotRef` captured on first `schedule` after mount; `savedTimerRef` for the lingering `saved` chip.
- `dispatch()` builds the full PUT payload by reading the current cached `Module` (`gridX/Y/W/H/zIndex/moduleType`) and substituting `content`; calls `updateModuleFull(moduleId, payload)`. On success, replaces the optimistic entry and invalidates the query key. On failure, reads `error.response.data.code` to translate `INVALID_BUILDING_BLOCK` / `BREADCRUMB_CONTENT_NOT_EMPTY`, falls back to `readServerMessage(error, t('editor.saveFailed'))`, fires `toast.error(message)`, and **leaves the optimistic cache untouched**.
- `revertOptimistic()` — explicit Cancel-button affordance: `setQueryData` to `snapshotRef.current`, clear timers, drop pending, status → `idle`.
- `useEffect` cleanup drops timers on unmount.

9 tests (`useModuleContentMutation.test.tsx`): optimistic-then-PUT, 5× coalesce, INVALID_BUILDING_BLOCK toast, BREADCRUMB_CONTENT_NOT_EMPTY toast, `flush()`, `cancel()`, `revertOptimistic()` snapshot restore, unmount cleanup, full saving→saved→idle round-trip.

### Task 5.3 — Leaf components (commit `304a0b7`)
Seven thin presentational components (UI-SPEC §4.3-4.10) + 26 co-located tests. All tests use `vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }))` so assertions match raw key strings.

| Component | Highlights |
|---|---|
| `SaveIndicator` | `status` discriminated union → renders nothing on idle, `role="status" aria-live="polite"` for saving/saved, `role="alert"` for failed. Saved auto-fades after 1500 ms via internal `useEffect` + `setTimeout` (1 lint-rule suppression with rationale comment). Spinner uses `motion-safe:animate-spin`. |
| `AddBlockPopover` | shadcn `Popover`. Trigger: ghost `Plus` button. Content: `role="listbox"` of `MODULE_ALLOWED_BLOCKS[moduleType]` entries each rendering `BLOCK_REGISTRY[type].icon` + `t(BLOCK_REGISTRY[type].labelKey)`. Disabled variant for Breadcrumb wraps a `Tooltip` showing `editor.breadcrumbAutoGen`. |
| `BlockRow` | 24 px left gutter for `GripVertical` drag handle (`aria-label={t('editor.dragHandle')}`); top-right `Trash2` delete (`aria-label={t('editor.deleteBlock')}`); both reveal on hover/focus-within (`group-hover:opacity-100`, `group-focus-within:opacity-100`). Renders `BLOCK_REGISTRY[block.type].Editor`. Forwards `dragHandleProps` to the handle button. |
| `DeleteBlockDialog` | Wraps shadcn `AlertDialog`. Cancel default-focused (Radix). Confirm uses destructive Tailwind classes. |
| `BreadcrumbEmptyState` | `role="note"` + `Info` + `t('editor.breadcrumbAutoGen')`. |
| `EditorToolbar` | Sticky 40 px `role="toolbar"`. Composition: `AddBlockPopover` → divider → Bold (`aria-pressed={isBoldActive}`) → divider → Undo / Redo (disabled per `canUndo`/`canRedo`) → flex spacer → `SaveIndicator` → divider → Cancel ghost → Save default. Tooltips on every icon button include keyboard hints. Breadcrumb branch disables AddBlock and renders Save inside a Tooltip wrapping a `<span>` to keep the `disabled` button tooltip-able. |
| `EditorLoadingShell` | `role="status" aria-busy="true" aria-live="polite"` div with rounded skeleton + `motion-safe:animate-pulse`; accepts optional `minHeight` to mirror host module dimensions for `React.lazy` hydration. |

### Task 5.4 — `ModuleEditor` orchestrator (commit `137d934`)
`forwardRef<ModuleEditorHandle, ModuleEditorProps>` — orchestrates the whole edit-mode surface (~370 lines including `SortableRow` wrapper).

- **State + hooks composition:** `useEditHistory(module.content)` for undo/redo + `useModuleContentMutation({ pageId: module.lessonPageId, moduleId: module.id })` for the debounced PUT.
- **`pushContent(next, opts)` single sink:** runs `enforceAllowedBlocks()` defense-in-depth filter, calls `mutation.schedule()` (always — every keystroke updates the cache and the 1000 ms timer), and either pushes history immediately (`opts.immediateHistory: true` for Add/Delete/Reorder) or schedules a 150 ms typing-burst-coalesced `history.push` (CONTEXT decision 3).
- **Add Block:** `BLOCK_REGISTRY[type].create()` → append → `pushContent({ immediateHistory: true })`.
- **Delete:** if `isEmptyBlock(block)` (Text with no spans / all whitespace, or any unimplemented placeholder) → delete immediately. Else open `DeleteBlockDialog` → on confirm delete + push history.
- **Reorder:** `@dnd-kit/sortable` with `PointerSensor` (4 px activation) + `KeyboardSensor` (`sortableKeyboardCoordinates`). Items keyed `block-${index}` regenerated each render; `onDragEnd` uses `arrayMove` then `pushContent({ immediateHistory: true })`. `SortableRow` internal wrapper threads `setActivatorNodeRef` + `attributes` + `listeners` into `BlockRow`'s `dragHandleProps`.
- **Save flow:** `flushPendingPush()` → `mutation.flush()`. Returns `undefined` (nothing pending) → exit immediately. Returns a promise → exit on resolve; on reject stay in edit mode (toast already fired by hook).
- **Cancel flow:** clear pending push timer + `mutation.cancel()` + `mutation.revertOptimistic()` + `onExitEditMode()`.
- **Esc** = Save. **Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y** = flush-pending-push then `history.undo()` / `history.redo()` with `preventDefault`.
- **Breadcrumb branch:** `<BreadcrumbEmptyState />` replaces the block list; Save and AddBlock disabled (toolbar handles via `moduleType==='Breadcrumb'`).
- **Edit-mode glow:** `data-edit-mode="true"` + inline `outline: outline outline-2 outline-offset-2` (Tailwind) + inline `outlineColor: var(--editor-edit-glow-ring)` and `boxShadow: 0 0 0 6px var(--editor-edit-glow)`.
- **Imperative handle (`useImperativeHandle`):** `{ flush, cancel }` — plan 01-06 will wire click-outside to `handle.current.flush()` without prop drilling.
- **History → cache propagation:** a guarded `useEffect` watches `history.present` and reschedules a save after every undo/redo so the page-modules cache reflects the active history step.

13 tests (`ModuleEditor.test.tsx`) cover toolbar+block render, Breadcrumb branch (note + disabled buttons), Title popover lists exactly 2 entries, Add Block updates optimistic cache + enables Undo, debounced PUT after 1000 ms via `vi.useFakeTimers()`, Cancel reverts cache to snapshot + onExit, Save no-op exits, Save flush + onExit on resolve, imperative `ref.flush()` returns Promise + `ref.cancel()` reverts, empty Text block immediate-delete, non-empty Text block opens dialog → confirm removes, 422 INVALID_BUILDING_BLOCK toast + cache stays, `data-edit-mode` + glow CSS-var inline assertions. `<StubResizeObserver>` polyfill installed for jsdom (dnd-kit dependency).

## Acceptance criteria

| Criterion | Method | Status |
|-----------|--------|--------|
| `--editor-edit-glow:` in `src/index.css` | grep | ✓ (line 62) |
| `--editor-edit-glow-ring:` in `src/index.css` | grep | ✓ (line 63) |
| `useModuleContentMutation` exported | grep | ✓ |
| `CONTENT_SAVE_DEBOUNCE_MS = 1000` | grep | ✓ |
| `updateModuleFull` referenced in hook | grep | ✓ |
| Hook tests ≥ 7 | vitest | 9 ✓ |
| All 7 leaf component files exist | ls | ✓ |
| Leaf component tests ≥ 7 | vitest | 26 ✓ (4+4+4+4+2+6+2) |
| `aria-pressed` in `EditorToolbar.tsx` | grep | ✓ |
| `role="alert"` in `SaveIndicator.tsx` | grep | ✓ |
| `AlertDialog` in `DeleteBlockDialog.tsx` | grep | ✓ |
| `ModuleEditor.tsx` exists | ls | ✓ |
| `index.ts` re-exports `ModuleEditor` (default + named) | grep | ✓ |
| `forwardRef` in `ModuleEditor.tsx` | grep | ✓ |
| `data-edit-mode` in `ModuleEditor.tsx` | grep | ✓ |
| `useEditHistory` referenced | grep | ✓ |
| `useModuleContentMutation` referenced | grep | ✓ |
| `@dnd-kit/sortable` referenced | grep | ✓ |
| `isBlockAllowed` referenced | grep | ✓ |
| ModuleEditor tests ≥ 12 | vitest | 13 ✓ |
| `pnpm tsc --noEmit` clean | tsc | ✓ |
| Plan-05 ESLint clean | eslint | ✓ |

## Verification commands run

```bash
pnpm tsc --noEmit
# clean

pnpm test --run \
  src/features/notebooks/hooks/useModuleContentMutation.test.tsx \
  src/features/notebooks/components/ModuleEditor
# 9 files / 48 tests pass

pnpm exec eslint \
  src/features/notebooks/components/ModuleEditor/ \
  src/features/notebooks/hooks/useModuleContentMutation.ts
# clean
```

## Deviations

1. **`@dnd-kit/sortable` was NOT pre-installed.** Plan stated "already in `node_modules`; no new dep" but only `@dnd-kit/core@6.3.1` was vendored. Installed `@dnd-kit/sortable@10.0.0` + `@dnd-kit/utilities@3.2.2` (companions; major versions match the dnd-kit 10/utilities 3 line that pairs with core 6.3.x in the dnd-kit ecosystem). No breaking changes downstream.
2. **Toolbar Bold ↔ TextSpanEditor cross-wiring deferred.** The plan called for ModuleEditor to own a `Map<blockId, { toggleBold }>` populated via `TextSpanEditor`'s `onReady`. The current `BlockEditorProps` (`{ block, onChange }`) does not expose `onReady` / `onBoldStateChange` — extending the registry contract is out of scope for plan 01-05. Toolbar Bold renders with `aria-pressed=false` and a no-op handler; **Ctrl+B inside the contentEditable still works end-to-end** (`TextSpanEditor.toggleBold` is wired internally). Tracked as a plan 01-06 follow-up: widen `BlockEditorProps` to include optional `onReady`/`onBoldStateChange` callbacks; have `TextBlockEditor` forward them; populate the editor-API Map in `BlockRow` / `ModuleEditor`. Document in 01-06 plan if not already covered.
3. **EditorLoadingShell tests** (2) were added even though the plan only listed it as a suspense fallback (no acceptance criterion for tests). Treated as a small bonus.
4. **Pre-existing `pnpm run build` failures.** `tsc -b` (build mode) surfaces TS errors in unrelated test files (`profile/hooks/useLanguageSwitch.test.tsx` missing vitest globals, `styling/components/StyleEditorDrawer.test.tsx` `never` narrowing, `routes/notebook-layout.test.tsx` `description` field). Same noise category as documented in plan 01-01 SUMMARY (72 pre-existing failures from F2/F3/F7). Plan-05 surface itself compiles clean under both `pnpm tsc --noEmit` and `vitest --run`.

## Wave bridge

Plan 01-06 (Integration) consumes:

- `ModuleEditor` (default + named export) via `React.lazy(() => import('@/features/notebooks/components/ModuleEditor'))` — hydration boundary uses `<EditorLoadingShell />`.
- `ModuleEditorHandle.{ flush, cancel }` — host wires click-outside to `handle.current?.flush()` and the dirty-state `useBlocker` guard to `handle.current?.cancel()`.
- The `editor.unsaved*` i18n keys reserved in plan 01-01 (`unsavedTitle` / `unsavedDescription` / `unsavedKeepEditing` / `unsavedDiscard`) — wired by 01-06's nav-guard dialog.

Plan 01-06 will also address the Bold-tracking cross-wiring deferral noted under Deviations.

