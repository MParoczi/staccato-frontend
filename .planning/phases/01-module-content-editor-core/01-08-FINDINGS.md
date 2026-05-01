---
plan_id: 01-08-gap-textblock-keyboard-and-wrap
status: investigated
date: 2026-05-01
---

# Plan 01-08 — FINDINGS

## Root cause (Space)

**File:** `src/features/notebooks/components/ModuleCard.tsx`
**Lines:** 283–291 (handler), 323 (binding).

The outer `ModuleCard` wrapper `<div role="button" tabIndex=0 onKeyDown={handleKeyDown}>`
has a keydown listener that does:

```ts
if (event.key === 'Enter' || event.key === ' ') {
  event.preventDefault();
  onSelect(module.id);
}
```

`onKeyDown` bubbles up from every descendant. When the user is in edit mode and
presses Space inside the `TextSpanEditor` contentEditable, the keydown bubbles
to the wrapper, matches `' '`, calls `preventDefault()` — and the Space is
never inserted into the contentEditable.

This is **NOT** dnd-kit's `KeyboardSensor` (which is correctly scoped to the
drag handle button via `setActivatorNodeRef` in
`ModuleEditor.tsx:111-115,121-125`). The plan's hypothesis was wrong; the real
culprit is the module-card's own role=button keyboard activator.

Asymmetry explained:
- **Type letter** → not Enter/Space, handler ignores → letter inserted ✓
- **Type Space** → handler matches → preventDefault → swallowed ✗
- **Paste** → fires `paste` event, not `keydown` → handler not invoked ✓
- **Drag-handle keyboard reorder** → drag handle `<button>` stops propagation
  via dnd-kit's own activator, doesn't reach the wrapper ✓

### Fix strategy (Space)

Make `ModuleCard.handleKeyDown` a self-target-only activator: only treat
Enter/Space as "select" when `event.target === event.currentTarget`
(i.e. focus is on the wrapper itself, not on a descendant button/editor).
Equivalent guard: bail out if the event's target is inside any element with
`contenteditable="true"` or matches `[role="textbox"]`/`[role="dialog"]`.

Self-target check is simpler and matches the role=button semantic
(activation should fire when the wrapper itself has focus, not when keystrokes
happen inside a child interactive widget). Apply this.

## Root cause (wrap)

**File:** `src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx`
**Lines:** 446–451 (`editorStyle`).

The contentEditable root has only `whiteSpace: 'pre-wrap'` set. This wraps at
soft break opportunities (spaces, hyphens) but does not break long unbroken
strings — long URLs, hashes, or any continuous run of non-breaking characters
flow horizontally and overflow the module's `overflow-hidden` clip box.

There is no view-mode separate render path — TextBlock view uses the same
component (per BLOCK_REGISTRY wiring, the editor is rendered for both modes
and `contenteditable` toggles based on edit state). So a single CSS fix
covers both.

### Fix strategy (wrap)

Add `overflowWrap: 'anywhere'` to `editorStyle`. `anywhere` (rather than
`break-word`) is required to break inside non-word strings (long URLs, hash
strings).

The module's own `overflow-hidden` clip rect is correct and stays — the fix
is to make text reflow within that box, not remove the clip.

## Reproductions

Added to `TextSpanEditor.test.tsx`:

1. `it('inserts a literal space when user presses Spacebar (gap 01-08-A)')` —
   renders the editor inside a host that mimics the `ModuleCard` Space
   handler, dispatches keydown+input for Space, asserts onChange receives a
   span ending in `' '`. Pre-fix: fails (preventDefault eats the space).
   Post-fix: passes.

2. `it('applies overflow-wrap:anywhere to the editable root (gap 01-08-B)')`
   — render the editor, read `style.overflowWrap` on the root element, assert
   it equals `'anywhere'`. jsdom doesn't do real layout so we assert on the
   inline style rather than measured width.

