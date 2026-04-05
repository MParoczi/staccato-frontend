# Phase 3: User Story 1 — View Notebook Collection — GitHub Issues

> Users see their notebook collection as visual cards in a responsive grid, with sorting, loading skeletons, and an empty state.
>
> **Independent test:** Navigate to `/app/notebooks` with data → card grid; no notebooks → empty state; change sort → reorder; loading → skeletons.

---

## Issue: T007 — Create `NotebookCard` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-3`, `US1`

### Description

Create a presentational `NotebookCard` component in `src/features/notebooks/components/NotebookCard.tsx`.

**Props:** `NotebookSummary` + `onDelete` callback.

**Renders:**

- Cover-color top stripe (~35–40% height) via inline `background-color`
- Warm white body with:
  - Title (2-line truncation with ellipsis)
  - Instrument name (Music Lucide icon + name, truncated)
  - Page size `Badge`
  - Lesson count with ICU-pluralized label
  - Locale-formatted date via `Intl.DateTimeFormat`
- Three-dot `DropdownMenu` (MoreVertical icon) in top-right of body with "Delete" item (Trash2 icon)
- Card clickable via `useNavigate` to `/app/notebooks/${notebook.id}`
- Menu click uses `e.stopPropagation()` to prevent navigation

**Hover:** `transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg` with `@media (prefers-reduced-motion: reduce)` disabling transforms.

All text via `useTranslation` with `notebooks` namespace.

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/NotebookCard.tsx`
- [ ] Cover color stripe renders from `notebook.coverColor`
- [ ] Title truncates at 2 lines
- [ ] Lesson count uses ICU pluralization
- [ ] Date formatted with `Intl.DateTimeFormat`
- [ ] Card click navigates to detail page
- [ ] Dropdown menu opens without triggering card navigation
- [ ] `prefers-reduced-motion` disables hover transforms

### Dependencies

- Phase 2 complete

### Parallel

Yes — independent of T008, T009, T010.

---

## Issue: T008 — Create `NotebookCardSkeleton` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-3`, `US1`

### Description

Create a presentational `NotebookCardSkeleton` in `src/features/notebooks/components/NotebookCardSkeleton.tsx`.

- Matches `NotebookCard` layout using shadcn `Skeleton` component
- Colored stripe placeholder at top
- Text line placeholders for title, instrument, page size, lesson count, date
- Same card dimensions as `NotebookCard`

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/NotebookCardSkeleton.tsx`
- [ ] Layout matches `NotebookCard` structure
- [ ] Uses shadcn `Skeleton` primitives

### Dependencies

- Phase 2 complete

### Parallel

Yes — independent of T007, T009, T010.

---

## Issue: T009 — Create `EmptyState` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-3`, `US1`

### Description

Create a presentational `EmptyState` component in `src/features/notebooks/components/EmptyState.tsx`.

- Centered layout with BookOpen Lucide icon (large, muted earthy tone)
- Localized heading "No notebooks yet"
- Localized subtext "Create your first notebook!"
- Primary `Button` calling `onCreate` prop
- Warm inviting styling per Zone 1 design system
- No emojis

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/EmptyState.tsx`
- [ ] All strings use i18n keys
- [ ] `onCreate` prop triggers on button click

### Dependencies

- Phase 2 complete

### Parallel

Yes — independent of T007, T008, T010.

---

## Issue: T010 — Create `SortControl` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-3`, `US1`

### Description

Create a presentational `SortControl` component in `src/features/notebooks/components/SortControl.tsx`.

- shadcn `Select` dropdown with three options:
  - "Last updated" → value `updatedAt`
  - "Created date" → value `createdAt`
  - "Title (A–Z)" → value `title`
- Receives `value` and `onChange` props
- Subtle styling (not visually dominant)
- All labels localized

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/SortControl.tsx`
- [ ] Three sort options with correct values
- [ ] All labels use i18n
- [ ] Controlled via `value` / `onChange`

### Dependencies

- Phase 2 complete

### Parallel

Yes — independent of T007, T008, T009.

---

## Issue: T011 — Create `NotebooksDashboardPage` container

**Labels:** `feature`, `004-notebook-dashboard`, `phase-3`, `US1`

### Description

Create the container component in `src/features/notebooks/components/NotebooksDashboardPage.tsx`.

**Behavior:**

- Uses `useNotebooks()` hook
- Local `useState` for sort (default `updatedAt`, resets on mount)
- `useMemo` to sort notebook data client-side (`updatedAt` desc, `createdAt` desc, `title` asc)

**Renders:**

- Page header with localized title + `SortControl` + "Create Notebook" `Button` (Plus icon)
- **Loading state:** 6 × `NotebookCardSkeleton` in CSS Grid
- **Error state:** error message + retry button
- **Empty state:** `EmptyState` component
- **Populated state:** responsive CSS Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`) with `NotebookCard` per notebook + dashed-border add card as last grid item (Plus icon + localized "New notebook" text)
- Uses `useLocation()` to detect `/app/notebooks/new` and auto-open create dialog (wired in Phase 4)
- Cream page background per Zone 1

### Acceptance Criteria

- [ ] Container at `src/features/notebooks/components/NotebooksDashboardPage.tsx`
- [ ] All four states render correctly (loading, error, empty, populated)
- [ ] Sort is client-side and resets on mount
- [ ] Responsive grid breakpoints work
- [ ] Dashed add-card present in populated state

### Dependencies

- T005 (useNotebooks), T007, T008, T009, T010

### Parallel

No — depends on all presentational components in this phase.

---

## Issue: T012 — Update routing to use real dashboard

**Labels:** `feature`, `004-notebook-dashboard`, `phase-3`, `US1`

### Description

Update `src/routes/index.tsx`:

- Replace `NotebooksDashboard` and `NewNotebook` placeholder imports with real `NotebooksDashboardPage` from `src/features/notebooks/components/NotebooksDashboardPage`
- Both `/app/notebooks` and `/app/notebooks/new` routes render `NotebooksDashboardPage`
- Remove `NotebooksDashboard` and `NewNotebook` exports from `src/routes/placeholders.tsx`

### Acceptance Criteria

- [ ] `/app/notebooks` renders `NotebooksDashboardPage`
- [ ] `/app/notebooks/new` renders `NotebooksDashboardPage`
- [ ] Placeholder exports removed
- [ ] No dead imports

### Dependencies

- T011 (dashboard page must exist)

### Parallel

No — sequential after T011.

---

## Issue: T012b — Write hook test for `useNotebooks`

**Labels:** `test`, `004-notebook-dashboard`, `phase-3`, `US1`

### Description

Write tests in `src/features/notebooks/hooks/useNotebooks.test.ts`.

- MSW handler for `GET /notebooks` returning mock `NotebookSummary[]`
- **Test cases:**
  - [ ] Returns data on success
  - [ ] Handles error state
  - [ ] Uses query key `["notebooks"]` with `staleTime: 0`

### Acceptance Criteria

- [ ] Test file at `src/features/notebooks/hooks/useNotebooks.test.ts`
- [ ] All test cases pass
- [ ] MSW used for API mocking

### Dependencies

- T005 (hook must exist)

### Parallel

Yes — can run in parallel with T007–T010.
