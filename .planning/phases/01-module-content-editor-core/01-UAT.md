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
updated: 2026-04-30T20:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Enter edit mode on a Title/Theory module
expected: |
  Select a non-Breadcrumb module on the canvas. An "Edit" chip appears
  on the module. Clicking it (or double-clicking the module body) enters
  edit mode: a soft glow ring frames the module, and a sticky editor
  toolbar appears at the top with: Add Block · | · Bold · Undo · Redo · …
  · save indicator · Cancel · Save. Grid layout (position, size) of the
  module does not visibly shift.
awaiting: re-test after lessons-API endpoint fix

## Tests

### 1. Enter edit mode on a Title/Theory module
expected: Select a non-Breadcrumb module → "Edit" chip visible → clicking it (or double-clicking the body) shows edit-mode glow ring + sticky toolbar (Add Block · Bold · Undo · Redo · save indicator · Cancel · Save). Module's grid position/size does not jump.
result: issue
reported: "Cannot open a created lesson — frontend calls non-existing endpoint /notebooks/{notebookId}/lessons/{lessonId}; correct endpoint per Swagger is /lessons/{lessonId}. Same wrong shape on update (PATCH /notebooks/.../lessons/{id}, should be PUT /lessons/{id}) and delete (DELETE /notebooks/.../lessons/{id}, should be DELETE /lessons/{id})."
severity: blocker
fix_applied: |
  src/api/lessons.ts — getLesson/updateLesson/deleteLesson now call the
  flat /lessons/{id} routes per OpenAPI; updateLesson switched from PATCH
  to PUT; getLessons + createLesson unchanged (their notebook-scoped
  collection routes are correct). Hook signatures preserved (notebookId
  prefixed `_` to satisfy noUnusedParameters). MSW handler in
  usePageNavigation.test.tsx updated to match.


### 2. Add Block popover lists allowed types
expected: In edit mode on a Theory module, clicking "Add Block" opens a popover listing the allowed block types (Heading, Date, Text, List, OrderedList, Checklist, Table, Note, Chord, Tab). On a **Title** module the popover shows exactly **Date** and **Text** — nothing else.
result: [pending]

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
passed: 0
issues: 4
pending: 13
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
  fix_applied: 2026-04-30
  fix_commit: 7093b55
  notes: |
    Out of phase-1 scope (lessons API client predates phase 1) but blocks
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




