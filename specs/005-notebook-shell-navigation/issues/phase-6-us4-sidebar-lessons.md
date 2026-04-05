# Phase 6: User Story 4 — Manage Lessons via Sidebar — GitHub Issues

> Users can open the sidebar to see all lessons, navigate to any lesson, create new lessons, edit lesson titles inline, and delete lessons.
>
> **Independent test:** Toggle sidebar open, verify lesson list with titles and dates. Click a lesson — navigates to first page, sidebar stays open. Add a new lesson — appears in list, navigates to its first page. Edit a lesson title inline. Delete a lesson with confirmation.

---

## Issue: T025 — Create `useCreateLesson` mutation hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Create `src/features/notebooks/hooks/useCreateLesson.ts`.

- Wrap `useMutation` calling `createLesson(notebookId, { title })` from `src/api/lessons.ts`
- On success, invalidate:
  - `["notebooks", notebookId, "lessons"]`
  - `["notebooks", notebookId, "index"]`
- Signature: `useCreateLesson(notebookId: string): UseMutationResult<LessonDetail, Error, { title: string }>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useCreateLesson.ts`
- [ ] Calls `createLesson` with correct parameters
- [ ] Invalidates lessons list and index on success

### Dependencies

- Phase 2 complete

### Parallel

Yes — can be implemented in parallel with T026, T027, T028, T029.

---

## Issue: T026 — Create `useUpdateLesson` mutation hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Create `src/features/notebooks/hooks/useUpdateLesson.ts`.

- Wrap `useMutation` calling `updateLesson(notebookId, lessonId, { title })` from `src/api/lessons.ts`
- On success, invalidate:
  - `["notebooks", notebookId, "lessons"]`
  - `["notebooks", notebookId, "index"]`
  - `["notebooks", notebookId, "lessons", lessonId]`
- Signature: `useUpdateLesson(notebookId: string): UseMutationResult<LessonDetail, Error, { lessonId: string; title: string }>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useUpdateLesson.ts`
- [ ] Calls `updateLesson` with correct parameters
- [ ] Invalidates lessons list, index, and lesson detail on success

### Dependencies

- Phase 2 complete

### Parallel

Yes — can be implemented in parallel with T025, T027, T028, T029.

---

## Issue: T027 — Create `useDeleteLesson` mutation hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Create `src/features/notebooks/hooks/useDeleteLesson.ts`.

- Wrap `useMutation` calling `deleteLesson(notebookId, lessonId)` from `src/api/lessons.ts`
- On success, invalidate:
  - `["notebooks", notebookId, "lessons"]`
  - `["notebooks", notebookId, "index"]`
  - `["notebooks", notebookId]` (lesson count changes)
- Signature: `useDeleteLesson(notebookId: string): UseMutationResult<void, Error, string>` (lessonId)

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useDeleteLesson.ts`
- [ ] Calls `deleteLesson` with correct parameters
- [ ] Invalidates lessons list, index, and notebook detail on success

### Dependencies

- Phase 2 complete

### Parallel

Yes — can be implemented in parallel with T025, T026, T028, T029.

---

## Issue: T028 — Create `CreateLessonDialog` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Create `src/features/notebooks/components/CreateLessonDialog.tsx`.

**Props:** `CreateLessonDialogProps { notebookId: string; open: boolean; onOpenChange: (open: boolean) => void; onCreated?: (lesson: LessonDetail) => void; }`

**Form (React Hook Form + lesson-title-schema):**

- Title input

**Behavior:**

- Submit calls `useCreateLesson`
- Submit button disabled while pending
- On success: close dialog, call `onCreated` callback, navigate to new lesson's first page
- On error: toast notification, dialog stays open with title preserved
- Earthy themed

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/CreateLessonDialog.tsx`
- [ ] Form validates with lesson-title-schema
- [ ] Submit disabled while pending
- [ ] On success: dialog closes, navigates to new lesson's first page
- [ ] Toast on error, dialog preserved
- [ ] Earthy styling

### Dependencies

- T004 (schema), T025 (mutation hook)

### Parallel

Yes — can be implemented in parallel with T025-T027, T029.

---

## Issue: T029 — Create `DeleteLessonDialog` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Create `src/features/notebooks/components/DeleteLessonDialog.tsx`.

**Props:** `DeleteLessonDialogProps { lesson: LessonSummary; notebookId: string; open: boolean; onOpenChange: (open: boolean) => void; onDeleted?: () => void; }`

- shadcn `AlertDialog` with confirmation text: "Delete [lesson title]? This will permanently delete all pages. This action cannot be undone."
- Confirm calls `useDeleteLesson`
- Confirm button disabled while pending
- On error: toast notification
- Earthy themed

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/DeleteLessonDialog.tsx`
- [ ] Shows lesson title in confirmation text
- [ ] Confirm disabled while pending
- [ ] Calls `onDeleted` callback on success
- [ ] Toast on error
- [ ] Earthy styling

### Dependencies

- T027 (mutation hook)

### Parallel

Yes — can be implemented in parallel with T025-T028.

---

## Issue: T030 — Create `LessonSidebarEntry` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Create `src/features/notebooks/components/LessonSidebarEntry.tsx`.

**Props:** `LessonSidebarEntryProps { lesson: LessonSummary; notebookId: string; isActive: boolean; onNavigate: (lessonId: string) => void; onDeleted?: () => void; }`

**Rendering:**

- Lesson title (bold, truncated with ellipsis)
- Creation date (muted, `Intl.DateTimeFormat`)
- Active lesson highlighted with warm brown background
- **Inline title edit:** Pencil icon enters edit mode (React Hook Form with lesson-title-schema). Enter/blur to save via `useUpdateLesson`. Escape to cancel. Revert on error with toast.
- **Delete:** Trash icon opens `DeleteLessonDialog`
- **Navigate:** Click row navigates to lesson's first page via `useLesson` to get first page ID

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/LessonSidebarEntry.tsx`
- [ ] Title bold, truncated; date muted
- [ ] Active state with warm brown highlight
- [ ] Inline edit: pencil icon, Enter/blur save, Escape cancel
- [ ] Edit reverts on error with toast
- [ ] Trash icon opens delete dialog
- [ ] Row click navigates to first page

### Dependencies

- T025-T029 (mutation hooks + dialogs)

### Parallel

No — depends on hooks and dialogs.

---

## Issue: T031 — Create `NotebookSidebar` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Create `src/features/notebooks/components/NotebookSidebar.tsx`.

**Props:** `NotebookSidebarProps { notebook: NotebookDetail; lessons: LessonSummary[]; isLoading: boolean; }`

**Rendering:**

- Notebook title at top
- shadcn `ScrollArea` containing lesson list (each as `LessonSidebarEntry`)
- Lessons ordered by `createdAt` ascending (FR-022)
- "Add Lesson" button at bottom opens `CreateLessonDialog`
- **Loading state:** skeleton entries
- **Empty state:** "No lessons yet" message with the Add Lesson button
- Warm cream/off-white panel with earthy dividers

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/NotebookSidebar.tsx`
- [ ] Notebook title displayed
- [ ] Lessons in ScrollArea, ordered by createdAt ascending
- [ ] "Add Lesson" button at bottom
- [ ] Loading skeleton entries
- [ ] Empty state with encouraging message
- [ ] Warm cream styling with earthy dividers

### Dependencies

- T030 (LessonSidebarEntry)

### Parallel

No — depends on T030.

---

## Issue: T032 — Wire `NotebookSidebar` into layout

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Update `src/routes/notebook-layout.tsx`:

- Replace the empty sidebar Sheet content with `NotebookSidebar`
- Pass `notebook`, `lessons` data, and `isLoading` state from the existing queries

### Acceptance Criteria

- [ ] Sheet content is `NotebookSidebar`
- [ ] Sidebar receives notebook, lessons, and loading state
- [ ] Sidebar toggle works (open/close)

### Dependencies

- T031 (NotebookSidebar must exist)

### Parallel

No — sequential after T031.

---

## Issue: T033 — Add i18n keys for sidebar and lesson CRUD dialogs

**Labels:** `i18n`, `005-notebook-shell-navigation`, `phase-6`, `US4`

### Description

Add translation keys to `src/i18n/en.json` and `src/i18n/hu.json` under:

- `notebooks.shell.sidebar.*` — sidebar title, "No lessons yet", lesson entry labels
- `notebooks.shell.createLesson.*` — dialog title, title input label, submit button, validation messages
- `notebooks.shell.deleteLesson.*` — dialog title, confirmation text, confirm/cancel buttons

### Acceptance Criteria

- [ ] English keys added to `src/i18n/en.json`
- [ ] Hungarian keys added to `src/i18n/hu.json`
- [ ] All sidebar and lesson CRUD strings covered

### Dependencies

- T028-T031 (to know which strings are needed)

### Parallel

Yes — can be added in parallel with any other task in this phase.
