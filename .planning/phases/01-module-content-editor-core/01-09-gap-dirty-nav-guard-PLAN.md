---
plan_id: 01-09-gap-dirty-nav-guard
phase: 01-module-content-editor-core
wave: 1
depends_on: []
gap_closure: true
autonomous: true
requirements: []
files_modified:
  - src/features/notebooks/hooks/useUnsavedChangesGuard.ts
  - src/features/notebooks/components/UnsavedChangesDialog.tsx
  - src/features/notebooks/components/EditModeOverlay.tsx
  - src/features/notebooks/stores/editorStore.ts
  - src/features/notebooks/hooks/useUnsavedChangesGuard.test.tsx
  - src/i18n/en.json
  - src/i18n/hu.json
---

# Plan 01-09: Dirty-nav guard dialog

## Objective
Fix UAT Test 11 gap: navigating away from a module with unsaved or in-flight edits must show an "Unsaved changes" AlertDialog with "Keep editing" / "Discard" buttons. Currently navigation proceeds immediately and unsaved typing is silently lost.

## Hypothesis
One or more of the following is broken (Task 1 confirms):

1. The dirty flag is set on the debounced save tick instead of synchronously on the first keystroke, so the user-perceived dirty window (typing then immediately clicking away) has no blocker installed yet.
2. React Router v7's `useBlocker` is registered with `when: dirty` capturing a stale closure value; needs the callback form `useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname)`.
3. Sidebar nav uses raw `<a href>` instead of `<Link>` / `useNavigate`, so the router blocker never sees the navigation.
4. No `beforeunload` handler is registered for browser-back / hard-reload during in-flight save.
5. The `UnsavedChangesDialog` component / hook does not exist yet, or is mounted but never shown because the blocker callback returns `true` (allow) instead of `false` (block) on dirty.

## Tasks

### Task 1 — Investigate and write FINDINGS

<read_first>
- src/features/notebooks/components/EditModeOverlay.tsx
- src/features/notebooks/stores/editorStore.ts
- src/features/notebooks/components/ContentEditor.tsx
- src/features/notebooks/hooks/  (list all hooks; look for any guard / blocker / dirty hook)
- src/components/layout/  (sidebar — find how nav links are rendered)
- src/App.tsx (router setup — confirm BrowserRouter / createBrowserRouter / data router)
- node_modules/react-router/package.json (to confirm v7 and which API is in use)
</read_first>

<action>
1. Determine which dirty signal exists today:
   - Is there an `isDirty` selector on the editor store? When does it flip true — first keystroke or first debounced save tick?
   - Is there a `useBlocker` call anywhere in the editor? If yes, what does it pass for `when` / what does the callback return?
2. Determine the router setup. React Router v7's `useBlocker` requires a data router (`createBrowserRouter`). If the project uses `BrowserRouter` (non-data), `useBlocker` does not work and a different pattern is needed (history.block via custom hook or migrate to data router).
3. Determine the sidebar nav implementation. Search for `<a ` and `<Link` and `navigate(` inside `src/components/layout/`. If sidebar uses `<a href>`, `useBlocker` will not intercept those clicks.
4. Confirm whether `beforeunload` is registered anywhere (`grep -r "beforeunload" src/`).
5. Reproduce: write a vitest using `MemoryRouter` + `createMemoryRouter` (data router) where a component reports dirty=true, then a navigation is dispatched, and assert the navigation is blocked and a dialog opens. Mark `.failing` to capture the gap.
6. Write `.planning/phases/01-module-content-editor-core/01-09-FINDINGS.md` with: confirmed root causes, exact file:line, fix strategy (which router API to use, where to install the hook, whether sidebar links need migration to `<Link>`).
</action>

<acceptance_criteria>
- `01-09-FINDINGS.md` exists in the phase directory.
- File names whether the project uses a data router (createBrowserRouter) or non-data router (BrowserRouter).
- File lists every sidebar nav element that uses raw `<a>` and would bypass the blocker.
- Failing reproduction test checked in under describe "dirty-nav guard (gap 01-09)".
</acceptance_criteria>

### Task 2 — Implement `useUnsavedChangesGuard` hook

<read_first>
- 01-09-FINDINGS.md
- src/features/notebooks/stores/editorStore.ts
- node_modules/react-router/dist/index.d.ts (types for `useBlocker`)
</read_first>

<action>
Create `src/features/notebooks/hooks/useUnsavedChangesGuard.ts`. The hook accepts a single argument `isDirty: boolean` (or reads it from the editor store directly via selector). It must:

1. Maintain a ref `dirtyRef` that mirrors the latest `isDirty` so the blocker callback always reads the live value (no stale closure).
2. If the project uses a data router: call `useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname)`. Return `{ blocker, dialogOpen, onKeepEditing, onDiscard }` where:
   - `dialogOpen = blocker.state === 'blocked'`
   - `onKeepEditing = () => blocker.reset?.()`
   - `onDiscard = () => blocker.proceed?.()`
3. If the project uses a non-data router (BrowserRouter), implement an equivalent using `useNavigationType` + history listener, OR — preferred per Findings — migrate the editor's nav-blocking surface to a data router by wrapping the editor route with `createMemoryRouter`'s blocker semantics. (If migration is too invasive, the Findings step must explicitly approve a less-clean fallback.)
4. ALSO register a `beforeunload` listener while `dirtyRef.current` is true:
   ```ts
   useEffect(() => {
     const handler = (e: BeforeUnloadEvent) => {
       if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
     };
     window.addEventListener('beforeunload', handler);
     return () => window.removeEventListener('beforeunload', handler);
   }, []);
   ```
   This covers browser-back / Cmd+R / tab close where the router blocker doesn't fire.
5. Ensure `isDirty` flips to `true` SYNCHRONOUSLY on the first keystroke (not on the debounced save tick). If the editor store currently sets dirty only on save-start, fix it: any `onContentChange` (the same path that schedules the debounced save) must `setDirty(true)` immediately in the same setState call.
</action>

<acceptance_criteria>
- File `src/features/notebooks/hooks/useUnsavedChangesGuard.ts` exists.
- Hook exports a typed return shape including `dialogOpen`, `onKeepEditing`, `onDiscard`.
- Grep `grep "setDirty(true)" src/features/notebooks/stores/editorStore.ts` confirms dirty flips on the same code path that handles the first input event (not only on the save tick).
- Grep `grep "beforeunload" src/features/notebooks/hooks/useUnsavedChangesGuard.ts` returns 1+ matches.
- `pnpm run lint` exits 0; `pnpm run build` exits 0.
</acceptance_criteria>

### Task 3 — Build `UnsavedChangesDialog` and wire into editor

<read_first>
- 01-09-FINDINGS.md
- src/features/notebooks/components/EditModeOverlay.tsx
- src/components/ui/alert-dialog.tsx (shadcn/Radix AlertDialog primitive)
- src/i18n/en.json, src/i18n/hu.json
</read_first>

<action>
1. Create `src/features/notebooks/components/UnsavedChangesDialog.tsx` — a Radix `AlertDialog` controlled by props `{ open, onKeepEditing, onDiscard }`. Copy MUST be (locked):
   - Title: i18n key `notebooks.editor.unsavedChanges.title` → "Unsaved changes"
   - Description: i18n key `notebooks.editor.unsavedChanges.description` → "You have unsaved edits in this module. If you leave now, your changes will be lost."
   - Cancel button: i18n key `notebooks.editor.unsavedChanges.keepEditing` → "Keep editing"
   - Action button: i18n key `notebooks.editor.unsavedChanges.discard` → "Discard"
2. Add the four i18n keys to BOTH `src/i18n/en.json` and `src/i18n/hu.json` (Hungarian: "Mentetlen módosítások" / "A modulban mentetlen módosításaid vannak. Ha most elhagyod az oldalt, a módosítások elvesznek." / "Tovább szerkesztem" / "Elvetés").
3. In `EditModeOverlay.tsx` (or whichever component owns the editor lifetime in edit mode), call `useUnsavedChangesGuard(isDirty || isSaving)` and render `<UnsavedChangesDialog open={dialogOpen} onKeepEditing={onKeepEditing} onDiscard={onDiscard} />`. Use `isDirty || isSaving` so an in-flight save also blocks navigation (per UAT spec).
4. Verify all editor-adjacent navigation triggers go through React Router primitives: every `<a href="/...">` within the sidebar / shell that points at an internal route MUST be migrated to `<Link to="/...">` or wrapped in `useNavigate`. List of files to check is in Findings.
</action>

<acceptance_criteria>
- File `src/features/notebooks/components/UnsavedChangesDialog.tsx` exists.
- All 4 i18n keys exist in both `en.json` and `hu.json`.
- Grep confirms `useUnsavedChangesGuard` is called from `EditModeOverlay.tsx` (or equivalent owner).
- Grep `grep -nE 'href="/' src/components/layout/` shows zero remaining internal-route `<a href>` (all migrated to `<Link>`), or Findings explicitly justifies any exceptions.
- The Task 1 reproduction test passes (no `.failing`).
</acceptance_criteria>

### Task 4 — Regression test

<read_first>
- src/features/notebooks/hooks/useUnsavedChangesGuard.test.tsx (created in Task 1 or new)
</read_first>

<action>
Add the following test cases under describe "dirty-nav guard (gap 01-09)":

1. **dirty + router-link click → dialog opens, navigation deferred.**
2. **dirty + Keep Editing → dialog closes, navigation cancelled, URL unchanged.**
3. **dirty + Discard → dialog closes, navigation completes, URL changed.**
4. **clean + router-link click → no dialog, navigation completes immediately.**
5. **dirty + beforeunload event → `event.preventDefault()` was called, `returnValue` was set.** (Test the listener directly; jsdom won't actually show the browser prompt.)
6. **isDirty flips synchronously on first input** — render editor, dispatch one input event, assert `editorStore.getState().isDirty === true` synchronously (before any debounce flushes).

All 6 must pass; none `.skip` / `.only` / `.failing`.
</action>

<acceptance_criteria>
- `pnpm test src/features/notebooks/hooks/useUnsavedChangesGuard.test.tsx` exits 0.
- All 6 named cases run and pass.
- Test file references the bug ID `gap-01-09` in its describe block.
</acceptance_criteria>

## Verification

```bash
pnpm test src/features/notebooks/hooks/useUnsavedChangesGuard.test.tsx
pnpm run lint
pnpm run build
```

## must_haves

- truth: "Editing a module flips `isDirty` to true synchronously on the first keystroke (not deferred to the debounced save tick)."
- truth: "Attempting to navigate away from an editor in dirty or in-flight-save state opens the UnsavedChangesDialog and defers the navigation."
- truth: "Choosing 'Keep editing' cancels the navigation; choosing 'Discard' proceeds with it."
- truth: "Hard navigation (browser back, tab close, reload) while dirty triggers the browser's native beforeunload confirmation."
- truth: "The dirty-nav guard is covered by regression tests that fail on the pre-fix code and pass on the post-fix code."
