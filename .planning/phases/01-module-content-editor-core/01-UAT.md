---
status: testing
phase: 01-module-content-editor-core
source:
  - 01-01-foundation-SUMMARY.md
  - 01-02-pure-utils-SUMMARY.md
  - 01-03-block-registry-SUMMARY.md
  - 01-04-text-block-SUMMARY.md
  - 01-05-editor-shell-SUMMARY.md
  - 01-06-integration-SUMMARY.md
started: 2026-04-30T00:00:00Z
updated: 2026-04-30T21:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 2
name: Add Block popover lists allowed types
  In edit mode on a Theory module, clicking "Add Block" opens a popover
  listing the allowed block types (Heading, Date, Text, List,
  OrderedList, Checklist, Table, Note, Chord, Tab). On a Title module
  the popover shows exactly Date and Text — nothing else.
awaiting: user response
awaiting: re-test after Radix portal click-outside fix

## Tests

### 1. Enter edit mode on a Title/Theory module
expected: Select a non-Breadcrumb module → "Edit" chip visible → clicking it (or double-clicking the body) shows edit-mode glow ring + sticky toolbar (Add Block · Bold · Undo · Redo · save indicator · Cancel · Save). Module's grid position/size does not jump.
result: pass
notes: |
  Passed after fixing 7 stacked bugs uncovered during this single test
  (logged below as separate gaps with their own commits): wrong lessons
  API path, missing content:[] on module create, wrong i18n prefix on
  module-type labels, ambiguous bare-+ icons, low-contrast/misplaced
  edit chip, small-module editor cropping, off-page page number. Drag
  cursor misalignment + red-on-valid-position remain DEFERRED to a
  dedicated F8 bug-fix phase; UAT proceeds without exercising module
  drag (Test 7 only covers in-editor block-row reordering, which is a
  different dnd-kit/sortable code path).


### 2. Add Block popover lists allowed types
result: [pending]
  the module wrapper. Logged as a separate gap and fixed.

### 3. Add a Text block and type into it
expected: Pick "Text" from the Add Block popover. A new empty Text block is appended; focus lands inside it. Typing renders the characters live in the same block. Pasting rich content (e.g. copied bold HTML) pastes as plain text only — no markup leaks.
result: [pending]

### 4. Bold via Ctrl+B inside a Text block
expected: Select a portion of typed text and press Ctrl+B. The selected portion renders bold in place. Pressing Ctrl+B again on the bolded selection un-bolds it. Adjacent identically-styled spans merge cleanly (no visual seams).
result: [pending]

### 5. Save indicator + ~1s debounce
expected: After typing stops in a Text block, within ~1 second the save indicator transitions Idle → "Saving…" → "Saved", then the "Saved" badge auto-fades after ~1.5s. No save fires while you're still typing continuously.
result: [pending]

### 6. Undo / Redo
expected: After making an edit, Ctrl+Z (or the toolbar Undo button) reverts the last change. Ctrl+Shift+Z (or Redo) re-applies it. Undo/Redo toolbar buttons enable/disable to reflect history availability.
result: [pending]

### 7. Reorder blocks via drag handle
expected: Add a second Text block. A drag handle appears in the left gutter on hover/focus of each block row. Dragging block #2 above block #1 (pointer or keyboard: Space to grab, arrows to move, Space to drop) reorders them. The new order persists through the next autosave.
result: [pending]

### 8. Delete block with confirm dialog
expected: Hover a block row → a delete icon appears top-right. Clicking it opens an AlertDialog ("Delete block?" with locked copy). Cancel keeps the block; Confirm removes it. The remaining blocks reflow without layout glitch.
result: [pending]

### 9. Cancel reverts edits
expected: Make an edit (e.g. type into a Text block), then click "Cancel" in the toolbar. Edit mode exits and the module's view content is restored to the pre-edit snapshot — your unsaved typing is gone.
result: [pending]

### 10. Click-outside / Escape exits edit mode (clean)
expected: With no unsaved changes, pressing Escape (or clicking outside the module) exits edit mode silently — no dialog, no save indicator flash, view content unchanged.
result: [pending]

### 11. Dirty-nav guard dialog
expected: Make an edit so the save indicator shows "Saving…", then immediately try to navigate away (e.g. click a sidebar link, browser back). If the in-flight save fails (or you navigate before debounce flush), an "Unsaved changes" AlertDialog appears with "Keep editing" / "Discard" buttons. Keep editing returns to the editor; Discard navigates and abandons the edit.
result: [pending]

### 12. Breadcrumb module: auto-generated note + disabled controls
expected: Enter edit mode on a Breadcrumb module. An info note appears explaining the content is auto-generated. The "Add Block" button is **disabled** (tooltip on hover) and the "Save" button is **disabled**. Cancel/Escape still works to exit.
result: [pending]

### 13. Unimplemented block type renders placeholder
expected: A module that contains a not-yet-implemented block (e.g. Table, Note, Chord, Tab, List, OrderedList, Checklist, Heading) renders that block in view mode as a dashed-bordered placeholder card with italic muted text identifying the block type. The placeholder is announced as a note (role="note") to assistive tech and does not crash the surrounding module.
result: [pending]

### 14. Round-trip persistence
expected: Add a Text block with bolded text, wait for "Saved", exit edit mode, then reload the page. The same Text block with the same bold spans renders in view mode after reload — content survived the optimistic-update → debounced PUT → cache-reconciliation cycle.
result: [pending]

## Summary

total: 14
passed: 2
issues: 0
pending: 12
skipped: 0

## Gaps

- truth: "Opening a created lesson uses the correct backend endpoint."
  status: failed
  reason: "User reported: frontend calls /notebooks/{notebookId}/lessons/{lessonId} (404). Per OpenAPI the lesson item routes are flat: GET/PUT/DELETE /lessons/{id}. Only collection routes (/notebooks/{id}/lessons) are notebook-scoped."
  severity: blocker
  test: 1
  artifacts:
    - src/api/lessons.ts
    - src/features/notebooks/hooks/usePageNavigation.test.tsx
  missing: []
passed: 1
  fix_commit: 7093b55
  notes: |
pending: 13
    every UAT test because the LessonPage route can't hydrate. Fix is a
    surgical re-pathing of three calls + verb change for update; hook
    callers untouched.

- truth: "Add Module modal renders translated module-type labels."
  status: failed
  reason: "User reported: Add Module dialog shows raw i18n keys (e.g. 'notebooks.styling.moduleTypes.title') instead of translated text. AddModulePicker.tsx requested keys with a wrong 'notebooks.' prefix; canonical path used everywhere else (StyleEditorForm, StylePreview, StyleEditorDrawer) is 'styling.moduleTypes.*'."
  severity: blocker
  test: 1
  artifacts:
    - src/features/notebooks/components/AddModulePicker.tsx
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Pre-existing pre-phase-1 bug (AddModulePicker is from feature 8). Drop
    'notebooks.' prefix on all 12 labelKey entries. Both en.json and
    hu.json already have the strings under styling.moduleTypes.

- truth: "Toolbar plus-icons are visually distinguishable (zoom-in / add-module / add-page)."
  status: failed
  reason: "User reported: three identical bare '+' icons in the per-page toolbar (zoom-in, add-module, add-page) — no way to tell them apart at a glance; user wants icon+text labels."
  severity: minor
  test: 1
  artifacts:
    - src/features/notebooks/components/AddModulePicker.tsx
    - src/features/notebooks/components/LessonPage.tsx
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Converted Add Module trigger and floating Add Page button from
    icon-only (size="icon-sm") to labeled (size="sm" with Plus icon +
    text). Zoom +/- controls (CanvasViewportControls) kept icon-only as
    the "100%" indicator between them disambiguates them clearly.

- truth: "Adding a module via POST /pages/{pageId}/modules succeeds."
  status: failed
  reason: "User reported: backend returned 400 with {\"errors\":{\"Content\":[\"Content must be an empty array for new modules.\"]}}. Frontend was omitting the `content` field entirely; backend validator rejects missing/null and requires an explicit empty array."
  severity: blocker
  test: 1
  artifacts:
    - src/api/modules.ts
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Spread `content: []` into the POST body inside the createModule API
    client. CreateModuleInput type unchanged — content is an
    implementation detail of the request shape, not a value callers ever
    supply on create (blocks are added later via PATCH /modules/{id}).

- truth: "Edit chip on a selected module is clearly visible and unambiguously placed."
  status: failed
  reason: "User reported: edit chip is hard to see unless hovered, and looks misplaced (straddles the header/body boundary on the right side of the module). Originally rendered as a `ghost`-variant icon-only `<Pencil>` at `right-2 top-2`, which has near-zero contrast against the user-styled module header (e.g. dark navy on the Theory module)."
  severity: minor
  test: 1
  artifacts:
    - src/features/notebooks/components/EditButton.tsx
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Switched to a labeled pill chip (Pencil icon + "Edit" text), variant
    `secondary`, with a 1px ring + shadow for contrast on any header
    color. Anchored at `right-1.5 top-1` so it sits cleanly inside the
    header strip rather than straddling the header/body seam. Stays
    inside the module's `overflow-hidden` clip rect (no negative offsets)
    so it's visible regardless of saved module size.

- truth: "Page number indicator visually aligns with the centered DottedPaper."
  status: failed
  reason: "User reported: the page number ('2') appears way off to the right of the page. Caused by `text-right` on the `<div>` rendering the indicator, which right-aligns within the `max-w-5xl` flex column — much wider than the centered DottedPaper, so the number ends up far past the page's right edge."
  severity: cosmetic
  test: 1
  artifacts:
    - src/features/notebooks/components/LessonPage.tsx
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Changed `text-right` → `text-center`. DottedPaper is `mx-auto` so the
    centered indicator sits roughly under the page. A future polish pass
    can render the number INSIDE the DottedPaper bottom-right gutter for
    pixel-perfect alignment, but center is good enough for UAT.

- truth: "Editor toolbar + block area are usable in modules saved at their grid minimum size."
  status: failed
  reason: "User reported: when the module is too small the Add Block panel's buttons and other editor controls cannot be seen — only the '+ Add block' button remains visible. The editor toolbar (Add Block / Bold / Undo / Redo / save indicator / Cancel / Save) gets clipped by the module's overflow-hidden box because the saved gridHeight (e.g. 4 grid units ~80px) is smaller than the toolbar height plus a single block row."
  severity: major
  test: 1
  artifacts:
    - src/features/notebooks/components/ModuleCard.tsx
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Added `minWidth: 320px` and `minHeight: 200px` to the module's
    rendered position style WHEN `isEditing` is true. Saved gridX/gridY/
    gridWidth/gridHeight are unchanged; the visual expansion lasts only
    while edit mode is active so the toolbar + at least one block row
    are reachable on small modules. Trade-off: in edit mode the module
    can visually overlap a sibling at a tightly-packed position, but
    that's acceptable for a transient editing state and reverts on exit.

- truth: "Dragging a module aligns the drag preview to the cursor's grab point."
  status: failed
  reason: "User reported: when dragging by the top-right corner of the module the preview appears centered above the cursor; when dragging by the top-left corner it appears half a module width to the left and slightly above. The cursor-relative grab point is not preserved. Believed to also cause valid placements to be flagged conflicting (red) — the third screenshot shows the drag preview tinted red on an otherwise empty page."
  severity: blocker
  test: 1
  artifacts:
    - src/features/notebooks/components/ModuleDragOverlay.tsx
    - src/features/notebooks/components/GridCanvas.tsx
    - src/features/notebooks/hooks/useCanvasInteractions.ts
  missing:
    - root-cause diagnosis (likely DragOverlay sizing vs. activator rect mismatch, or pixelsToGridUnits using wrong reference frame)
    - reproduction in Playwright/jsdom (needs DOM rect math)
  fix_applied: null
  fix_commit: null
  notes: |
    DEFERRED — out of phase-1 scope (F8 grid canvas territory). Needs a
    dedicated bug-fix phase: requires verifying dnd-kit's DragOverlay
    rect calculation against the canvas's nested layout (LessonPage
    flex column → GridCanvas viewport → DottedPaper → absolute child),
    confirming pixelsToGridUnits' reference frame, and end-to-end
    Playwright reproduction. Recommend `/gsd-debug` or an inserted
    decimal phase (e.g. 1.1) once Phase 1 UAT can otherwise complete.
    UAT can proceed for blocks/editor coverage by SKIPPING module-drag
    and using only the Add Module + edit-mode flows.

- truth: "Page number is positioned within or close to the page bounds (related to drag-math reference frame)."
  status: investigating
  reason: "User suspects the off-page page number is related to the drag misalignment — both pointing to a coordinate-system / wrapper-positioning regression."
  severity: minor
  test: 1
  artifacts:
    - src/features/notebooks/components/LessonPage.tsx
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Treated as cosmetic for now (text-center fix above). If the
    drag-math investigation proves the wrapper is wrongly stretched
    beyond the page bounds, the page-number alignment will be revisited
    as part of that fix.

- truth: "Picking a block type from the Add Block popover adds the block (rather than collapsing the editor with no effect)."
  status: failed
  reason: "User reported: clicking a type in the Add Block popover does nothing AND the module collapses to its saved size. Caused by EditModeOverlay's mousedown click-outside handler — Radix Popover content renders into a document.body portal that lives outside the module's wrapperRef, so the click is treated as 'outside the module' and triggers exit-edit-mode before the popover's onSelect fires."
  severity: major
  test: 2
  artifacts:
    - src/features/notebooks/components/EditModeOverlay.tsx
  missing: []
  fix_applied: 2026-04-30
  fix_commit: pending
  notes: |
    Added a portal-aware bail-out in the click-outside handler: if the
    target is inside `[data-radix-popper-content-wrapper]`,
    `[data-radix-portal]`, or any element with role `dialog` /
    `alertdialog` / `menu` / `listbox`, the editor stays mounted. This
    covers the AddBlockPopover, the DeleteBlockDialog (test 8), the
    UnsavedChangesDialog (test 11), and any future Radix-portaled
    surface the editor opens.






