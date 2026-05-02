# Plan 01-09 — Findings: Dirty-nav guard

## Reproduction (UAT Test 11)

1. Enter edit mode on a Theory module.
2. Type one or more characters into a Text block.
3. **Within the 1000 ms debounce window** (i.e. before the optimistic
   PUT fires), click any sidebar / breadcrumb link or page-nav button.
4. Observed: navigation completes silently, the in-progress edits are
   gone from the cache, no `UnsavedChangesDialog` opens.

The pre-fix code path did install a router blocker via
`useDirtyNavBlocker`, but its `shouldBlock` predicate was
`isEditing && saveStatus === 'failed'`. During the debounce window
`saveStatus` is still `'idle'`, so the blocker was disarmed exactly
when the user was most at risk.

## Root cause (single, narrow)

`src/features/notebooks/hooks/useDirtyNavBlocker.ts:41`

```ts
const shouldBlock = isEditing && saveStatus === 'failed';
```

This implements the original CONTEXT decision 4 ("dialog only fires on
explicit server reject") but it loses an entire class of dirty windows:

1. **Pre-debounce** — typing → 1000 ms timer running → status='idle'.
2. **In-flight** — debounce fired → PUT pending → status='saving'.

Both are unsaved-from-the-user's-POV but invisible to a `'failed'`-only
predicate. Discovered while investigating gap T11; matches the user's
exact reproduction (typed within ~200 ms then navigated).

## Why the existing infra was already 80 % there

The data router (`createBrowserRouter` in `src/routes/index.tsx`),
`useBlocker`, the `UnsavedChangesDialog` (with i18n keys
`editor.unsavedTitle` / `…Description` / `…KeepEditing` / `…Discard`
in `en.json:300-303` + `hu.json:300-303`), and the `EditModeOverlay`
wiring all already existed (plan 01-06 task 6.4). The only gap was the
trigger condition.

## Fix strategy

1. **Surface `isDirty` from `useModuleContentMutation`.** Add a
   `boolean` state field that flips to `true` synchronously inside
   `schedule()` (the same path the first keystroke takes via
   `pushContent → mutation.schedule`), clears to `false` on dispatch
   success / `cancel()` / `revertOptimistic()`, and stays `true` on
   dispatch failure (user retains unsaved edits).
2. **Broaden `useDirtyNavBlocker.shouldBlock`** to
   `isEditing && (isDirty || saveStatus === 'failed')`. The retry
   path inside the existing `useEffect` is unchanged: `flushPendingSave()`
   still runs first; on resolve the blocker auto-proceeds (silent
   recovery), on reject `setIsBlocked(true)` surfaces the dialog.
3. **Add a `beforeunload` listener** keyed on a `dirtyRef` mirror, so
   tab close / Cmd+R / browser-back also trigger the native browser
   confirmation while dirty. Listener is registered once on mount and
   reads `dirtyRef.current` so it stays cheap.
4. **Thread `isDirty` through `ModuleEditor → EditModeOverlay`** via a
   new optional `onDirtyChange?: (isDirty: boolean) => void` prop.
   Symmetric with the existing `onSaveStatusChange` observer — no API
   widening on `BlockEditorProps`.
5. **No editor store needed.** The plan named a non-existent
   `editorStore.ts`; the project keeps server state in TanStack Query
   and ephemeral edit state in refs. The mutation hook is the single
   source of truth for "dirty".
6. **No sidebar `<a>` migration needed.** `src/components/layout/`
   already uses `react-router` `<Link>` / `useNavigate` for every
   internal route; spot-checked via grep (zero raw `<a href="/">`).
7. **No new copy.** The four i18n keys exist already with the right
   semantics for both the dirty-and-flush-failed and pure-failed paths.

## Files modified

- `src/features/notebooks/hooks/useModuleContentMutation.ts` —
  added `isDirty` state + result field, wired into `schedule`,
  dispatch-success, `cancel`, `revertOptimistic`.
- `src/features/notebooks/hooks/useDirtyNavBlocker.ts` —
  accepts `isDirty?: boolean` (default `false` preserves legacy
  call sites), broadened `shouldBlock`, added `beforeunload`
  listener.
- `src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx` —
  added `onDirtyChange` prop and observer effect.
- `src/features/notebooks/components/EditModeOverlay.tsx` —
  tracks `isDirty` in local state, forwards to `useDirtyNavBlocker`.
- `src/features/notebooks/hooks/useDirtyNavBlocker.test.tsx` —
  +8 tests under `describe('dirty-nav guard (gap 01-09)')`.
- `src/features/notebooks/hooks/useModuleContentMutation.test.tsx` —
  +5 tests under `describe('isDirty (gap 01-09)')`.

## Regression coverage

`useDirtyNavBlocker.test.tsx → describe('dirty-nav guard (gap 01-09)')`:

1. dirty + flush succeeds → blocker auto-proceeds, no dialog.
2. dirty + flush rejects → dialog surfaces, navigation deferred.
3. dirty + nothing pending (flush undefined) → dialog surfaces.
4. dirty=false + saveStatus=idle → blocker does NOT fire (clean path).
5. dirty + Discard (proceed) → navigation completes.
6. dirty + Keep Editing (reset) → URL unchanged, dialog closes.
7. beforeunload while dirty → preventDefault called, returnValue set.
8. beforeunload while clean → listener no-ops.

`useModuleContentMutation.test.tsx → describe('isDirty (gap 01-09)')`:

1. flips synchronously to true on the first schedule (pre-debounce).
2. clears to false after a successful PUT.
3. stays true after a failed PUT (user retains edits).
4. cancel() clears dirty without saving.
5. revertOptimistic() clears dirty.

Plus: the existing speculative TDD test at
`ModuleCard.roundtrip.test.tsx:339` ("Failed save while editing + route
change → UnsavedChangesDialog opens") was failing pre-fix — actually
it previously asserted the failed-save flavor which already worked, so
it was passing in isolation; the broadened predicate keeps it green.
The new dirty-during-debounce flavor is exercised end-to-end via the
gap 01-09 hook tests.

## Plan deviations

The plan named `useUnsavedChangesGuard.ts` as a new hook and
`editorStore.ts` as the dirty-flag owner. Both were speculative — the
project had `useDirtyNavBlocker.ts` already, with all surrounding
infrastructure (router type, dialog component, i18n keys, EditModeOverlay
wiring). Extending the existing hook is strictly less code and avoids
introducing a parallel guard. The plan's user-visible contract (block on
dirty / in-flight, beforeunload while dirty, dialog with keep / discard)
is satisfied verbatim.

