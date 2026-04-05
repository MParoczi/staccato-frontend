# Phase 3: User Story 1 — View Notebook Cover Page — GitHub Issues

> Users can view a notebook cover with title, instrument, owner name, creation date on a colored background, and edit the notebook's title and cover color.
>
> **Independent test:** Navigate to `/app/notebooks/:id`, verify cover renders with all metadata. Click "Open Notebook" to navigate to index. Open edit dialog, change title/color, confirm update. Delete notebook via toolbar.

---

## Issue: T017 — Create `useUpdateNotebook` mutation hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-3`, `US1`

### Description

Create `src/features/notebooks/hooks/useUpdateNotebook.ts`.

- Wrap `useMutation` calling `updateNotebook(id, data)` from `src/api/notebooks.ts`
- On success, invalidate:
  - `["notebooks", notebookId]` (detail)
  - `["notebooks"]` (dashboard list)
- Signature: `useUpdateNotebook(notebookId: string): UseMutationResult<NotebookDetail, Error, { title?: string; coverColor?: string }>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useUpdateNotebook.ts`
- [ ] Calls `updateNotebook` with correct parameters
- [ ] Invalidates both detail and list query keys on success
- [ ] Returns `useMutation` result

### Dependencies

- Phase 2 complete

### Parallel

Yes — can be implemented in parallel with T018.

---

## Issue: T018 — Create `EditNotebookDialog` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-3`, `US1`

### Description

Create `src/features/notebooks/components/EditNotebookDialog.tsx`.

**Props:** `EditNotebookDialogProps { notebook: NotebookDetail; open: boolean; onOpenChange: (open: boolean) => void; }`

**Form (React Hook Form + edit-notebook-schema):**

- Title input (pre-filled with current title)
- `CoverColorPicker` (reuse existing from Feature 004, pre-filled with current color)
- Instrument name displayed as **read-only** with immutability notice
- Page size displayed as **read-only** with immutability notice

**Behavior:**

- Submit calls `useUpdateNotebook`
- Submit button disabled while mutation is pending
- On success: close dialog
- On error: toast notification, dialog stays open with data preserved
- Earthy themed (not default cold gray)

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/EditNotebookDialog.tsx`
- [ ] Form validates with edit-notebook-schema
- [ ] Reuses existing `CoverColorPicker`
- [ ] Instrument and pageSize shown as read-only
- [ ] Submit disabled while pending
- [ ] Toast on error, dialog preserved
- [ ] Earthy styling

### Dependencies

- T003 (schema), T017 (mutation hook)

### Parallel

Yes — can be implemented in parallel with T017 (different files).

---

## Issue: T019 — Create `CoverPage` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-3`, `US1`

### Description

Create `src/features/notebooks/components/CoverPage.tsx`.

- Reads `notebookId` from route params
- Uses `useNotebook(notebookId)` for notebook data
- Uses `useCurrentUser()` for owner display name

**Rendering:**

- Notebook `coverColor` fills the canvas area (page-sized, no dots — just colored background at fixed aspect ratio)
- Centered content:
  - Title in large serif/display font
  - Instrument name
  - Owner display name
  - Creation date via `Intl.DateTimeFormat` with user locale
- Auto-contrast text color via WCAG luminance calculation (light text on dark covers, dark text on light covers)
- "Open Notebook" button navigates to `/:notebookId/index`
- Edit button (Pencil icon) opens `EditNotebookDialog`
- Should feel like a physical book cover

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/CoverPage.tsx`
- [ ] Cover color fills canvas area
- [ ] Title, instrument, owner name, date all displayed and centered
- [ ] Text color auto-contrasts based on cover color luminance
- [ ] "Open Notebook" navigates to index
- [ ] Edit button opens `EditNotebookDialog`
- [ ] Date formatted with `Intl.DateTimeFormat`
- [ ] All strings use i18n

### Dependencies

- T017, T018 (mutation hook + dialog)

### Parallel

No — depends on T017, T018.

---

## Issue: T020 — Add i18n keys for cover page and edit dialog

**Labels:** `i18n`, `005-notebook-shell-navigation`, `phase-3`, `US1`

### Description

Add translation keys to `src/i18n/en.json` and `src/i18n/hu.json` under:

- `notebooks.shell.cover.*` — "Open Notebook", cover metadata labels
- `notebooks.shell.edit.*` — edit dialog title, field labels, immutability notice, validation messages (`titleRequired`, `titleMaxLength`, `invalidHex`), submit button text

### Acceptance Criteria

- [ ] English keys added to `src/i18n/en.json`
- [ ] Hungarian keys added to `src/i18n/hu.json`
- [ ] All cover page and edit dialog strings covered
- [ ] Validation message keys match schema error messages

### Dependencies

- T019 (to know which strings are needed)

### Parallel

Yes — can be added in parallel with any other task in this phase.
