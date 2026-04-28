---
plan_id: 01-04-text-block
phase: 1
phase_name: Module Content Editor (Core)
status: complete
wave: 2
completed_at: 2026-04-28
commits: [344b998, 0b56759, 13c9684, 7ba549c]
key-files:
  created:
    - src/features/notebooks/blocks/text-span-editor/selection-utils.ts
    - src/features/notebooks/blocks/text-span-editor/selection-utils.test.ts
    - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx
    - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx
    - src/features/notebooks/blocks/text/TextBlock.tsx
    - src/features/notebooks/blocks/text/TextBlock.test.tsx
  modified:
    - src/features/notebooks/blocks/registry.ts
    - src/features/notebooks/blocks/registry.test.tsx
    - package.json
    - pnpm-lock.yaml
tests:
  - selection-utils: 13/13 pass
  - TextSpanEditor: 8/8 pass
  - TextBlock: 6/6 pass
  - registry: 45/45 pass
  - total new: 72/72 pass
---

# Plan 01-04 — TextSpanEditor + Text block

## Self-Check: PASSED

All four `must_haves.truths` from the plan frontmatter hold:

1. **TextSpanEditor never assigns `innerHTML`.** Verified by grep: source contains 0 hits for `innerHTML` and 0 for `dangerouslySetInnerHTML`. All DOM mutations go through React render or controlled `restoreSelection` via `Range.setStart`/`setEnd`.
2. **Paste handler calls `preventDefault()` and inserts `text/plain` only.** `handlePaste` calls `e.preventDefault()`, reads `e.clipboardData.getData('text/plain')`, and never touches `text/html`. The XSS regression test (paste of `<b>HTML</b>`) asserts the literal string lands in the model and **no `<b>` element exists in the DOM**.
3. **Bold toggle uses `splitSpansAtSelection` + `mergeAdjacentSpans`.** `toggleBold()` calls these helpers from plan 01-02. No `document.execCommand` anywhere in source (grep clean).
4. **`BLOCK_REGISTRY.Text` upgraded.** `implemented: true`, `Renderer = TextBlockRenderer`, `Editor = TextBlockEditor`, `create()` seeds `{ type: 'Text', spans: [{ text: '', bold: false }] }`.
5. **Round-trip preserved.** `TextBlock.test.tsx › round-trips: Renderer of an Editor onChange payload preserves text` (paste `def` after `abc` → render → DOM textContent == `'abcdef'`).

## What was built

### Task 4.1 — `selection-utils.ts` (commit `344b998`)
DOM ↔ TextSpan-coordinate helpers used by the contentEditable editor:
- `domToSpanCoord(root, node, offset)` — handles text nodes (via `findOwningSpan` + `data-span-index`), span elements at offset 0 (start) or >=1 (end), and root-element offsets (interpreted as child-index between siblings); returns `null` for nodes outside `root`.
- `spanCoordToDom(root, coord)` — finds the span by index attribute, returns the text-node child at clamped offset, or the span element itself with offset 0 for empty spans.
- `captureSelection(root)` / `restoreSelection(root, coords)` — read/write the window `Selection` as TextSpan coords; restore is silent no-op on unresolvable coords; uses `Range.setStart`/`setEnd` (no `innerHTML`).

13 tests cover round-trip across a 3-span fixture (every char position), boundary positions (0, end, between spans, before first, empty span), 2-span non-collapsed selection capture, capture→restore→capture round-trip, no-selection case, out-of-root nodes, out-of-root selections, missing spanIndex, and over-length charOffset clamp.

### Task 4.2 — `TextSpanEditor.tsx` (commit `0b56759`)
Controlled contentEditable component (UI-SPEC §4.8):

- Renders value as `<span data-span-index="N" data-bold="true|false" style="font-weight:700|inherit">text</span>` chain inside `<div role="textbox" contentEditable suppressContentEditableWarning>`.
- **Bold mechanics:** `toggleBold()` reads selection via `captureSelection`. Collapsed → flips `pendingBoldRef` and calls `onBoldStateChange(next)`. Non-collapsed → `splitSpansAtSelection` → `computeTargetBold` (any non-bold in selection ⇒ flip all to true; else flip to false) → `mergeAdjacentSpans` → restore selection at the equivalent absolute character range on the merged spans.
- **Input reconciliation:** `onInput` reads each `<span>`'s `textContent` via `readSpansFromDom`, runs `mergeAdjacentSpans`, and propagates via `onChange`. Selection coords captured BEFORE state propagation, then restored in `useLayoutEffect` against the post-render DOM (avoids cursor flash).
- **Paste handler:** `e.preventDefault()`, reads `text/plain`, splits at the caret (collapsed → `splitSpanAt`; ranged → `splitSpansAtSelection` then drops `selectedIndices`), inserts a new span carrying `pendingBoldRef.current`, merges, restores caret to end of inserted text. **HTML is never read or rendered.**
- **`onBeforeInput`:** intercepts `historyUndo` / `historyRedo` (parent owns history).
- **IME composition:** `onCompositionStart`/`onCompositionEnd` flips `composingRef` so `onInput` skips reconciliation mid-composition; `onCompositionEnd` triggers a final reconciliation.
- **Caret-context tracking:** `onSelect` syncs `pendingBoldRef` to the current span's `bold` flag whenever the caret moves, so the toolbar Bold button reflects the bold context at the cursor.
- **Imperative API:** `onReady({ toggleBold })` published once on mount via stable refs (parent stores ref, calls into editor without context).
- **Placeholder:** `data-empty="true"` attribute is set when `totalLength(value) === 0`; CSS in plan 01-05's `index.css` will style `[data-empty="true"]:before { content: attr(data-placeholder); }`. Empty value still renders one `<span data-span-index="0">` so coords are always resolvable.
- **Caret color** set inline to `var(--color-primary)`.

8 tests cover render fixture, paste-driven onChange, Ctrl+B collapsed (pendingBold flip), Ctrl+B mixed-bold normalization (`plain`+`BOLD` → middle slice all bold), XSS regression (`<b>HTML</b>` paste → literal text, no `<b>` element), empty-state `data-empty`, `onReady` publishes `toggleBold`, role/a11y attrs.

Notes:
- `userEvent.paste(DataTransfer)` is unusable in jsdom (no `DataTransfer` constructor). Tests use `fireEvent.paste(target, { clipboardData: { getData } })` to drive the React synthetic-event handler directly. This still exercises the full XSS-mitigation path because the handler reads through `clipboardData.getData('text/plain')`.
- `i18n` is not initialised in test setup → `t(key)` returns the key. `aria-label` test asserts presence rather than translated value (the production wrapper supplies the i18next provider).
- Added `@testing-library/user-event@^14` as devDep (not previously installed; `package.json` updated, lockfile regenerated).

### Task 4.3 — `TextBlock.tsx` (commit `13c9684`)
- `TextBlockRenderer({block})` — chains styled spans inside a `<p>`; defensive parsing returns `[]` when `block.spans` is missing or non-array.
- `TextBlockEditor({block, onChange})` — owns local `isBoldActive` state, wraps `TextSpanEditor`, forwards span updates as `onChange({ ...block, type: 'Text', spans: nextSpans })`.
- 6 tests: bold/non-bold render, empty paragraph, defensive parsing, paste round-trip, full Editor→Renderer round-trip, empty initial block.

### Task 4.4 — `BLOCK_REGISTRY.Text` upgrade (commit `7ba549c`)
- Replaced `placeholderDescriptor('Text', Type, 'editor.blockType.text')` with the real `{ Renderer: TextBlockRenderer, Editor: TextBlockEditor, create: () => ({ type: 'Text', spans: [{ text: '', bold: false }] }), icon: Type, labelKey: 'editor.blockType.text', implemented: true }`.
- Tests refactored to use `PLACEHOLDER_TYPES = ALL_TYPES.filter(t => t !== 'Text')` for placeholder-fallback assertions; added 3 Text-specific tests (implemented mix, create() seed shape, Editor mount smoke). 45/45 registry tests pass.

## Acceptance criteria

| Criterion | Method | Status |
|-----------|--------|--------|
| `domToSpanCoord` exported | grep | ✓ |
| `spanCoordToDom` exported | grep | ✓ |
| `captureSelection` exported | grep | ✓ |
| `restoreSelection` exported | grep | ✓ |
| selection-utils: ≥ 8 tests | vitest | 13 ✓ |
| `contentEditable` in TextSpanEditor | grep | ✓ |
| `preventDefault` in TextSpanEditor | grep (paste + Ctrl+B + onBeforeInput) | ✓ |
| `clipboardData.getData('text/plain')` | grep | ✓ |
| no `innerHTML` in TextSpanEditor | grep -v | ✓ (0 hits) |
| no `execCommand` | grep -v | ✓ (0 hits) |
| no `dangerouslySetInnerHTML` | grep -v | ✓ (0 hits) |
| TextSpanEditor: ≥ 6 tests | vitest | 8 ✓ |
| `TextBlockRenderer` exported | grep | ✓ |
| `TextBlockEditor` exported | grep | ✓ |
| TextBlock: ≥ 3 tests | vitest | 6 ✓ |
| `tsc --noEmit` clean | tsc | ✓ |
| `TextBlockRenderer` referenced in registry | grep | ✓ |
| `implemented: true` in registry | grep | ✓ |
| registry: prior tests + new ≥ 8 | vitest | 45 ✓ |

## Verification commands run

```bash
pnpm test selection-utils TextSpanEditor TextBlock registry --run
# 4 files, 72 tests, all pass

pnpm tsc --noEmit
# clean

pnpm exec eslint src/features/notebooks/blocks/text-span-editor/ src/features/notebooks/blocks/text/
# clean
```

## Wave bridge

Plan 01-05 (Editor shell) consumes `TextSpanEditor` (via `BLOCK_REGISTRY.Text.Editor`), `BLOCK_REGISTRY` (Add Block popover), `useEditHistory` + `useDebouncedSave` (from 01-02). The placeholder-CSS hook (`[data-text-span-editor][data-empty="true"]:before`) lands in 01-05's `index.css` change.

