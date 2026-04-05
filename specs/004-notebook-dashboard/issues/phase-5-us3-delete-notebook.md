# Phase 5: User Story 3 — Delete a Notebook — GitHub Issues

> Users delete notebooks via three-dot menu with confirmation dialog and optimistic removal.
>
> **Independent test:** Three-dot menu → "Delete" → confirmation with title → confirm → card removed immediately; cancel → card stays; server error → card reappears with error toast.

---

## Issue: T023 — Create `useDeleteNotebook` mutation hook

**Labels:** `feature`, `004-notebook-dashboard`, `phase-5`, `US3`

### Description

Create the `useDeleteNotebook` mutation hook in `src/features/notebooks/hooks/useDeleteNotebook.ts`.

**Optimistic update pattern per constitution:**

- `mutationFn`: `deleteNotebook()` from `src/api/notebooks.ts`
- `onMutate`: cancel refetches for `["notebooks"]`, snapshot `queryClient.getQueryData<NotebookSummary[]>(["notebooks"])`, set cache to filtered list without deleted notebook, return `{ previousNotebooks }` context
- `onError`: restore cache from `context.previousNotebooks`, show error toast via sonner
- `onSettled`: invalidate `["notebooks"]`

### Acceptance Criteria

- [ ] Hook at `src/features/notebooks/hooks/useDeleteNotebook.ts`
- [ ] Optimistic removal from cache on mutate
- [ ] Rollback on error with toast notification
- [ ] Cache invalidation on settled (success or error)

### Dependencies

- Phase 3 complete (US1 — card component exists)

### Parallel

No — sequential (T023 → T024 → T025). Can run in parallel with Phase 4 (US2).

---

## Issue: T024 — Create `DeleteNotebookDialog` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-5`, `US3`

### Description

Create `DeleteNotebookDialog` in `src/features/notebooks/components/DeleteNotebookDialog.tsx`.

- shadcn `AlertDialog`
- Receives `notebook: NotebookSummary | null`, `open`, `onOpenChange` props
- Displays localized title "Delete {notebook.title}?" and message "This will permanently delete all lessons and content. This action cannot be undone."
- Cancel button + destructive Confirm button
- Confirm calls `useDeleteNotebook` mutation then closes dialog
- Both buttons disabled while mutation is pending

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/DeleteNotebookDialog.tsx`
- [ ] Title interpolates notebook name
- [ ] Destructive confirm button triggers deletion
- [ ] Buttons disabled during pending state
- [ ] All strings localized

### Dependencies

- T023 (useDeleteNotebook)

### Parallel

No — sequential after T023.

---

## Issue: T025 — Integrate `DeleteNotebookDialog` into dashboard

**Labels:** `feature`, `004-notebook-dashboard`, `phase-5`, `US3`

### Description

Update `src/features/notebooks/components/NotebooksDashboardPage.tsx`:

- Add `useState` for `notebookToDelete: NotebookSummary | null`
- Pass `onDelete` callback to each `NotebookCard` that sets `notebookToDelete`
- Render `DeleteNotebookDialog` with `open={notebookToDelete !== null}` and `onOpenChange` that clears `notebookToDelete` on close

### Acceptance Criteria

- [ ] Delete triggers from card three-dot menu
- [ ] Confirmation dialog shows correct notebook title
- [ ] After confirm: card removed optimistically
- [ ] After cancel: card remains, dialog closes

### Dependencies

- T024 (DeleteNotebookDialog), T011 (NotebooksDashboardPage)

### Parallel

No — sequential after T024.

---

## Issue: T025b — Write hook test for `useDeleteNotebook`

**Labels:** `test`, `004-notebook-dashboard`, `phase-5`, `US3`

### Description

Write tests in `src/features/notebooks/hooks/useDeleteNotebook.test.ts`.

**MSW handlers:**

- `DELETE /notebooks/{id}` — success 204, error 404

**Test cases:**

- [ ] Optimistic removal from `["notebooks"]` cache on mutate
- [ ] Rollback on error (cache restored to previous state)
- [ ] Invalidation on settled

### Acceptance Criteria

- [ ] Test file at `src/features/notebooks/hooks/useDeleteNotebook.test.ts`
- [ ] All test cases pass
- [ ] MSW used for API mocking

### Dependencies

- T023 (hook must exist)

### Parallel

Yes — can run in parallel with T024–T025.
