---
plan_id: 01-05-editor-shell
phase: 1
phase_name: Module Content Editor (Core)
wave: 2
depends_on: [01-01-foundation, 01-02-pure-utils, 01-03-block-registry]
requirements: [EDIT-01]
autonomous: true
files_modified:
  - src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx
  - src/features/notebooks/components/ModuleEditor/ModuleEditor.test.tsx
  - src/features/notebooks/components/ModuleEditor/EditorToolbar.tsx
  - src/features/notebooks/components/ModuleEditor/AddBlockPopover.tsx
  - src/features/notebooks/components/ModuleEditor/SaveIndicator.tsx
  - src/features/notebooks/components/ModuleEditor/BlockRow.tsx
  - src/features/notebooks/components/ModuleEditor/DeleteBlockDialog.tsx
  - src/features/notebooks/components/ModuleEditor/BreadcrumbEmptyState.tsx
  - src/features/notebooks/components/ModuleEditor/EditorLoadingShell.tsx
  - src/features/notebooks/components/ModuleEditor/index.ts
  - src/features/notebooks/hooks/useModuleContentMutation.ts
  - src/features/notebooks/hooks/useModuleContentMutation.test.ts
  - src/index.css
must_haves:
  truths:
    - "ModuleEditor handles edit-mode glow, toolbar, Add Block popover, vertical block list with @dnd-kit/sortable reorder, per-block delete with non-empty confirmation AlertDialog, save indicator (Idle/Saving/Saved/Failed), and breadcrumb empty-state."
    - "useModuleContentMutation mirrors the optimistic+debounce pattern from useModuleLayoutMutations but targets PUT /modules/{id} via the new updateModuleFull client."
    - "MODULE_ALLOWED_BLOCKS is enforced both in AddBlockPopover (UI gate) and inside the optimistic mutation's pre-flight (defense-in-depth)."
    - "All 422 server errors (INVALID_BUILDING_BLOCK, BREADCRUMB_CONTENT_NOT_EMPTY) are translated and surfaced as toast; cache rolls back to pre-edit snapshot."
    - "--editor-edit-glow CSS var is added to src/index.css @theme block per UI-SPEC §3."
---

# Plan 01-05 — Editor shell: ModuleEditor surface, mutation hook, toolbar, dnd-kit reorder, dialogs, save indicator

<objective>
Build the user-visible editor surface that hosts a module's `BuildingBlock[]` in edit mode. Owns the toolbar, the Add Block popover, the vertically-sortable block list with hover chrome, the delete-block AlertDialog, the save indicator, and the breadcrumb empty-state. Brings online the `useModuleContentMutation` hook that optimistically updates the page-modules cache and fires `PUT /modules/{moduleId}` on the trailing edge of a 1000 ms debounce.
</objective>

## Tasks

<task id="5.1" type="execute">
  <action>
    Append the edit-mode glow CSS variables to `src/index.css` `@theme` block per UI-SPEC §3:

    ```css
    @theme {
      /* …existing tokens… */
      --editor-edit-glow: color-mix(in oklab, var(--color-primary) 35%, transparent);
      --editor-edit-glow-ring: var(--color-primary);
    }
    ```

    Read the file first to confirm the existing `@theme` block location and to avoid duplicating any color-mix var that already exists.
  </action>
  <read_first>
    - src/index.css (existing @theme block + token list)
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §3 (glow contract)
  </read_first>
  <acceptance_criteria>
    - `grep -q "--editor-edit-glow:" src/index.css` exits 0
    - `grep -q "--editor-edit-glow-ring:" src/index.css` exits 0
    - `pnpm run build` exits 0 (CSS still parses)
  </acceptance_criteria>
</task>

<task id="5.2" type="tdd">
  <action>
    Create `src/features/notebooks/hooks/useModuleContentMutation.ts`. Clone the shape and rollback semantics of `useModuleLayoutMutations.scheduleLayoutUpdate` / `flushPendingLayoutUpdates` (read it first), but for full-module PUT.

    ```ts
    export interface UseModuleContentMutationArgs {
      pageId: string;
      moduleId: string;
    }

    export interface UseModuleContentMutationResult {
      /** Apply optimistic update to the page-modules cache and schedule a debounced PUT (1000 ms). */
      schedule: (nextContent: BuildingBlock[]) => void;
      /** Fire any pending PUT NOW; returns the in-flight promise (or undefined). */
      flush: () => Promise<Module> | undefined;
      /** Drop pending PUT without firing. Used by Cancel button. */
      cancel: () => void;
      /** Roll the cache back to the pre-edit snapshot. Used by Cancel button. */
      revertOptimistic: () => void;
      /** Mutation state for the save indicator. */
      status: 'idle' | 'saving' | 'saved' | 'failed';
      lastError: unknown;
    }

    export const CONTENT_SAVE_DEBOUNCE_MS = 1000;
    ```

    Implementation rules:
    - Use the new `updateModuleFull` client from plan 01-01 (PUT /modules/{moduleId}). Build the full payload by reading the current cached module (gridX, gridY, gridWidth, gridHeight, zIndex, moduleType) and substituting `content`.
    - Snapshot the pre-edit module on the FIRST `schedule` call after entering edit mode (mirrors `pendingSnapshots` ref pattern at lines 279-281 of useModuleLayoutMutations).
    - On schedule: optimistically `setQueryData<Module[]>(pageModulesQueryKey(pageId), …)` mapping the target module's `content`. Reset/restart a 1000 ms timer.
    - On flush: clear the timer, fire PUT immediately, return the promise.
    - On success: replace the optimistic entry with the server's saved Module; invalidate the query key. `status` transitions to `'saved'` (auto-resets to `'idle'` after 1.5 s — managed by a separate timer ref).
    - On failure: do NOT auto-rollback (per CONTEXT decision: "On save error: show error toast, keep local changes" — F9 prompt line 1449). Translate `INVALID_BUILDING_BLOCK` and `BREADCRUMB_CONTENT_NOT_EMPTY` via i18n keys `editor.errors.invalidBuildingBlock` / `editor.errors.breadcrumbContentNotEmpty`; fall back to `readServerMessage(error, t('editor.saveFailed'))`. Toast with `toast.error`. `status = 'failed'`. `lastError` populated.
    - `revertOptimistic()` is a separate explicit API for the Cancel button — restores the snapshot, clears `status` to `idle`, drops history. The save-failure path does NOT auto-call this.
    - `useEffect` cleanup clears all timer refs on unmount.

    Co-locate tests with MSW handlers (or `vi.fn()`-stubbed `updateModuleFull`):
    - `schedule` updates the cache optimistically and fires PUT after 1000 ms (`vi.useFakeTimers()`).
    - 5 schedules within 1000 ms coalesce into one PUT with the latest content.
    - On 422 `INVALID_BUILDING_BLOCK`: cache stays optimistic (NOT rolled back), `status === 'failed'`, toast called with translated message.
    - On 422 `BREADCRUMB_CONTENT_NOT_EMPTY`: same — translated message.
    - `flush()` fires PUT immediately and returns the promise.
    - `cancel()` drops pending — no PUT fires.
    - `revertOptimistic()` restores the pre-edit cache snapshot.
    - Unmount with pending PUT → no PUT fires (cleanup).
    - Round-trip: schedule with `[{type:'Text', spans:[{text:'hi',bold:false}]}]`, advance timers 1000 ms, MSW returns saved module → cache reflects saved server module.
  </action>
  <read_first>
    - src/features/notebooks/hooks/useModuleLayoutMutations.ts (canonical pattern — clone shape, especially lines 73-200 and 272-372)
    - src/features/notebooks/hooks/usePageModules.ts (for `pageModulesQueryKey`)
    - src/api/modules.ts (the new updateModuleFull from plan 01-01)
    - src/lib/types/modules.ts (Module shape)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export function useModuleContentMutation" src/features/notebooks/hooks/useModuleContentMutation.ts` exits 0
    - `grep -q "CONTENT_SAVE_DEBOUNCE_MS = 1000" src/features/notebooks/hooks/useModuleContentMutation.ts` exits 0
    - `grep -q "updateModuleFull" src/features/notebooks/hooks/useModuleContentMutation.ts` exits 0
    - `pnpm test useModuleContentMutation` exits 0 with ≥ 7 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="5.3" type="execute">
  <action>
    Create the small leaf components (one file each) per UI-SPEC sections 4.3-4.10. Each is a thin presentational component:

    **`SaveIndicator.tsx`** (UI-SPEC §4.6):
    ```tsx
    export function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'failed' }): JSX.Element | null;
    ```
    Idle → renders nothing. Saving → `Loader2` spinning + `t('editor.saving')`. Saved → `Check` + `t('editor.saved')` + auto-fade after 1.5 s via internal `setTimeout`. Failed → `AlertCircle` destructive + `t('editor.saveFailed')` + `role="alert"`. Saving + Saved use `role="status" aria-live="polite"`. Reduced-motion: spinner becomes a static dot (use `motion-safe:animate-spin` Tailwind variant).

    **`AddBlockPopover.tsx`** (UI-SPEC §4.4):
    ```tsx
    export function AddBlockPopover({
      moduleType,
      onSelect,
      disabled,
    }: {
      moduleType: ModuleType;
      onSelect: (type: BuildingBlockType) => void;
      disabled?: boolean;  // for Breadcrumb modules
    }): JSX.Element;
    ```
    Wraps shadcn `Popover`. Trigger is a ghost Button with `Plus` icon + `t('editor.addBlock')`. When `disabled`, renders the trigger with `disabled` and a Tooltip showing `t('editor.breadcrumbAutoGen')`. Content lists `MODULE_ALLOWED_BLOCKS[moduleType]` items, each rendering `BLOCK_REGISTRY[type].icon` + `t(BLOCK_REGISTRY[type].labelKey)`. Roving focus with arrow keys (use a simple `tabIndex` + `onKeyDown` on the list — or shadcn `Command` if already vendored). Width `w-60`, max-height `60vh`, `overflow-y-auto`. Selecting an item closes the popover and calls `onSelect(type)`.

    **`BlockRow.tsx`** (UI-SPEC §4.5):
    ```tsx
    export function BlockRow({
      block, index, onChange, onDelete, onMoveBy, dragHandleProps,
    }: {
      block: BuildingBlock; index: number;
      onChange: (next: BuildingBlock) => void;
      onDelete: () => void;
      onMoveBy: (delta: number) => void;        // for keyboard reorder fallback
      dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
    }): JSX.Element;
    ```
    Renders the block via `BLOCK_REGISTRY[block.type].Editor`. Wraps in a `group relative` div with a 24 px left gutter for the drag handle (`GripVertical`, `aria-label={t('editor.dragHandle')}`) and a `Trash2` delete button at `top-1 right-1`. Hover/focus reveal handle + delete (`opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`).

    **`DeleteBlockDialog.tsx`** (UI-SPEC §4.7):
    ```tsx
    export function DeleteBlockDialog({
      open, onOpenChange, onConfirm,
    }: {
      open: boolean;
      onOpenChange: (next: boolean) => void;
      onConfirm: () => void;
    }): JSX.Element;
    ```
    Wraps shadcn `AlertDialog` with the locked copy. Cancel default-focused. Confirm uses destructive variant.

    **`BreadcrumbEmptyState.tsx`** (UI-SPEC §4.10):
    ```tsx
    export function BreadcrumbEmptyState(): JSX.Element;
    ```
    Centered panel with `Info` icon + `t('editor.breadcrumbAutoGen')`.

    **`EditorToolbar.tsx`** (UI-SPEC §4.3):
    ```tsx
    export function EditorToolbar({
      moduleType, canUndo, canRedo, isBoldActive, saveStatus,
      onAddBlock, onUndo, onRedo, onToggleBold, onCancel, onSave,
    }: ToolbarProps): JSX.Element;
    ```
    Sticky top, 40 px height, `bg-card border-b`. Renders: AddBlockPopover (disabled when `moduleType==='Breadcrumb'`), divider, Bold ghost icon button (`aria-pressed={isBoldActive}`), divider, Undo / Redo (disabled per `canUndo`/`canRedo`), `flex-1` spacer, SaveIndicator, divider, Cancel ghost, Save filled-default. Tooltips on every icon-only button include keyboard shortcut hints. Save disabled when `moduleType==='Breadcrumb'` (tooltip `t('editor.breadcrumbNoSave')`).

    **`EditorLoadingShell.tsx`** (suspense fallback):
    Renders an empty div with the same border-radius and grid dimensions as the host module so `React.lazy` hydration causes no layout shift.

    Each component gets a co-located test file verifying:
    - It renders without throwing for the documented prop combinations.
    - i18n keys resolve (no missing-key warnings).
    - Disabled / `aria-pressed` / `role="alert"` etc. attributes are correctly applied per UI-SPEC §6.
  </action>
  <read_first>
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §4.3-4.10 (locked surfaces)
    - src/components/ui/popover.tsx, alert-dialog.tsx, button.tsx, tooltip.tsx (existing shadcn primitives)
    - src/features/notebooks/blocks/registry.ts (BLOCK_REGISTRY)
    - src/features/styling/utils/module-type-config.ts (MODULE_ALLOWED_BLOCKS — created plan 01-01)
  </read_first>
  <acceptance_criteria>
    - All 7 component files exist (`test -f` for each).
    - `pnpm test SaveIndicator AddBlockPopover BlockRow DeleteBlockDialog BreadcrumbEmptyState EditorToolbar` exits 0 (≥ 1 test per file → ≥ 7 total tests passing)
    - `grep -q "aria-pressed" src/features/notebooks/components/ModuleEditor/EditorToolbar.tsx` exits 0
    - `grep -q "role=\"alert\"" src/features/notebooks/components/ModuleEditor/SaveIndicator.tsx` exits 0
    - `grep -q "AlertDialog" src/features/notebooks/components/ModuleEditor/DeleteBlockDialog.tsx` exits 0
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="5.4" type="execute">
  <action>
    Create `src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` — the orchestrator that ties everything together. Co-locate `ModuleEditor.test.tsx`. Export `ModuleEditor` and a default export (so the host can `React.lazy(() => import('./ModuleEditor'))`).

    ```tsx
    export interface ModuleEditorProps {
      module: Module;
      onExitEditMode: () => void;
      /** True when the user explicitly clicked Cancel (revert) vs Save (commit) vs click-outside (commit). */
      // (handled internally — onExitEditMode just signals leave)
    }

    export function ModuleEditor({ module, onExitEditMode }: ModuleEditorProps): JSX.Element;
    export default ModuleEditor;
    ```

    Internal state + composition:
    - `useEditHistory(module.content)` for undo/redo. Push on every meaningful edit; coalesce typing bursts into a single push by debouncing the `push` call by 150 ms (per CONTEXT decision 3). Implement coalescing inline with a `setTimeout` ref — keep it tight; this is NOT in the pure reducer.
    - `useModuleContentMutation({ pageId: module.lessonPageId, moduleId: module.id })` returns `schedule, flush, cancel, revertOptimistic, status`.
    - `useState` for `isBoldActive` and `pendingBoldRef` — used by toolbar Bold toggle and TextSpanEditor coordination. Use a ref-API: ModuleEditor owns one `Map<blockId, { toggleBold }>` populated via TextSpanEditor's `onReady`.
    - `dnd-kit/sortable` setup — `DndContext` with `PointerSensor` + `KeyboardSensor`, `SortableContext` items = stable block keys (synthesize from index since blocks have no id; use `${index}-${block.type}` and rebuild on every reorder).
    - `delete-block` flow: empty block (Text with no spans / spans all empty-text) → delete immediately; non-empty → open `DeleteBlockDialog`, on confirm → delete + push history.
    - `Add Block` flow: select type from popover → `BLOCK_REGISTRY[type].create()` → append to content → push history → schedule save.
    - `Cancel` flow: `cancel()` (drop pending PUT) + `revertOptimistic()` + `onExitEditMode()`.
    - `Save` flow: `flush()` → on resolve → `onExitEditMode()`. On reject the toast already fires; stay in edit mode.
    - `Esc` keydown anywhere in the editor: same as Save (flush + exit).
    - `Click-outside` is the responsibility of the parent (ModuleCard, plan 01-06) — ModuleEditor exposes `flush` as part of an imperative ref it shares with the host. Implement via `forwardRef<{ flush, cancel }, ModuleEditorProps>` so plan 01-06 can wire click-outside without prop drilling.
    - **Breadcrumb branch:** if `module.moduleType === 'Breadcrumb'`, render `<BreadcrumbEmptyState />` instead of the block list. Toolbar's Save is disabled. AddBlockPopover is disabled.
    - **MODULE_ALLOWED_BLOCKS defense-in-depth:** every place that mutates `content` (Add, the rare future hook-driven mutation) routes through a single `pushContent(next)` helper that asserts `every(block => isBlockAllowed(module.moduleType, block.type))` — throws in dev, silently filters in prod (`import.meta.env.DEV`).
    - Edit-mode glow: outermost div has `data-edit-mode="true"` + Tailwind classes `outline outline-2 outline-offset-2` with `outlineColor: 'var(--editor-edit-glow-ring)'` and `boxShadow: '0 0 0 6px var(--editor-edit-glow)'` inline (or via a `.module-edit-glow` utility class added to `index.css`).

    Co-locate component-integration tests using MSW (or stubbed `updateModuleFull`):
    - Mounts with a `Module` whose moduleType is `Theory` and content has one Text block; renders the toolbar + the block; toolbar Save is enabled.
    - Typing in the Text block triggers a debounced PUT after 1000 ms; SaveIndicator transitions Idle → Saving → Saved.
    - `Ctrl+B` in the Text block toggles `aria-pressed` on the toolbar Bold button.
    - `Ctrl+Z` undoes the last edit; `Ctrl+Shift+Z` redoes.
    - Add Block → click `Date` (allowed for Theory? — check MODULE_ALLOWED_BLOCKS table; if not, use `Text`) → a new block row appears; PUT is scheduled.
    - Delete a non-empty Text block → DeleteBlockDialog opens → Confirm → block removed → PUT scheduled.
    - Delete an empty Text block → no dialog; block removed immediately.
    - Mount with `moduleType: 'Breadcrumb'` → `BreadcrumbEmptyState` renders, no block list, Save disabled.
    - Mount with `moduleType: 'Title'` → AddBlockPopover lists ONLY `Date` and `Text` (not the other 8 types).
    - Save button click → `flush()` resolves → `onExitEditMode` called.
    - Cancel button click → `revertOptimistic()` invoked → cache restored to pre-edit content → `onExitEditMode` called.
    - Server returns 422 `INVALID_BUILDING_BLOCK` → SaveIndicator shows `'failed'` state with destructive styling; cache stays at user's edited state (NOT rolled back per F9 prompt).
    - Server returns 422 `BREADCRUMB_CONTENT_NOT_EMPTY` → translated toast surfaces.
    - Reorder via dnd-kit keyboard sensor: focus drag handle, Space (lift), ArrowDown (move), Space (drop) → block order changes → PUT scheduled.
  </action>
  <read_first>
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md (entire spec — orchestrator implements every surface)
    - .planning/phases/01-module-content-editor-core/01-CONTEXT.md (locked decisions 1-6 + cross-cutting)
    - All files created in tasks 5.1-5.3
    - src/features/notebooks/hooks/useEditHistory.ts (plan 01-02)
    - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx (plan 01-04)
    - src/features/notebooks/blocks/registry.ts (plan 01-04 upgrades)
    - src/features/notebooks/utils/module-type-config.ts (MODULE_ALLOWED_BLOCKS, isBlockAllowed)
    - @dnd-kit/sortable types + docs (already in node_modules; no new dep)
  </read_first>
  <acceptance_criteria>
    - `test -f src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` exits 0
    - `test -f src/features/notebooks/components/ModuleEditor/index.ts` exits 0 and re-exports `ModuleEditor` (default + named)
    - `grep -q "forwardRef" src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` exits 0
    - `grep -q "data-edit-mode" src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` exits 0
    - `grep -q "useEditHistory" src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` exits 0
    - `grep -q "useModuleContentMutation" src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` exits 0
    - `grep -q "@dnd-kit/sortable" src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` exits 0
    - `grep -q "isBlockAllowed" src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` exits 0
    - `pnpm test ModuleEditor` exits 0 with ≥ 12 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

## Verification

```bash
pnpm tsc --noEmit
pnpm test useModuleContentMutation SaveIndicator AddBlockPopover BlockRow DeleteBlockDialog BreadcrumbEmptyState EditorToolbar ModuleEditor
pnpm run lint
pnpm run build
```

## Wave Notes

Wave 2 — runs after wave 1 plans (01-01, 01-02, 01-03) complete; runs in parallel with plan 01-04. ModuleEditor consumes BLOCK_REGISTRY from 01-03; if 01-04 has run, the Text entry is implemented and TextBlockEditor is used; if 01-04 hasn't run, ModuleEditor still works but Text blocks render as placeholders (planner may parallelize, executor may sequence — both are safe).

Plan 01-06 wires this into the host via `React.lazy` and adds the dirty-state `useBlocker` integration.

