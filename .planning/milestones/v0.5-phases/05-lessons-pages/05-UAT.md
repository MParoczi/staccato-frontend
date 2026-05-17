---
phase: "05"
phase-name: "Lessons & Pages"
session-start: "2026-05-17"
status: complete
total-tests: 10
passed: 10
failed: 0
skipped: 0
blocked: 0
---

# Phase 5 — Lessons & Pages: UAT

## Session

**Phase goal:** Users can create and manage lessons within a notebook, navigate between lesson pages using a page-flip shell, add/delete pages with a soft 10-page warning, and see correct global page numbers.

**Requirements under test:** LES-01, LES-02, LES-03, LES-04, PAGE-01, PAGE-02

---

## Tests

### T-01 — Lessons tab navigation
**Requirement:** LES-04
**What to check:** Open a notebook. A "Lessons" tab is visible in the tab bar alongside Cover and Index. Clicking it loads the lessons list at `/app/notebooks/{id}/lessons` — no crash, no blank page.
**Status:** ✅ passed

---

### T-02 — Empty state
**Requirement:** LES-01
**What to check:** With a notebook that has no lessons, the Lessons tab shows an empty state — an icon, a heading, and a "New Lesson" call-to-action. Not an error, not a blank list.
**Status:** ✅ passed

---

### T-03 — Create lesson and auto-navigate
**Requirement:** LES-01
**What to check:** Click "New Lesson" (header button or dashed first-row). A dialog opens with a title field. Fill in a title and submit. The app navigates to the new lesson at `/app/notebooks/{id}/lessons/{lessonId}` automatically.
**Status:** ✅ passed

---

### T-04 — Lesson page shell and controls bar
**Requirement:** LES-04
**What to check:** Inside a lesson, a top controls bar is visible below the Navbar containing: a back link to the lesson list, the lesson title, "Page X of Y", a global page number, Prev/Next buttons, and Add page / Delete page buttons. Below the bar, a dotted-grid canvas area fills the page (no text, no "coming soon").
**Status:** ✅ passed
**Fixes applied:**
- `globalPageNumber` showed 0 — backend uses 0-indexed `globalPageStart`; added +1 to computed value
- Dotted-grid not rendering — `hsl(var(--muted-foreground) / 0.25)` invalid in Tailwind v4 (oklch tokens); switched to `color-mix(in oklch, var(--muted-foreground) 25%, transparent)`

---

### T-05 — Rename lesson
**Requirement:** LES-02
**What to check:** From the lesson list, open the ⋮ menu on a lesson row and choose "Rename". A dialog pre-filled with the current title appears. Change the title and save. The lesson list immediately shows the updated title.
**Status:** ✅ passed
**Fix applied:** Rename only invalidated `['lessons', notebookId]`; added `['lesson', lessonId]` invalidation so LessonPage title updates without a refresh

---

### T-06 — Delete lesson with confirmation
**Requirement:** LES-03
**What to check:** From the lesson list, open the ⋮ menu on a lesson row and choose "Delete". A confirmation dialog appears showing the lesson name and "This can't be undone" language. Confirm. The lesson disappears from the list.
**Status:** ✅ passed

---

### T-07 — Add page and navigate to new page
**Requirement:** PAGE-01
**What to check:** Inside a lesson, click "Add page". The page count in the controls bar increments by 1 and the view navigates to the newly added (last) page automatically.
**Status:** ✅ passed
**Fix applied:** `newPage.pageNumber` was undefined (backend field mismatch → NaN in URL); switched to `totalPages + 1` computed client-side

---

### T-08 — Delete page disabled on last page
**Requirement:** PAGE-02
**What to check:** Inside a lesson with exactly 1 page, the "Delete page" button is disabled (greyed out, unclickable). With 2+ pages, delete a page — the view navigates to the previous page (or page 1 if deleting page 1) and the page count decrements.
**Status:** ✅ passed

---

### T-09 — 10-page soft warning toast
**Requirement:** PAGE-01
**What to check:** Add pages to a lesson until you cross 10 pages. When adding the 11th page (or whichever triggers the soft limit), a Sonner toast warning appears. The page is still added — the warning is not a block.
**Status:** ✅ passed

---

### T-10 — Navbar 3-level breadcrumb on lesson page
**Requirement:** LES-04
**What to check:** While inside a lesson page (`/app/notebooks/{id}/lessons/{lessonId}`), the Navbar shows a 3-level breadcrumb: "Notebooks › [Notebook Name] › [Lesson Title]". Clicking "Notebooks" goes to `/app/notebooks`; clicking "[Notebook Name]" goes to the lesson list (`/app/notebooks/{id}/lessons`).
**Status:** ✅ passed

---

## Issues Found & Fixed

| # | Test | Issue | Fix |
|---|------|-------|-----|
| 1 | T-04 | "Notebook p. 0" — global page number showed 0 | Backend uses 0-indexed `globalPageStart`; added +1 to computed value in `LessonPage.tsx` |
| 2 | T-04 | Dotted-grid canvas not rendering | `hsl(var(--muted-foreground) / 0.25)` invalid in Tailwind v4 (oklch tokens); switched to `color-mix(in oklch, var(--muted-foreground) 25%, transparent)` |
| 3 | T-07 | Adding a page caused NaN in URL and broke all navigation | `newPage.pageNumber` undefined (backend field mismatch); switched to `totalPages + 1` computed client-side |
| 4 | T-05 | After rename, old title showed on LessonPage without refresh | `RenameLessonDialog` only invalidated `['lessons', notebookId]`; added `['lesson', lessonId]` invalidation |

## Backend Discoveries

- `globalPageStart` is 0-indexed (value 0 = first lesson, no preceding pages)
- `POST /lessons/{id}/pages` response does not include a `pageNumber` field matching the frontend's `LessonPage` type

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Passed | 10 |
| ❌ Failed | 0 |
| ⏭ Skipped | 0 |
| 🔲 Blocked | 0 |
| ⬜ Pending | 0 |
