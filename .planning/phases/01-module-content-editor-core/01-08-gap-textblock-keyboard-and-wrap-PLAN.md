---
plan_id: 01-08-gap-textblock-keyboard-and-wrap
phase: 01-module-content-editor-core
wave: 1
depends_on: []
gap_closure: true
autonomous: true
requirements: []
files_modified:
  - src/features/notebooks/components/BlockRow.tsx
  - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx
  - src/features/notebooks/components/ContentEditor.tsx
  - src/features/notebooks/components/BlockRow.test.tsx
  - src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx
---

# Plan 01-08: TextBlock keyboard (Space) + long-text wrapping

## Objective
Fix two related defects on the TextBlock surface:

1. **Side-T9 — Spacebar swallowed.** Cannot insert a space by pressing Space inside a Text block. Pasting whitespace works; every other key works. Strong suspicion: dnd-kit's KeyboardSensor uses Space as the default sortable-grab activator, and the sortable wrapper's keyboard listeners are attached to a parent element that contains the contenteditable, so Space inside the editable region triggers `event.preventDefault()` to start dragging instead of inserting a space.

2. **Side-T14 — Long text doesn't wrap in narrow modules.** When the module is sized small and a Text block contains long content, the text overflows horizontally and is clipped by the module's `overflow-hidden` box.

Both defects live in `BlockRow` / `TextSpanEditor` and share fix surface (event scope + CSS), so they are bundled into a single plan.

## Tasks

### Task 1 — Investigate and write FINDINGS

<read_first>
- src/features/notebooks/components/BlockRow.tsx (the sortable wrapper around each block)
- src/features/notebooks/components/ContentEditor.tsx (where DndContext / KeyboardSensor / sensors are configured)
- src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx (the contenteditable)
- src/features/notebooks/components/BlockRow.test.tsx (existing tests, if any)
- node_modules/@dnd-kit/core/README.md (or upstream docs accessible offline) for KeyboardSensor activator API
</read_first>

<action>
1. Locate the `useSortable` (or `useDraggable`) call for the block row. Inspect where `{...listeners}` is spread:
   - If it is spread on the row container (`<div {...listeners}>`) and the contenteditable is a descendant of that div → confirmed root cause for the Space defect.
   - If it is spread only on a dedicated drag-handle button → look at the KeyboardSensor configuration: does it use the default activator or a custom one?
2. Check the DndContext sensors. dnd-kit's `KeyboardSensor` defaults to activator `KeyboardSensor.activators[0]` which fires on Space/Enter regardless of the focused element when listeners are attached at the row level.
3. For the wrap defect: open `TextSpanEditor.tsx` and the rendered DOM. Verify the contenteditable element does NOT have `overflow-wrap: anywhere` / `word-break: break-word`. Tailwind v4 utilities present? Check whether `break-words` or `[overflow-wrap:anywhere]` is applied.
4. Write findings to `.planning/phases/01-module-content-editor-core/01-08-FINDINGS.md` covering both defects: confirmed root causes, exact file:line, fix strategy.
5. Add failing reproductions:
   - **Space test** in `TextSpanEditor.test.tsx`: render TextSpanEditor inside a sortable BlockRow, focus the contenteditable, dispatch a `keydown` with `key: ' '`, assert the block's content includes `' '`. Mark it `.failing` if currently broken so CI reflects the gap.
   - **Wrap test** in `TextSpanEditor.test.tsx` or `BlockRow.test.tsx`: render TextSpanEditor with a 200-char unbroken string in a 200px-wide container, assert `getBoundingClientRect().width <= 200` (i.e. it wraps within bounds). May skip in jsdom (no real layout) and instead grep the rendered className for an `overflow-wrap: anywhere`-equivalent token.
</action>

<acceptance_criteria>
- `01-08-FINDINGS.md` exists with a "Root cause (Space)" and "Root cause (wrap)" section.
- File names exact `useSortable` call site and the spread location of `{...listeners}`.
- Two failing/skipped reproductions are checked in under describes "spacebar in TextBlock (gap 01-08-A)" and "long text wrap (gap 01-08-B)".
</acceptance_criteria>

### Task 2 — Fix Space activator scope

<read_first>
- 01-08-FINDINGS.md
- src/features/notebooks/components/BlockRow.tsx
- src/features/notebooks/components/ContentEditor.tsx
</read_first>

<action>
Apply ONE of these two fix paths (Findings determines which):

**Path A — Move listeners to drag-handle only (preferred).**
- Change `BlockRow.tsx` to spread `{...listeners}` and `{...attributes}` ONLY on the drag-handle button element, not on the outer row `<div>`. Concrete: rename the existing pattern `<div {...listeners}>{children}</div>` to `<div>{handle && <button {...listeners} {...attributes}>...</button>}{children}</div>`. The drag handle is the only element that should respond to Space-to-grab.

**Path B — Custom KeyboardSensor activator constraint.**
- In `ContentEditor.tsx` where `useSensors` configures `KeyboardSensor`, pass a custom `activator`:
  ```ts
  const keyboardActivator = (event, { active, over }) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('[contenteditable="true"]')) {
      return false; // do not start a drag from inside an editable element
    }
    return event.code === 'Space' || event.code === 'Enter';
  };
  useSensor(KeyboardSensor, { activators: [{ eventName: 'onKeyDown', handler: keyboardActivator }], coordinateGetter: sortableKeyboardCoordinates });
  ```
- Keep the row-level `{...listeners}` if it is needed for other reasons.

Path A is simpler and aligned with dnd-kit's recommended pattern (separate drag handle). Use Path A unless Findings shows the existing UI relies on row-wide listeners for other features.

Remove `.failing` from the Space reproduction test — it must now pass.
</action>

<acceptance_criteria>
- The "spacebar in TextBlock (gap 01-08-A)" test passes without `.failing`.
- Test 7 (block reorder via drag handle) still works — verified by the existing block-reorder test in `BlockRow.test.tsx` continuing to pass.
- `pnpm test src/features/notebooks/components/BlockRow.test.tsx src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx` exits 0.
- Manual UAT re-test: Space inserts a literal space inside a Text block.
</acceptance_criteria>

### Task 3 — Fix long-text wrapping

<read_first>
- 01-08-FINDINGS.md
- src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx
- src/features/notebooks/components/ContentEditor.tsx (in case the wrapper container needs a class too)
</read_first>

<action>
Add CSS so long text wraps inside the module's clip rect instead of overflowing:

1. On the contenteditable element in `TextSpanEditor.tsx`, add Tailwind classes: `whitespace-pre-wrap break-words [overflow-wrap:anywhere]`.
   - `whitespace-pre-wrap` preserves spaces/newlines that the user types/pastes.
   - `break-words` breaks long unbreakable words at word boundaries.
   - `[overflow-wrap:anywhere]` is the modern CSS rule that breaks even non-word strings (long URLs, hashes) — required because `break-word` alone won't break a 200-char URL.
2. On the view-mode (non-editing) Text block render path, apply the same wrap classes to the rendered span/paragraph so view mode and edit mode behave identically.
3. Do NOT touch the module's `overflow-hidden` clip rect — the module box correctly clips overflow at the grid cell boundary; the fix is to make text reflow within that box.

Remove `.failing` / `.skip` from the wrap reproduction — it must now pass.
</action>

<acceptance_criteria>
- The "long text wrap (gap 01-08-B)" test passes.
- Grep confirms: `grep -E "overflow-wrap:anywhere|break-words" src/features/notebooks/blocks/text-span-editor/TextSpanEditor.tsx` returns at least one match in both the edit and view render paths.
- Manual UAT re-test: a 200-char string in a narrow module wraps within the module's visible width; no horizontal clip.
</acceptance_criteria>

## Verification

```bash
pnpm test src/features/notebooks/components/BlockRow.test.tsx
pnpm test src/features/notebooks/blocks/text-span-editor/TextSpanEditor.test.tsx
pnpm run lint
pnpm run build
```

## must_haves

- truth: "Pressing Space inside a Text block contenteditable inserts a literal space character."
- truth: "Block-row keyboard reorder (Space-to-grab on the drag handle) still works after the Space-activator fix."
- truth: "Long text inside a Text block wraps within the module's content width in both edit and view modes; no horizontal overflow past the module clip rect."
- truth: "Both defects are covered by regression tests that fail on the pre-fix code and pass on the post-fix code."

