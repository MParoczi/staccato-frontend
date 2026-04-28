---
plan_id: 01-04-text-block
phase: 1
phase_name: Module Content Editor (Core)
wave: 2
depends_on: [01-01-foundation, 01-02-pure-utils, 01-03-block-registry]
requirements: [EDIT-01]
autonomous: true
files_modified:
  - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx
  - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx
  - src/features/notebooks/blocks/text-span-editor/selection-utils.ts
  - src/features/notebooks/blocks/text-span-editor/selection-utils.test.ts
  - src/features/notebooks/blocks/text/TextBlock.tsx
  - src/features/notebooks/blocks/text/TextBlock.test.tsx
  - src/features/notebooks/blocks/registry.ts
must_haves:
  truths:
    - "TextSpanEditor never assigns innerHTML; all DOM mutations go through React or controlled selection restoration."
    - "Paste handler calls preventDefault and inserts text/plain only — kills HTML paste XSS."
    - "Bold toggle (Ctrl/Cmd+B and toolbar) uses splitSpansAtSelection + mergeAdjacentSpans from plan 01-02 — no document.execCommand."
    - "BLOCK_REGISTRY.Text is upgraded: implemented=true, Renderer = TextBlockRenderer, Editor = TextBlockEditor."
    - "Text block round-trips through Module.content[]: a {type:'Text', spans:[{text,bold}...]} block re-hydrates pixel-identically."
---

# Plan 01-04 — TextSpanEditor + Text block (registry seed implementation)

<objective>
Build the contentEditable-based `TextSpanEditor` with bold-only formatting, then wire it into the `Text` building-block (Renderer + Editor). Upgrade `BLOCK_REGISTRY.Text` from placeholder to fully-implemented. This is the only block that ships in Phase 1; it proves the full editor pipeline (TextSpan ops, undo/redo coupling, autosave round-trip).
</objective>

## Tasks

<task id="4.1" type="tdd">
  <action>
    Create `src/features/notebooks/blocks/text-span-editor/selection-utils.ts` — DOM ↔ TextSpan-coordinate helpers:

    ```ts
    /** Walk a contentEditable root's children and return the (spanIndex, charOffset) for a given DOM (node, offset) pair. Returns null if the position is outside the editor. */
    export function domToSpanCoord(root: HTMLElement, node: Node, offset: number): { spanIndex: number; charOffset: number } | null;

    /** Inverse: given a (spanIndex, charOffset), return a DOM (node, offset) pair suitable for Range.setStart/setEnd. */
    export function spanCoordToDom(root: HTMLElement, coord: { spanIndex: number; charOffset: number }): { node: Node; offset: number } | null;

    /** Capture the current Selection inside `root` as TextSpan coords. Null if no selection or selection is outside `root`. */
    export function captureSelection(root: HTMLElement): { anchor: {spanIndex:number;charOffset:number}; focus: {spanIndex:number;charOffset:number} } | null;

    /** Restore the given selection coords inside `root`. No-op if either coord doesn't resolve. */
    export function restoreSelection(root: HTMLElement, coords: { anchor: {spanIndex:number;charOffset:number}; focus: {spanIndex:number;charOffset:number} }): void;
    ```

    Implementation rules:
    - The contentEditable root contains exactly one `<span data-span-index="N" data-bold="true|false">text</span>` element per TextSpan (no nested DOM inside spans). Walking is straightforward.
    - `domToSpanCoord` accepts both element nodes (positions between children) and text nodes (positions inside text). For text nodes, look up `data-span-index` on the parent; for element nodes, infer from child index.
    - Tests use `jsdom` (already configured by Vitest). For each function, build a synthetic root, run, assert.

    Tests required (≥ 8 cases):
    - Round-trip: every `(spanIndex, charOffset)` for a 3-span fixture survives `spanCoordToDom → domToSpanCoord` deep-equal.
    - Boundary positions (`charOffset = 0`, `charOffset = span.text.length`, between spans) all resolve correctly.
    - `captureSelection` reads a non-collapsed selection across two spans.
    - `restoreSelection` round-trips through `captureSelection`.
    - `domToSpanCoord` returns `null` when the node is not a descendant of `root`.
  </action>
  <read_first>
    - src/features/notebooks/utils/text-spans.ts (TextSpan-coord shape used here)
    - src/test-setup.ts (jsdom config)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export function domToSpanCoord" src/features/notebooks/blocks/text-span-editor/selection-utils.ts` exits 0
    - `grep -q "export function spanCoordToDom" src/features/notebooks/blocks/text-span-editor/selection-utils.ts` exits 0
    - `grep -q "export function captureSelection" src/features/notebooks/blocks/text-span-editor/selection-utils.ts` exits 0
    - `grep -q "export function restoreSelection" src/features/notebooks/blocks/text-span-editor/selection-utils.ts` exits 0
    - `pnpm test selection-utils` exits 0 with ≥ 8 tests passing
  </acceptance_criteria>
</task>

<task id="4.2" type="tdd">
  <action>
    Create `src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` — the controlled contentEditable component (UI-SPEC §4.8).

    ```tsx
    export interface TextSpanEditorProps {
      value: TextSpan[];
      onChange: (next: TextSpan[]) => void;
      /** Bold toggle state lives in parent so the toolbar Bold button can mirror it. */
      isBoldActive: boolean;
      /** Called when the editor wants to flip the active-bold flag (selection changed or pendingBold mode). */
      onBoldStateChange: (next: boolean) => void;
      /** Called once on mount with imperative handle: `{ toggleBold(): void }`. */
      onReady?: (api: { toggleBold: () => void }) => void;
      placeholder?: string; // default from i18n key editor.textSpanPlaceholder
      ariaLabel?: string;   // default from i18n key editor.textSpanLabel
    }
    ```

    Implementation rules (tight — read carefully):

    1. **Render** the value as `<span data-span-index="N" data-bold="true|false" style={{fontWeight: bold?700:'inherit'}}>{text}</span>` chain inside one `<div contentEditable role="textbox" aria-multiline="false" suppressContentEditableWarning>`.
    2. **`onBeforeInput`:** capture selection coords via `captureSelection`. For `inputType === 'historyUndo'` / `'historyRedo'` → `preventDefault()` (parent owns history). For all other input types, allow the default mutation, then in `onInput` reconcile the resulting DOM text:
       - Read each `<span>`'s textContent, build a new `TextSpan[]`, run `mergeAdjacentSpans`, call `onChange`.
    3. **`onPaste`:** `preventDefault()`, read `clipboardData.getData('text/plain')`, insert at the selection by calling `splitSpansAtSelection` + replacing the selection range with a new span that has the `pendingBold` value, then `onChange(merged)`.
    4. **`onCompositionStart` / `onCompositionEnd`:** ignore `onBeforeInput` while composing; on `compositionend`, run the same reconciliation as `onInput`.
    5. **`onKeyDown`:** intercept `Ctrl/Cmd+B` → `preventDefault()` + call `toggleBold()`. (Undo/redo bindings live on the ModuleEditor toolbar, NOT here — keep this component scope tight.)
    6. **`toggleBold()`:** read selection. If collapsed, flip `pendingBold` flag (component-state ref) and call `onBoldStateChange(next)`. If non-collapsed, run `splitSpansAtSelection`, flip `bold` on `selectedIndices`, run `mergeAdjacentSpans`, call `onChange`. Then restore the selection (which now spans different DOM nodes after re-render — capture coord BEFORE mutation, restore AFTER).
    7. **Selection restoration after re-render:** use `useLayoutEffect` (NOT `useEffect`) so restoration happens before paint and the user never sees a flash of collapsed selection.
    8. **Placeholder:** when `value` is empty (`spans.length === 0` OR all spans empty-text) AND focused, render placeholder text via CSS `:before` content driven by `data-empty="true"` attribute on the editor div. Use chrome italic muted token per UI-SPEC §2.2.
    9. **`::selection` CSS:** scope via `[data-text-span-editor]::selection { background: color-mix(in oklab, var(--color-primary) 25%, transparent); }`. Caret color: `caret-color: var(--color-primary);` set inline.
    10. **`onReady` callback:** invoked once on mount with `{ toggleBold }` so the toolbar Bold button can call into this component without a context (parent holds the ref).

    Co-locate tests with `@testing-library/user-event`:
    - Renders `value` as a span chain; bold spans have `font-weight: 700`.
    - Typing a character calls `onChange` with the updated spans (after `mergeAdjacentSpans`).
    - `Ctrl+B` with collapsed selection calls `onBoldStateChange(true)`.
    - `Ctrl+B` with selection across one bold + one non-bold span normalises to bold for both (or non-bold — match the implementation choice and lock it: when the selection contains MIXED bold values, the toggle sets all to TRUE).
    - Pasting `<b>HTML</b>` inserts the literal string `<b>HTML</b>` (no DOM injection): assert `onChange` receives spans whose total text contains `<b>` literally. *XSS-mitigation regression test.*
    - Empty value + focus shows placeholder via `data-empty="true"`.
  </action>
  <read_first>
    - src/features/notebooks/utils/text-spans.ts (splitSpansAtSelection, mergeAdjacentSpans)
    - src/features/notebooks/blocks/text-span-editor/selection-utils.ts (captureSelection, restoreSelection)
    - src/lib/types/text-spans.ts (TextSpan interface)
    - .planning/phases/01-module-content-editor-core/01-UI-SPEC.md §4.8 + §2.2 (contentEditable contract + placeholder style)
    - .planning/phases/01-module-content-editor-core/01-CONTEXT.md decision 2 (rejected approaches)
  </read_first>
  <acceptance_criteria>
    - `grep -q "contentEditable" src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` exits 0
    - `grep -q "preventDefault" src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` exits 0
    - `grep -q "clipboardData.getData('text/plain')" src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` exits 0
    - `! grep -q "innerHTML" src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` (must NOT contain — XSS gate)
    - `! grep -q "execCommand" src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` (must NOT use deprecated API)
    - `! grep -q "dangerouslySetInnerHTML" src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` (must NOT exist)
    - `pnpm test TextSpanEditor` exits 0 with ≥ 6 tests passing
  </acceptance_criteria>
</task>

<task id="4.3" type="execute">
  <action>
    Create `src/features/notebooks/blocks/text/TextBlock.tsx` exporting two components:

    ```tsx
    /** Read-only renderer for a Text block. Used in view-mode and inside non-edit-mode modules. */
    export function TextBlockRenderer({ block }: { block: BuildingBlock }): JSX.Element;

    /** Editor for a Text block. Wraps TextSpanEditor and bridges Block-level onChange. */
    export function TextBlockEditor({ block, onChange }: { block: BuildingBlock; onChange: (next: BuildingBlock) => void }): JSX.Element;
    ```

    Storage shape (mirrors F9 prompt + Phase-2 BLOCK-01 storage):
    ```ts
    type TextBlock = { type: 'Text'; spans: TextSpan[] };
    ```

    Renderer renders the spans as `<span style={{fontWeight: bold?700:'inherit'}}>{text}</span>` chain inside a `<p className="…notebook-typography…">`. The notebook typography classes come from the F7 module style record — for Phase 1 the renderer relies on its parent (`ModuleCard`) having already applied the style record on the wrapper, so the `<p>` here just inherits.

    Editor reads `block.spans ?? []`, passes to `TextSpanEditor`. On `TextSpanEditor`'s `onChange(nextSpans)` it calls `onChange({ ...block, type: 'Text', spans: nextSpans })`.

    Defensive parsing: if `block.spans` is missing or not an array, treat it as `[]` (don't throw).

    Co-locate tests:
    - Renderer renders bold/non-bold spans with correct font-weight.
    - Editor mounted with `block = {type:'Text', spans:[{text:'hi', bold:false}]}` shows the text; user types ' world' → `onChange` is called with the updated block whose `spans` contain `'hi world'` (after merge).
    - Round-trip: render Renderer with the result of an Editor `onChange` payload — DOM textContent equals the editor's textContent.
  </action>
  <read_first>
    - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx (created in task 4.2)
    - src/lib/types/text-spans.ts
    - src/lib/types/modules.ts (BuildingBlock — `[key: string]: unknown` allows the `spans` field)
  </read_first>
  <acceptance_criteria>
    - `grep -q "export function TextBlockRenderer" src/features/notebooks/blocks/text/TextBlock.tsx` exits 0
    - `grep -q "export function TextBlockEditor" src/features/notebooks/blocks/text/TextBlock.tsx` exits 0
    - `pnpm test TextBlock` exits 0 with ≥ 3 tests passing
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

<task id="4.4" type="execute">
  <action>
    Edit `src/features/notebooks/blocks/registry.ts` to upgrade the `Text` entry from the placeholder factory to the real implementation:

    ```ts
    import { TextBlockRenderer, TextBlockEditor } from './text/TextBlock';
    import { Type } from 'lucide-react';

    // …

    Text: {
      Renderer: TextBlockRenderer,
      Editor: TextBlockEditor,
      create: () => ({ type: 'Text', spans: [{ text: '', bold: false }] }),
      icon: Type,
      labelKey: 'editor.blockType.text',
      implemented: true,
    },
    ```

    Update `registry.test.ts`:
    - Add a test that `BLOCK_REGISTRY.Text.implemented === true`.
    - Add a test that `BLOCK_REGISTRY.Text.create()` returns `{ type: 'Text', spans: [{ text: '', bold: false }] }`.
    - Add a test that mounting `BLOCK_REGISTRY.Text.Editor` with a populated block calls `onChange` when the user types (smoke test — full coverage lives in TextBlock.test.tsx).
    - Verify all 9 OTHER entries remain `implemented: false` (parameterised test).
  </action>
  <read_first>
    - src/features/notebooks/blocks/registry.ts (current state — task 3.3)
    - src/features/notebooks/blocks/text/TextBlock.tsx (created task 4.3)
  </read_first>
  <acceptance_criteria>
    - `grep -q "TextBlockRenderer" src/features/notebooks/blocks/registry.ts` exits 0
    - `grep -q "implemented: true" src/features/notebooks/blocks/registry.ts` exits 0
    - `pnpm test registry` exits 0 with all prior tests still passing PLUS the new `Text` upgrade tests (≥ 8 total)
    - `pnpm tsc --noEmit` exits 0
  </acceptance_criteria>
</task>

## Verification

```bash
pnpm tsc --noEmit
pnpm test selection-utils TextSpanEditor TextBlock registry
pnpm run lint
```

## Wave Notes

Wave 2. Hard depends on plans 01-01 (TextSpan type, i18n keys), 01-02 (text-spans utils), 01-03 (registry framework + PlaceholderBlock). Plan 01-05 (Editor shell) consumes `TextSpanEditor`, `BLOCK_REGISTRY`, `useEditHistory`, `useDebouncedSave`.

