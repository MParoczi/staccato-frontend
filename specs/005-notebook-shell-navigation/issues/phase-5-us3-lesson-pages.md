# Phase 5: User Story 3 — View Lesson Pages — GitHub Issues

> Users can view lesson pages with dotted paper background, lesson title, page indicator, and a placeholder canvas.
>
> **Independent test:** Navigate to `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`, verify dotted paper renders, lesson title shows at top, page indicator shows correct position (e.g., "Page 2 / 4"), global page number is correct.

---

## Issue: T023 — Create `LessonPage` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-5`, `US3`

### Description

Create `src/features/notebooks/components/LessonPage.tsx`.

- Reads `notebookId`, `lessonId`, `pageId` from route params
- Uses `useLesson(notebookId, lessonId)` for lesson data

**Rendering:**

- `DottedPaper` background
- Lesson title at top
- In-lesson page indicator at top-right: "Page X / Y" (e.g., "Page 2 / 4")
- Global page number in bottom-right corner
- Centered placeholder message indicating future canvas/module editor
- **404 handling:** if lesson/page not found (stale URL), show "Page not found" message with link back to index

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/LessonPage.tsx`
- [ ] Renders on DottedPaper background
- [ ] Lesson title displayed at top
- [ ] In-lesson page indicator shows correct "Page X / Y"
- [ ] Global page number in bottom-right
- [ ] Placeholder message for future canvas
- [ ] Handles stale URL (404) with "Page not found" + link to index
- [ ] All strings use i18n

### Dependencies

- Phase 2 complete (DottedPaper, useLesson hook)

### Parallel

No — single component in this phase.

---

## Issue: T024 — Add i18n keys for lesson page

**Labels:** `i18n`, `005-notebook-shell-navigation`, `phase-5`, `US3`

### Description

Add translation keys to `src/i18n/en.json` and `src/i18n/hu.json` under `notebooks.shell.lesson.*`:

- Page indicator format ("Page {{current}} / {{total}}")
- Placeholder canvas message
- "Page not found" error message
- Link to index text

### Acceptance Criteria

- [ ] English keys added to `src/i18n/en.json`
- [ ] Hungarian keys added to `src/i18n/hu.json`
- [ ] All lesson page strings covered

### Dependencies

- T023 (to know which strings are needed)

### Parallel

Yes — can be added in parallel with T023.
