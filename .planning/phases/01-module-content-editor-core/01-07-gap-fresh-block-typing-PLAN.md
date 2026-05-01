---
plan_id: 01-07-gap-fresh-block-typing
phase: 01-module-content-editor-core
wave: 1
depends_on: []
gap_closure: true
autonomous: true
requirements: []
files_modified:
  - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx
  - src/features/notebooks/components/ContentEditor.tsx
  - src/features/notebooks/components/EditModeOverlay.tsx
  - src/features/notebooks/stores/editorStore.ts
  - src/features/notebooks/components/ContentEditor.test.tsx
---

# Plan 01-07: Fresh-block typing fix

## Objective
Fix UAT Test 3 gap: typing into a freshly-added Text block (after picking "Text" from the Add Block popover) does not update content or save. Asymmetry: paste works on fresh blocks; typing works on existing blocks; only **typing-on-fresh-block** is broken.

## Hypothesis
Focus / selection is not placed inside the new block's contenteditable on mount. The contenteditable mounts but never receives focus or a caret position, so `keydown`/`beforeinput` events have no target inside the block. Paste works because the user clicks-then-pastes (focus is established by the click). The first fresh keystroke is lost because no caret exists yet.

Alternative culprits to confirm or rule out:
- `EditModeOverlay`'s portal-aware click-outside handler blurring the new block when the popover closes.
- The block-append handler not calling `ref.focus()` after mount.
- A guard in the editor store that ignores updates for blocks not yet marked as the "active editing target".

## Tasks

### Task 1 — Investigate and write FINDINGS

<read_first>
- src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx
- src/features/notebooks/components/ContentEditor.tsx
- src/features/notebooks/components/EditModeOverlay.tsx
- src/features/notebooks/components/AddBlockPopover.tsx (or equivalent)
- src/features/notebooks/stores/editorStore.ts
- src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx
</read_first>

<action>
1. Locate the Add Block popover's onSelect handler. Trace what it does: does it call into the editor store to append a block, then call `focus()` on the new block's contenteditable ref, then place a caret via `Selection.collapse(node, 0)`? If any of those three steps is missing, that is the root cause.
2. Confirm whether `TextSpanEditor` autofocuses on mount via `useEffect` + `ref.current?.focus()` + `Selection`/`Range` API to place the caret. If it does, why doesn't the focus stick? Possibilities: (a) `EditModeOverlay`'s mousedown click-outside handler fires on the popover-item click and steals focus; (b) Radix Popover's restore-focus-on-close logic moves focus to the trigger (the "Add Block" button) immediately after the new block mounts.
3. Check the editor store: does the input handler discard `onContentChange` events from a block whose id is not in some "active" / "editing" set? If so, freshly appended blocks may not be in that set yet.
4. Reproduce in a vitest test: render `ContentEditor` with one existing block, simulate clicking "Add Block", picking "Text", then typing — assert the typed text appears in the appended block's content. The test must FAIL on the broken state to confirm reproduction.
5. Write findings to `.planning/phases/01-module-content-editor-core/01-07-FINDINGS.md` with: confirmed root cause(s), ruled-out hypotheses, exact file:line locations of the bug, and the precise fix strategy chosen for Task 2.
</action>

<acceptance_criteria>
- `01-07-FINDINGS.md` exists in the phase directory.
- File contains a "Root cause" section naming exact file:line.
- File contains a "Fix strategy" section listing concrete edits for Task 2.
- A failing vitest reproduction is checked in (skipped or `.failing`) at `src/features/notebooks/components/ContentEditor.test.tsx` under describe "fresh-block typing (gap 01-07)".
</acceptance_criteria>

### Task 2 — Apply fix

<read_first>
- 01-07-FINDINGS.md (from Task 1)
- All files named in Findings.fix_strategy
</read_first>

<action>
Apply the precise edits identified in `01-07-FINDINGS.md`. The fix MUST do all of:

1. **Imperative focus on append.** When the Add Block popover's onSelect creates a new block, the editor must, after the React commit, call `block.editorRef.current?.focus()` AND place a caret at offset 0 in the (empty) contenteditable. Use `requestAnimationFrame` or `useLayoutEffect` to ensure the DOM node exists. Concrete approach: store an "auto-focus block id" on the editor store, have `TextSpanEditor`'s mount `useEffect` check `if (autoFocusBlockId === block.id)` and call `el.focus(); const sel = window.getSelection(); const range = document.createRange(); range.setStart(el, 0); range.collapse(true); sel.removeAllRanges(); sel.addRange(range);` then clear `autoFocusBlockId`.

2. **Don't blur on popover close.** Verify that closing the AddBlock popover does NOT blur the new contenteditable. Radix Popover's `onCloseAutoFocus` should be either prevented (`event.preventDefault()`) when a new block was just inserted, or pointed at the new block's editor element instead of the trigger button.

3. **Editor store accepts updates immediately.** If the store has any "active block" gating that drops onContentChange events for blocks not yet active, fix it: any block in the current editing module's content array is a valid update target. Newly-appended blocks must be eligible from the moment they exist.

4. Remove the `.failing` / `.skip` from the Task 1 reproduction test — it must now pass.
</action>

<acceptance_criteria>
- `pnpm test src/features/notebooks/components/ContentEditor.test.tsx` exits 0.
- The "fresh-block typing (gap 01-07)" test runs (not skipped) and passes.
- `pnpm run lint` exits 0 for changed files.
- `pnpm run build` exits 0 (no TS errors).
- Manual UAT re-test of T3 passes: pick "Text" from Add Block popover → type immediately → typed characters appear and save.
</acceptance_criteria>

### Task 3 — Regression test

<read_first>
- src/features/notebooks/components/ContentEditor.test.tsx
- src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx
</read_first>

<action>
Strengthen the regression coverage so this defect cannot silently re-emerge:

1. The test from Task 1 covers the happy path (append → type → assert content). Add 2 more cases:
   - **Append → blur immediately → type:** simulates the bug's surface (focus lost before first keystroke). Must assert the user is responsible (no caret = no input), but the editor does NOT silently swallow events; it should still be possible to click into the block and type.
   - **Append → paste-then-type:** ensure the paste path and keyboard path both produce the same final content. Catches regression where paste is "specially handled" but keys are not.
2. Add an assertion that the editor store's "autoFocusBlockId" (or equivalent) is cleared after the first focus to prevent spurious re-focus on later renders.
</action>

<acceptance_criteria>
- 3 test cases under describe "fresh-block typing (gap 01-07)" all pass.
- `git diff` shows no `.skip` / `.only` / `.failing` modifiers added.
- Test file references the bug ID `gap-01-07` in its describe block (for grep traceability).
</acceptance_criteria>

## Verification

```bash
pnpm test src/features/notebooks/components/ContentEditor.test.tsx
pnpm run lint
pnpm run build
```

## must_haves

- truth: "Picking Text from the Add Block popover lands focus and a caret inside the new contenteditable before the first keystroke."
- truth: "Typing into a freshly-appended Text block updates the block's content via the same path as typing into an existing block."
- truth: "The fix is covered by a regression test that fails on the pre-fix code and passes on the post-fix code."
