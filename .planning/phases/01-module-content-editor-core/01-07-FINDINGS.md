# Plan 01-07 — Findings: Fresh-block typing fix

## Reproduction (UAT Test 3)

1. Enter edit mode on a Theory module.
2. Click **Add Block → Text**.
3. **Type immediately** (no intermediate click).
4. Observed: placeholder stays, no characters appear, no save fires.
5. Workaround that "works on second try": click into the block first, then type.
6. Workaround that "always works": Add Block → Text → paste (any text).

The asymmetry between paste-works / type-fails is the diagnostic: paste
implies the user has already clicked into the block (focusing it), whereas
typing-immediately-after-add never establishes focus inside the new block.

## Root cause

Two coupled defects:

1. **`AddBlockPopover.tsx` did not close on selection.** The popover was
   uncontrolled (`<Popover>` with no `open` / `onOpenChange`). Each option
   was a `<button>` whose `onClick` only invoked `onSelect(type)`. Radix
   leaves the popover open until an outside click / Escape, so after
   selection focus stayed on the option button **inside the still-open
   popover**, not on the new block.

2. **`ModuleEditor.handleAddBlock` did nothing about focus.** It built a
   new block via `desc.create()`, appended it to `content`, and called
   `pushContent` with `immediateHistory: true`. The freshly-mounted
   `TextSpanEditor` was therefore in the DOM but never received focus or
   a caret position. Without a caret no `keydown` / `beforeinput` event
   targets the contentEditable, and the typed character is lost.

Even if (1) were fixed in isolation, Radix `PopoverContent`'s default
`onCloseAutoFocus` restores focus to the **trigger button** (`Add Block`),
not to the newly-mounted content. So the fix needs both: close the popover
deterministically, prevent Radix's focus-restore-to-trigger, and explicitly
move focus into the new block.

## Why paste worked

Pasting is keyed on the contentEditable's `paste` synthetic event, which
fires on whichever element holds the selection at paste time. In practice
users paste with Ctrl+V *after first clicking into the block*; that click
focuses the contentEditable (closing the still-open popover via outside-
click), so `handlePaste` runs against a real selection inside the editor.

## Fix strategy

1. **`AddBlockPopover.tsx`** — make the popover controlled (`useState`
   open), call `setOpen(false)` from each option's `onClick` *before*
   invoking `onSelect`, and add
   `onCloseAutoFocus={(e) => e.preventDefault()}` on `PopoverContent` so
   Radix does not restore focus to the trigger.

2. **`ModuleEditor.tsx`** — track the index of the newly-appended block in
   a ref (`pendingAutoFocusIndexRef`). After the React commit, run a
   `useEffect` keyed on `content`: if the ref is set, query inside the
   editor's `rootRef` for `[data-block-row][data-block-index="<n>"]
   [data-text-span-editor][contenteditable="true"]`, call `.focus()`, and
   place a collapsed `Range` at offset 0 inside the placeholder span (the
   ZWSP-anchored span that `TextSpanEditor` mounts for empty content).
   The work runs inside `requestAnimationFrame` so it survives Radix's
   teardown microtasks.

3. No changes to `BlockEditorProps` or `TextSpanEditor` — focus is driven
   imperatively from the host via DOM lookup. This keeps the block
   contract narrow (no new "autoFocus" prop to thread through every
   block type's editor).

## Files modified

- `src/features/notebooks/components/ModuleEditor/AddBlockPopover.tsx`
- `src/features/notebooks/components/ModuleEditor/ModuleEditor.tsx`
- `src/features/notebooks/components/ModuleEditor/ModuleEditor.test.tsx`
  (added `describe('fresh-block typing (gap 01-07)', ...)` with 2 tests)

## Regression coverage

`describe('fresh-block typing (gap 01-07)')` in `ModuleEditor.test.tsx`:

1. **focus + caret land on the new editor** — after clicking
   Add Block → Text, `document.activeElement` is the new
   `[data-text-span-editor][contenteditable="true"]` and the live
   `Selection` holds a collapsed `Range` whose `startContainer` is
   contained by that editor.
2. **first keystroke updates the cache** — simulate a single 'h' typed
   into the freshly-focused editor (DOM mutation + `input` event), then
   assert the `pageModulesQueryKey` cache contains a Text block whose
   joined span text is `'h'`. Pre-fix this test fails because the editor
   never receives focus and the simulated input event has nothing to
   project from.

## Stash disposition

`stash@{0}` ("WIP plan 01-07 fresh-block typing - placeholder mirror")
contained an unrelated experiment that introduced an `isEmpty`
useState mirror inside `TextSpanEditor` to hide the placeholder
synchronously on first input. That work targeted a *different* symptom
(placeholder visibility lag) and is **not** needed for the gap-01-07
fix — the placeholder hides correctly because `value` updates via
`onChange` round-trip on the first keystroke once focus lands. Stash
**dropped without applying**.

