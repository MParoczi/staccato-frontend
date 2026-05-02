---
slug: text-block-empty-not-saving
status: resolved
trigger: |
  When I have text in a Text block and I delete the whole text then 'Start typing...' appears.
  So far so good. But when I start to type the 'Start typing...' doesn't disappear and the text
  doesn't get saved. On second try (with the same text block) it starts working properly.
created: 2026-05-02
updated: 2026-05-02
---

# Debug Session: text-block-empty-not-saving

## Symptoms

- **Expected:** After deleting all text from a Text block, the next keystroke should hide the "Start writing…" placeholder, type into the editor, and persist on Save.
- **Actual:** Placeholder stays, first keystroke is dropped, Save persists nothing. Second attempt works.
- **Reproduction:** Text block with content → enter edit mode → select-all + delete → start typing immediately.

## Root Cause

`TextSpanEditor` (`src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx`) manages its contentEditable subtree imperatively. The empty-state representation is a single `<span data-span-index="0">` containing a ZERO WIDTH SPACE so the caret has a stable insertion host.

When the user select-all-deletes, browsers (notably Chrome) strip *all* `[data-span-index]` spans from the contentEditable and replace the subtree with a bare `<br>` (or empty root). The flow then was:

1. `handleInput` fires → `readSpansFromDom` finds zero `[data-span-index]` elements → returns `[]`.
2. `merged = []`, `domValueRef.current = []`, `onChange([])` is dispatched.
3. Parent re-renders with `value = []`. The layoutEffect sees `spansEqual(value, domValueRef.current) === true` (both `[]`) and **skips the rebuild** — the empty-state anchor span is never restored.
4. The DOM is now in a broken state with no `[data-span-index]` element. The next keystroke lands as an orphan text node directly under the contentEditable root. `handleInput` fires again, `readSpansFromDom` still returns `[]`, and the typed character is silently dropped.
5. On a "second try" (further typing / re-focus / parent re-render with a non-empty value), the DOM eventually realigns or `buildDomFromSpans` runs from another code path and the editor recovers — explaining the "works on second attempt" symptom.

The reconciliation invariant — "DOM mirrors `domValueRef.current`" — held formally (both were `[]`), but the *physical* DOM had drifted because Chrome's deletion behaviour bypasses our imperative span model.

## Fix

In `handleInput`, when `merged.length === 0` *and* the live DOM has no `[data-span-index]` element, imperatively call `buildDomFromSpans(root, [])` to restore the empty-state anchor span and re-anchor the caret inside it via `restoreSelection`. This mirrors the existing pattern used by `toggleBold` and `handlePaste` (both rebuild DOM after programmatic span mutations).

Files changed:
- `src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` — empty-state recovery branch in `handleInput`.
- `src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx` — regression test "rebuilds empty-state anchor span after select-all-delete so next keystroke is captured".

## Verification

- `pnpm exec vitest run src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx` → 11/11 tests pass (including new regression test).
- `pnpm exec vitest run src/features/notebooks/blocks` → 99/99 tests pass, no regressions.

## Resolution

- root_cause: Empty-state anchor span not rebuilt after browser-side select-all-delete strips `[data-span-index]` elements; layoutEffect's `spansEqual` short-circuit hides the DOM divergence.
- fix: In `handleInput`, when projected spans are empty and the live DOM has no anchor span, imperatively rebuild the empty-state subtree and reset selection.
- verification: New regression test simulates the Chrome-side DOM wipe and verifies the next keystroke is captured into a tracked span.
- files_changed:
  - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx
  - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx

