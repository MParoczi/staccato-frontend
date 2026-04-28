---
plan_id: 01-06-integration
phase: 1
phase_name: Module Content Editor (Core)
wave: 3
depends_on: [01-04-text-block, 01-05-editor-shell]
requirements: [EDIT-01]
autonomous: true
files_modified:
  - src/features/notebooks/components/ModuleCard.tsx
  - src/features/notebooks/components/ModuleCard.test.tsx
  - src/features/notebooks/components/EditButton.tsx
  - src/features/notebooks/hooks/useEditModeEntry.ts
  - src/features/notebooks/hooks/useEditModeEntry.test.ts
  - src/features/notebooks/hooks/useDirtyNavBlocker.ts
  - src/features/notebooks/hooks/useDirtyNavBlocker.test.tsx
  - src/features/notebooks/components/UnsavedChangesDialog.tsx
must_haves:
  truths:
    - "Edit-mode entry: single-click on selected module, double-click on unselected module, AND explicit Edit button (Enter/Space) — all three paths verified."
    - "Edit-mode exit: click-outside flushes silently; Escape flushes; Save flushes; Cancel reverts."
    - "Route-change while edit-mode is active AND last save failed opens UnsavedChangesDialog via React Router v7 useBlocker; Discard proceeds, Keep editing cancels."
    - "ModuleEditor is loaded via React.lazy with EditorLoadingShell as Suspense fallback so the canvas-route initial chunk does not include the editor surface."
    - "Round-trip: edit a Text block → exit → reload page → block re-hydrates with identical spans + bold values."
---

# Plan 01-06 — Integration into ModuleCard: edit-mode entry, click-outside, dirty-nav guard, lazy boundary, end-to-end round-trip

<objective>
Wire the editor surface from plan 01-05 into the existing `ModuleCard` so users can actually open and edit a placed module on the canvas. Adds the explicit Edit button (a11y entry path), the gestures (single-click on selected, double-click on unselected), the click-outside / Escape / Save / Cancel exit paths, the React Router v7 dirty-nav guard, and the `React.lazy` boundary that keeps the editor out of the canvas-route initial chunk.
</objective>

## Tasks

<task id="6.1" type="execute">
  <action>
    Create `src/features/notebooks/components/EditButton.tsx` per UI-SPEC §4.1:

    ```tsx
    export interface EditButtonProps { onActivate: () => void; }
    export function EditButton({ onActivate }: EditButtonProps): JSX.Element;
    ```
    Ghost Button, `Pencil` icon 14 px, `t('editor.edit')` label, anchored top-right with `top-2 right-2 absolute`. Activates on click + Enter + Space (native button handles Enter/Space for free). `aria-label={t('editor.edit')}` redundantly set so screen readers always announce.

    Co-locate a small test: clicking activates; pressing Enter and Space activate; the button has the correct `aria-label`.
  </action>
  <read_first>
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §4.1
    - src/components/ui/button.tsx (existing variants)
  </read_first>
  <acceptance_criteria>
    - `test -f src/features/notebooks/components/EditButton.tsx` exits 0
    - `pnpm test EditButton` exits 0 with ≥ 3 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="6.2" type="tdd">
  <action>
    Create `src/features/notebooks/hooks/useEditModeEntry.ts` — encapsulates the click gesture rules from CONTEXT decision 6.

    ```ts
    export interface UseEditModeEntryArgs {
      isSelected: boolean;
      isEditing: boolean;
      onSelect: () => void;
      onEnterEdit: () => void;
    }

    export interface UseEditModeEntryResult {
      onClick: (e: React.MouseEvent) => void;
      onDoubleClick: (e: React.MouseEvent) => void;
    }

    export function useEditModeEntry(args: UseEditModeEntryArgs): UseEditModeEntryResult;
    ```

    Behavior:
    - `onClick`: if `isEditing` → no-op (let the editor's own handlers run). If `isSelected && !isEditing` → call `onEnterEdit()` (single-click on already-selected enters edit mode, per CONTEXT). If `!isSelected` → call `onSelect()`. (Double-click handler runs separately and is OS-dependent ordering with click; we don't try to suppress click before double-click — the second click on a selected module enters edit mode, which is fine UX.)
    - `onDoubleClick`: if `!isEditing` → call `onSelect()` then `onEnterEdit()` in that order. If `isEditing` → no-op (don't re-enter).
    - Both handlers respect `e.target` — if the click landed inside an interactive descendant (button, input, contentEditable) we should NOT consume it. Implement a small helper `isInteractiveTarget(target: EventTarget|null): boolean` that walks up to the gesture-root checking for `data-prevent-edit-entry="true"` (set on toolbar / dnd-kit handles / etc.). Return early in that case.

    Co-locate tests with `renderHook` + simulated events:
    - Single-click on `isSelected=false` → `onSelect` called, `onEnterEdit` not called.
    - Single-click on `isSelected=true, isEditing=false` → `onEnterEdit` called.
    - Double-click on `isSelected=false, isEditing=false` → `onSelect` called THEN `onEnterEdit` called.
    - Click while `isEditing=true` → neither callback called.
    - Click on a target with `data-prevent-edit-entry="true"` ancestor → neither callback called.
  </action>
  <read_first>
    - .planning/phases/01-module-content-editor-core/01-CONTEXT.md decision 6
  </read_first>
  <acceptance_criteria>
    - `grep -q "export function useEditModeEntry" src/features/notebooks/hooks/useEditModeEntry.ts` exits 0
    - `pnpm test useEditModeEntry` exits 0 with ≥ 5 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="6.3" type="tdd">
  <action>
    Create `src/features/notebooks/hooks/useDirtyNavBlocker.ts` and `UnsavedChangesDialog.tsx` per UI-SPEC §4.11 and CONTEXT decision 4.

    ```ts
    // useDirtyNavBlocker.ts
    import { useBlocker } from 'react-router';

    export interface UseDirtyNavBlockerArgs {
      isEditing: boolean;
      saveStatus: 'idle' | 'saving' | 'saved' | 'failed';
      flushPendingSave: () => Promise<unknown> | undefined;
    }

    export interface UseDirtyNavBlockerResult {
      isBlocked: boolean;
      proceed: () => void;
      reset: () => void;
    }

    export function useDirtyNavBlocker(args: UseDirtyNavBlockerArgs): UseDirtyNavBlockerResult;
    ```

    Behavior:
    - Calls `useBlocker((tx) => isEditing && saveStatus === 'failed')`. The blocker fires only when edit-mode is active AND the most-recent save failed (per CONTEXT decision 4: dialog only appears when there are *actually* unsaved changes the server rejected).
    - When `blocker.state === 'blocked'`, the hook also tries a final `flushPendingSave()` and awaits it; if that retry succeeds, automatically `blocker.proceed()` (best-effort recovery before bothering the user). If retry fails, surface `isBlocked = true`.
    - `proceed()` and `reset()` are pass-throughs to `blocker.proceed` / `blocker.reset`.

    `UnsavedChangesDialog.tsx`:
    ```tsx
    export function UnsavedChangesDialog({
      open, onKeepEditing, onDiscard,
    }: {
      open: boolean;
      onKeepEditing: () => void;
      onDiscard: () => void;
    }): JSX.Element;
    ```
    Wraps shadcn `AlertDialog`. Locked copy from UI-SPEC §4.11. Cancel default-focused (`AlertDialogCancel`). Discard button uses destructive variant.

    Co-locate `useDirtyNavBlocker.test.tsx` with a small `MemoryRouter` wrapper that drives `useBlocker`. Tests required:
    - Not editing → blocker never fires regardless of `saveStatus`.
    - Editing AND `saveStatus === 'failed'` AND retry-flush rejects → `isBlocked` becomes true.
    - Editing AND `saveStatus === 'failed'` AND retry-flush resolves → blocker auto-proceeds, `isBlocked` stays false.
    - Editing AND `saveStatus === 'idle'` (clean) → blocker does not fire.
    - `proceed()` allows the queued navigation.
    - `reset()` cancels the queued navigation.

    Note: react-router's `useBlocker` requires the data router. Check `src/App.tsx` and `src/routes/` to confirm we're using `createBrowserRouter` (the data router). If a legacy router is detected, document the gap and STOP — this gate must be a real `useBlocker`.
  </action>
  <read_first>
    - src/App.tsx (router setup — confirm createBrowserRouter)
    - src/routes/ (route definitions)
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §4.11
    - .planning/phases/01-module-content-editor-core/01-CONTEXT.md decision 4
    - src/components/ui/alert-dialog.tsx (existing primitive)
  </read_first>
  <acceptance_criteria>
    - `grep -q "useBlocker" src/features/notebooks/hooks/useDirtyNavBlocker.ts` exits 0
    - `grep -q "AlertDialog" src/features/notebooks/components/UnsavedChangesDialog.tsx` exits 0
    - `pnpm test useDirtyNavBlocker UnsavedChangesDialog` exits 0 with ≥ 6 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="6.4" type="execute">
  <action>
    Modify `src/features/notebooks/components/ModuleCard.tsx` to integrate the editor:

    1. **Add edit-mode state.** Local `useState<boolean>(false)` for `isEditing`. (Per F8 single-edit invariant, the canvas-level state already enforces only one module can be selected; layering edit-mode locally is fine.)
    2. **Render the EditButton** when `isSelected && !isEditing`.
    3. **Render the editor** when `isEditing` — wrapped in `<Suspense fallback={<EditorLoadingShell module={module} />}>`. Import via `React.lazy(() => import('./ModuleEditor'))`. Replace the read-only block list with the editor when in edit mode; keep the read-only `BlockListRenderer` (using `BLOCK_REGISTRY[type].Renderer`) for view-mode.
    4. **Wire `useEditModeEntry`** for click + double-click on the module body. Set `data-prevent-edit-entry="true"` on the editor's root and on every drag handle / button so clicks inside the editor don't re-trigger entry.
    5. **Click-outside handler:** use a ref to the module wrapper + a global `mousedown` listener mounted only while `isEditing`. If the click target is outside the wrapper, call the editor's imperative `flush()` (via the forwardRef from plan 01-05) and set `isEditing = false`.
    6. **Escape key:** while `isEditing`, listen for keydown on the document; on Escape → `flush()` then exit edit mode. Listener is cleaned up on `isEditing → false`.
    7. **Wire `useDirtyNavBlocker`** with `isEditing` and the editor's `saveStatus` + `flushPendingSave`. When `isBlocked`, render `<UnsavedChangesDialog open={true} onKeepEditing={reset} onDiscard={() => { editorRef.current?.cancel(); proceed(); }} />`.
    8. **View-mode renderer:** introduce a small inline `BlockListRenderer({ blocks })` component that maps each block via `BLOCK_REGISTRY[block.type].Renderer`. This is what the user sees when not editing.
    9. **F7 style record:** the existing ModuleCard already applies the F7 style record on its outer wrapper (notebook typography). The editor's content surface inherits it automatically through CSS — no additional plumbing needed beyond ensuring the editor's content `<div>` does not override the inherited fonts.

    Update `ModuleCard.test.tsx` (or add a new `ModuleCard.editor.test.tsx`) covering the integration paths:
    - Click on selected module → enters edit mode (Suspense fallback briefly visible, then ModuleEditor).
    - Double-click on unselected module → selected + entered edit mode.
    - Edit button → entered edit mode.
    - Click outside the editor → exits edit mode AND PUT was scheduled/flushed.
    - Escape → exits edit mode AND PUT flushed.
    - Save button (inside editor) → exits edit mode after PUT resolves.
    - Cancel button → exits edit mode AND cache reverts to pre-edit content.
    - Round-trip: in MSW, a mounted `<MemoryRouter><QueryClientProvider><ModuleCard module={textModuleFixture} /></QueryClientProvider></MemoryRouter>` — enter edit mode, type "hello world" into the Text block, advance fake timers 1000 ms, MSW intercepts PUT and echoes back the saved module, exit edit mode, re-mount with the saved module → renderer shows "hello world".
    - Server returns 422 → SaveIndicator shows failed; click a `<Link>` to another route → `UnsavedChangesDialog` opens; "Discard" → navigation proceeds, edit-mode exited, cache reverts.
  </action>
  <read_first>
    - src/features/notebooks/components/ModuleCard.tsx (existing read-only render target — DO NOT break F8 grid placement / drag / resize / layer)
    - src/features/notebooks/components/ModuleEditor/index.ts (plan 01-05)
    - src/features/notebooks/blocks/registry.ts (plan 01-04 with Text upgraded)
    - src/features/notebooks/hooks/useEditModeEntry.ts (task 6.2)
    - src/features/notebooks/hooks/useDirtyNavBlocker.ts (task 6.3)
    - src/features/notebooks/components/UnsavedChangesDialog.tsx (task 6.3)
    - src/features/notebooks/components/EditButton.tsx (task 6.1)
  </read_first>
  <acceptance_criteria>
    - `grep -q "React.lazy" src/features/notebooks/components/ModuleCard.tsx` exits 0
    - `grep -q "Suspense" src/features/notebooks/components/ModuleCard.tsx` exits 0
    - `grep -q "useEditModeEntry" src/features/notebooks/components/ModuleCard.tsx` exits 0
    - `grep -q "useDirtyNavBlocker" src/features/notebooks/components/ModuleCard.tsx` exits 0
    - `grep -q "EditButton" src/features/notebooks/components/ModuleCard.tsx` exits 0
    - `grep -q "BLOCK_REGISTRY" src/features/notebooks/components/ModuleCard.tsx` exits 0
    - `pnpm test ModuleCard` exits 0 with ≥ 8 NEW tests passing (existing F8 ModuleCard tests must STILL pass — this is a regression gate)
    - `pnpm tsc --noEmit` exits 0
    - `pnpm run lint` exits 0
    - `pnpm run build` exits 0
    - **Bundle check:** verify the editor lives in a separate chunk by inspecting Vite's build output: `find dist/assets -name "ModuleEditor-*.js" | head -1` returns a non-empty path (the lazy chunk name pattern Vite uses).
  </acceptance_criteria>
</task>

<task id="6.5" type="execute">
  <action>
    **End-to-end round-trip Vitest test** at `src/features/notebooks/components/ModuleCard.roundtrip.test.tsx`. This is the goal-backward test that verifies all 9 acceptance criteria from CONTEXT collectively.

    Setup: MSW handlers for `GET /pages/:id/modules`, `PUT /modules/:id` (echoes back the request body as the saved module). MemoryRouter, QueryClientProvider with a fresh QueryClient.

    Scenario (single integration test, one big assertion chain):
    1. Mount the page-level component (or smallest surrounding container that exercises the full canvas + ModuleCard pipeline) with a fixture page containing one Theory module whose `content = []`.
    2. Click the module to select it; assert toolbar/Edit button is visible.
    3. Click the Edit button; assert Suspense fallback then editor renders.
    4. Click Add Block → choose `Text`; assert one Text block row with empty TextSpanEditor.
    5. Type "Hello "; press Ctrl+B; type "world"; assert TextSpanEditor shows "Hello " (non-bold) and "world" (bold).
    6. Advance fake timers by 1000 ms; assert the MSW handler received exactly one PUT with body `{ moduleType:'Theory', gridX, gridY, gridWidth, gridHeight, zIndex, content: [{type:'Text', spans:[{text:'Hello ', bold:false}, {text:'world', bold:true}]}] }` (deep-equal).
    7. Assert SaveIndicator transitioned through Saving → Saved.
    8. Press Ctrl+Z (undo); assert "world" disappears (or becomes pre-bold-toggle state — match the actual reducer output).
    9. Press Ctrl+Shift+Z (redo); assert state returns.
    10. Press Escape; assert exit-edit-mode and one final PUT flushed (if any pending).
    11. Re-render the same component with the latest cached module (simulating a full reload); assert the Renderer shows the bold "world" rendered with `font-weight: 700`.
    12. Enter edit mode again; click the delete-block button on the (non-empty) Text block; assert DeleteBlockDialog opens with the locked title; click Confirm; assert the block is removed and a PUT with `content: []` is dispatched after debounce.
    13. Verify breadcrumb branch separately: re-mount with a Breadcrumb-type module; assert `BreadcrumbEmptyState` renders, AddBlockPopover trigger is disabled, Save is disabled.
    14. Verify Title branch: re-mount with a Title-type module; click Add Block; assert popover lists ONLY `Date` and `Text`.

    Track which CONTEXT acceptance criteria each step covers; comment them inline (`// AC #2: autosave + saving/saved indicator`).
  </action>
  <read_first>
    - .planning/phases/01-module-content-editor-core/01-CONTEXT.md "Locked Acceptance Criteria" 1-9
    - src/test-setup.ts (Vitest + MSW config)
    - All Phase-1 source files
  </read_first>
  <acceptance_criteria>
    - `test -f src/features/notebooks/components/ModuleCard.roundtrip.test.tsx` exits 0
    - `pnpm test ModuleCard.roundtrip` exits 0 — the single round-trip test passes
    - The test file references all 9 ACs in inline comments (`grep -c "// AC #" src/features/notebooks/components/ModuleCard.roundtrip.test.tsx` returns ≥ 9)
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

## Verification

```bash
pnpm tsc --noEmit
pnpm test EditButton useEditModeEntry useDirtyNavBlocker UnsavedChangesDialog ModuleCard ModuleCard.roundtrip
pnpm run lint
pnpm run build
```

The build command also produces the chunk-split evidence for the `React.lazy` boundary (acceptance criterion in task 6.4).

## Wave Notes

Wave 3 — runs after wave 2 (plans 01-04, 01-05). This is the integration step that turns Phase 1 into something a user can actually open. After this plan completes, every acceptance criterion 1–9 from CONTEXT is verifiable via the round-trip test in task 6.5.

Phase 1 is complete when this plan + all earlier plans' tests pass and the round-trip test passes.

