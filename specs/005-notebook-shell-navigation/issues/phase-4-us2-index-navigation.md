# Phase 4: User Story 2 — Browse Index Page and Navigate Between Pages — GitHub Issues

> Users can view the auto-generated table of contents on dotted paper and navigate linearly through all pages using arrows and keyboard shortcuts.
>
> **Independent test:** Open notebook, verify index page shows TOC with lesson titles and page numbers. Click a TOC entry to navigate. Use prev/next arrows and arrow keys to traverse cover -> index -> all lesson pages without dead ends. Verify global page numbers are correct.

---

## Issue: T021 — Create `IndexPage` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-4`, `US2`

### Description

Create `src/features/notebooks/components/IndexPage.tsx`.

- Reads `notebookId` from route params
- Uses `useNotebook(notebookId)` + `useNotebookIndex(notebookId)`

**Rendering:**

- `DottedPaper` background with serif-font "INDEX" heading at top
- Table of contents from `NotebookIndex.entries`:
  - Sequential number (1, 2, 3...)
  - Lesson title (truncated with ellipsis if long)
  - Dotted leader line (CSS `border-bottom: dotted` or similar)
  - Right-aligned starting page number
- Each entry navigates to that lesson's first page by lazily fetching lesson detail via `useLesson(lessonId)` to resolve the first page ID (per Research R-003 two-tier approach)
- **Empty state:** encouraging message with link to open sidebar to add a lesson
- Global page number "1" in bottom-right corner
- Read-only — no editing on this page

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/IndexPage.tsx`
- [ ] Renders on DottedPaper background
- [ ] "INDEX" heading in serif font
- [ ] TOC entries with number, title, leader line, page number
- [ ] Clicking entry navigates to lesson's first page
- [ ] Empty state shown when no lessons
- [ ] Global page number "1" displayed
- [ ] Long titles truncated with ellipsis
- [ ] All strings use i18n

### Dependencies

- Phase 2 complete (DottedPaper, query hooks)

### Parallel

No — single component in this phase.

---

## Issue: T022 — Add i18n keys for index page

**Labels:** `i18n`, `005-notebook-shell-navigation`, `phase-4`, `US2`

### Description

Add translation keys to `src/i18n/en.json` and `src/i18n/hu.json` under `notebooks.shell.index.*`:

- "INDEX" heading
- Empty state message ("No lessons yet. Open the sidebar to create your first lesson.")
- Page number label

### Acceptance Criteria

- [ ] English keys added to `src/i18n/en.json`
- [ ] Hungarian keys added to `src/i18n/hu.json`
- [ ] All index page strings covered

### Dependencies

- T021 (to know which strings are needed)

### Parallel

Yes — can be added in parallel with T021.
