# Phase 7: User Story 5 — Manage Pages Within a Lesson — GitHub Issues

> Users can add and delete pages within a lesson. 10+ page warning displayed as toast. Last page deletion prevented with error. After deletion, navigate to previous page.
>
> **Independent test:** Navigate to a lesson page. Click "Add Page" — new page appears, count updates. Add pages until 10+ and verify toast warning. Try deleting the only page — verify error. Delete a non-last page — verify confirmation dialog, removal, navigation to previous page.

---

## Issue: T034 — Create `useCreatePage` mutation hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-7`, `US5`

### Description

Create `src/features/notebooks/hooks/useCreatePage.ts`.

- Wrap `useMutation` calling `createPage(lessonId)` from `src/api/pages.ts`
- On success, invalidate:
  - `["notebooks", notebookId, "lessons", lessonId]`
  - `["notebooks", notebookId, "lessons", lessonId, "pages"]`
  - `["notebooks", notebookId, "index"]`
- If response has `warning` field, show toast notification with warning message
- Navigate to the newly created page
- Signature: `useCreatePage(notebookId: string, lessonId: string): UseMutationResult<LessonPageWithWarning, Error, void>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useCreatePage.ts`
- [ ] Calls `createPage(lessonId)`
- [ ] Invalidates lesson detail, pages, and index on success
- [ ] Shows toast when response contains `warning`
- [ ] Navigates to new page on success

### Dependencies

- T002 (pages API), Phase 2 complete

### Parallel

Yes — can be implemented in parallel with T035.

---

## Issue: T035 — Create `useDeletePage` mutation hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-7`, `US5`

### Description

Create `src/features/notebooks/hooks/useDeletePage.ts`.

- Wrap `useMutation` calling `deletePage(lessonId, pageId)` from `src/api/pages.ts`
- On success, invalidate same keys as T034
- On success: navigate to previous page (or next page if deleting page 1)
- Handle 422 `LAST_PAGE_DELETION` error: show toast "Cannot delete the last page in a lesson."
- Signature: `useDeletePage(notebookId: string, lessonId: string): UseMutationResult<void, Error, string>` (pageId)

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useDeletePage.ts`
- [ ] Calls `deletePage(lessonId, pageId)`
- [ ] Invalidates caches on success
- [ ] Navigates to previous page after deletion (next if page 1)
- [ ] Handles 422 LAST_PAGE_DELETION with toast

### Dependencies

- T002 (pages API), Phase 2 complete

### Parallel

Yes — can be implemented in parallel with T034.

---

## Issue: T036 — Create `DeletePageButton` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-7`, `US5`

### Description

Create `src/features/notebooks/components/DeletePageButton.tsx`.

**Props:** `DeletePageButtonProps { lessonId: string; pageId: string; isLastPage: boolean; onDeleted?: () => void; }`

**Behavior:**

- If `isLastPage` is true: clicking shows error toast immediately ("Cannot delete the last page in a lesson.") — no dialog
- Otherwise: opens shadcn `AlertDialog` with text "Delete this page? This action cannot be undone."
- Confirm calls `useDeletePage`
- Confirm button disabled while pending

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/DeletePageButton.tsx`
- [ ] Last page: immediate error toast, no dialog
- [ ] Non-last page: confirmation dialog
- [ ] Confirm disabled while pending
- [ ] Calls `onDeleted` on success

### Dependencies

- T035 (mutation hook)

### Parallel

No — depends on T035.

---

## Issue: T037 — Add "Add Page" button to toolbar

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-7`, `US5`

### Description

Update `src/features/notebooks/components/NotebookToolbar.tsx`:

- Add "Add Page" button visible only on lesson pages (`currentPageType === 'lesson'`)
- Calls `useCreatePage(notebookId, lessonId)` from route params
- Button disabled while mutation is pending
- Plus icon from Lucide React

### Acceptance Criteria

- [ ] "Add Page" button in toolbar on lesson pages only
- [ ] Hidden on cover and index pages
- [ ] Disabled while pending
- [ ] Creates page on click

### Dependencies

- T034 (useCreatePage hook), T013 (toolbar exists)

### Parallel

No — modifies existing component.

---

## Issue: T038 — Add floating "Add Page" button to `LessonPage`

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-7`, `US5`

### Description

Update `src/features/notebooks/components/LessonPage.tsx`:

- Add a smaller floating "Add Page" button near the page indicator area
- Same mutation as toolbar button (`useCreatePage`)
- Disabled while pending

### Acceptance Criteria

- [ ] Floating button visible on lesson pages near page indicator
- [ ] Creates page on click
- [ ] Disabled while pending

### Dependencies

- T034 (useCreatePage hook), T023 (LessonPage exists)

### Parallel

Yes — can be implemented in parallel with T037 (different files).

---

## Issue: T039 — Add `DeletePageButton` to `LessonPage`

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-7`, `US5`

### Description

Update `src/features/notebooks/components/LessonPage.tsx`:

- Add `DeletePageButton` positioned near the page indicator area
- Pass `isLastPage` computed from lesson's pages array (`pages.length === 1`)
- Pass `lessonId` and `pageId` from route params

### Acceptance Criteria

- [ ] `DeletePageButton` rendered on lesson pages
- [ ] `isLastPage` correctly computed from lesson pages array
- [ ] Positioned near page indicator area

### Dependencies

- T036 (DeletePageButton component), T023 (LessonPage exists)

### Parallel

Yes — can be implemented in parallel with T037, T038.

---

## Issue: T040 — Add i18n keys for page management

**Labels:** `i18n`, `005-notebook-shell-navigation`, `phase-7`, `US5`

### Description

Add translation keys to `src/i18n/en.json` and `src/i18n/hu.json` under `notebooks.shell.page.*`:

- "Add Page" button labels
- Delete page confirmation text
- "Cannot delete the last page" error message
- Page warning toast prefix

### Acceptance Criteria

- [ ] English keys added to `src/i18n/en.json`
- [ ] Hungarian keys added to `src/i18n/hu.json`
- [ ] All page management strings covered

### Dependencies

- T036-T039 (to know which strings are needed)

### Parallel

Yes — can be added in parallel with any other task in this phase.
