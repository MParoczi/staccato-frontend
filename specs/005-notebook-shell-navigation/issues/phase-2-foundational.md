# Phase 2: Foundational — GitHub Issues

> Core infrastructure that MUST be complete before ANY user story — layout shell, shared component, query hooks, navigation utility, route wiring.
>
> **CRITICAL**: No user story work can begin until this phase is complete.

---

## Issue: T005 — Create `useNotebook` query hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/hooks/useNotebook.ts`.

- Wrap `useQuery` with query key `["notebooks", notebookId]`
- Fetcher: `getNotebook(notebookId)` from `src/api/notebooks.ts`
- `staleTime: 0` (refetch on window focus per Constitution XI)
- Signature: `useNotebook(notebookId: string): UseQueryResult<NotebookDetail>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useNotebook.ts`
- [ ] Uses query key `["notebooks", notebookId]` and `staleTime: 0`
- [ ] Returns `useQuery` result

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T006, T007, T008, T009, T011, T012.

---

## Issue: T006 — Create `useNotebookIndex` query hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/hooks/useNotebookIndex.ts`.

- Wrap `useQuery` with query key `["notebooks", notebookId, "index"]`
- Fetcher: `getNotebookIndex(notebookId)` from `src/api/notebooks.ts`
- `staleTime: 0`
- Signature: `useNotebookIndex(notebookId: string): UseQueryResult<NotebookIndex>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useNotebookIndex.ts`
- [ ] Uses query key `["notebooks", notebookId, "index"]`
- [ ] Returns `useQuery` result

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T005, T007, T008, T009, T011, T012.

---

## Issue: T007 — Create `useLessons` query hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/hooks/useLessons.ts`.

- Wrap `useQuery` with query key `["notebooks", notebookId, "lessons"]`
- Fetcher: `getLessons(notebookId)` from `src/api/lessons.ts`
- `staleTime: 0`
- Signature: `useLessons(notebookId: string): UseQueryResult<LessonSummary[]>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useLessons.ts`
- [ ] Uses query key `["notebooks", notebookId, "lessons"]`
- [ ] Returns `useQuery` result

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T005, T006, T008, T009, T011, T012.

---

## Issue: T008 — Create `useLesson` query hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/hooks/useLesson.ts`.

- Wrap `useQuery` with query key `["notebooks", notebookId, "lessons", lessonId]`
- Fetcher: `getLesson(notebookId, lessonId)` from `src/api/lessons.ts`
- `staleTime: 0`
- Signature: `useLesson(notebookId: string, lessonId: string): UseQueryResult<LessonDetail>`

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useLesson.ts`
- [ ] Uses query key `["notebooks", notebookId, "lessons", lessonId]`
- [ ] Returns `useQuery` result

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T005, T006, T007, T009, T011, T012.

---

## Issue: T009 — Create page sequence utility

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/utils/page-sequence.ts`.

Export `PageSequenceEntry` type and `buildPageSequence(notebookId, index, lessons)` pure function.

**PageSequenceEntry:**

```typescript
type PageType = 'cover' | 'index' | 'lesson';

interface PageSequenceEntry {
  globalPageNumber: number;   // 0 for cover, 1 for index, 2+ for lessons
  url: string;                // full route path
  type: PageType;
  lessonId?: string;
  pageId?: string;
  lessonTitle?: string;
  pageNumberInLesson?: number;
  totalPagesInLesson?: number;
}
```

**buildPageSequence** returns a linear array: cover entry, index entry, then all lesson pages in order (Lesson 1 Page 1, Lesson 1 Page 2, ..., Lesson 2 Page 1, ...). Uses `NotebookIndex` for lesson ordering and `LessonSummary[]` for page counts. Page IDs resolved lazily via lesson detail.

### Acceptance Criteria

- [ ] File exists at `src/features/notebooks/utils/page-sequence.ts`
- [ ] `PageSequenceEntry` type exported
- [ ] `buildPageSequence` returns correct linear sequence
- [ ] Cover has `globalPageNumber: 0`, index has `1`, lesson pages start at `2`
- [ ] Cross-lesson boundaries handled correctly

### Dependencies

- Phase 1 complete (types)

### Parallel

Yes — can be implemented in parallel with T005-T008, T011, T012.

---

## Issue: T009a — Unit tests for page sequence utility

**Labels:** `test`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/utils/page-sequence.test.ts` per Constitution XII (utility functions MUST have tests).

**Required test cases:**

- [ ] Empty lessons — returns cover + index only (2 entries)
- [ ] Single lesson with 1 page — 3 entries total
- [ ] Single lesson with multiple pages — correct page numbering
- [ ] Multiple lessons — correct cross-lesson sequence
- [ ] Cross-lesson boundary — prev/next URLs correct at lesson boundaries
- [ ] Global page numbers — sequential and correct throughout
- [ ] Cover has no prev URL (first entry)
- [ ] Last page has no next URL (last entry)

### Acceptance Criteria

- [ ] Test file at `src/features/notebooks/utils/page-sequence.test.ts`
- [ ] All 8+ test cases pass
- [ ] Covers boundary conditions and empty states

### Dependencies

- T009 (utility must exist)

### Parallel

Yes — can run in parallel with hooks (different files).

---

## Issue: T010 — Create `usePageNavigation` hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/hooks/usePageNavigation.ts`.

- Reads current route params (`notebookId`, `lessonId`, `pageId`) to determine position
- Calls `useNotebookIndex` + `useLessons` + `useLesson` (for current lesson)
- Uses `buildPageSequence` to compute navigation state
- Returns `PageNavigationResult`:

```typescript
interface PageNavigationResult {
  prevUrl: string | null;
  nextUrl: string | null;
  globalPageNumber: number | null;  // null for cover
  currentPageType: 'cover' | 'index' | 'lesson';
  pageNumberInLesson?: number;
  totalPagesInLesson?: number;
}
```

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/usePageNavigation.ts`
- [ ] Correctly identifies current page type from route params
- [ ] Returns correct prev/next URLs across lesson boundaries
- [ ] Returns null prevUrl on cover, null nextUrl on last page
- [ ] Returns null globalPageNumber for cover

### Dependencies

- T005-T009 (query hooks + page sequence utility)

### Parallel

Yes — can be implemented in parallel with T011, T012.

---

## Issue: T011 — Create `useKeyboardNavigation` hook

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/hooks/useKeyboardNavigation.ts`.

- Signature: `useKeyboardNavigation(prevUrl: string | null, nextUrl: string | null): void`
- Side-effect hook: attaches/detaches document-level `keydown` listener
- Left arrow key navigates to `prevUrl` via React Router `useNavigate`
- Right arrow key navigates to `nextUrl`
- **Suppressed** when focus is on `input`, `textarea`, or `[contenteditable]` elements
- Cleans up listener on unmount

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useKeyboardNavigation.ts`
- [ ] Left arrow navigates to prevUrl when not null
- [ ] Right arrow navigates to nextUrl when not null
- [ ] No navigation when URL is null
- [ ] Suppressed on input/textarea/contenteditable focus
- [ ] Cleans up on unmount

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T005-T010, T012.

---

## Issue: T012 — Create `DottedPaper` shared component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/components/common/DottedPaper.tsx` — reusable dotted paper background (Zone 2).

**Props:**

```typescript
interface DottedPaperProps {
  pageSize: PageSize;
  zoom: number;
  className?: string;
  children?: React.ReactNode;
}
```

**Rendering:**

- CSS `radial-gradient(circle, var(--notebook-dot) 1px, transparent 1px)` for dot pattern
- Background color from `--notebook-paper` CSS variable
- `background-size` scales with zoom using `PAGE_SIZE_DIMENSIONS` from `src/lib/constants/grid.ts`
- Fixed aspect ratio via CSS `aspect-ratio` matching the notebook's page size
- Centered in parent container
- `transform: scale(zoom)` with `transform-origin: top center`

### Acceptance Criteria

- [ ] Component at `src/components/common/DottedPaper.tsx`
- [ ] Renders dotted grid using CSS radial-gradient
- [ ] Uses `--notebook-paper` and `--notebook-dot` CSS variables
- [ ] Fixed aspect ratio from `PAGE_SIZE_DIMENSIONS`
- [ ] Zoom scales via CSS transform
- [ ] Accepts children to render on top of paper

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T005-T011.

---

## Issue: T013 — Create `NotebookToolbar` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/components/NotebookToolbar.tsx` — slim fixed-top bar using earthy dark theme variables.

**Props:** `NotebookToolbarProps { notebook: NotebookDetail; globalPageNumber: number | null; }`

**Contents (left to right):**

1. Breadcrumb: "My Notebooks > [Title]" — "My Notebooks" links to `/app/notebooks`
2. Sidebar toggle: Bookmark Lucide icon, toggles `useUIStore.sidebarOpen`
3. Zoom controls: placeholder area (actual buttons added in Phase 8)
4. Page indicator: pill badge showing `globalPageNumber`, hidden on cover (when null)
5. Style Editor button: enabled, shows "Coming soon" toast on click
6. Export button: enabled, shows "Coming soon" toast on click
7. Delete notebook button: opens `DeleteNotebookDialog` (reuse from Feature 004)

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/NotebookToolbar.tsx`
- [ ] Breadcrumb with working link to dashboard
- [ ] Sidebar toggle toggles `useUIStore.sidebarOpen`
- [ ] Page indicator hidden when `globalPageNumber` is null
- [ ] Style Editor and Export buttons show "Coming soon" toast
- [ ] Delete button opens existing `DeleteNotebookDialog`
- [ ] Earthy dark styling (not default cold gray)

### Dependencies

- T005 (useNotebook for data), T010 (usePageNavigation for page number)

### Parallel

No — depends on hooks from T005, T010.

---

## Issue: T014 — Create `PageNavigationArrows` component

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/features/notebooks/components/PageNavigationArrows.tsx`.

**Props:** `PageNavigationArrowsProps { prevUrl: string | null; nextUrl: string | null; }`

**Rendering:**

- Previous: ChevronLeft Lucide icon, positioned at left of canvas bottom area
- Next: ChevronRight Lucide icon, positioned at right of canvas bottom area
- **Always visible** at subtle low contrast (FR-010)
- **Disabled (dimmed)** when corresponding URL is null — reduced opacity, not clickable (FR-011)
- Click navigates via React Router `useNavigate`
- Earthy-toned icons

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/PageNavigationArrows.tsx`
- [ ] Always visible (not hover-reveal)
- [ ] Disabled state: reduced opacity, not clickable
- [ ] Click navigates to prev/next URL
- [ ] Uses ChevronLeft/ChevronRight Lucide icons

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T013.

---

## Issue: T015 — Create `NotebookLayout` route layout

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Create `src/routes/notebook-layout.tsx` — layout component wrapping all `/app/notebooks/:notebookId/*` sub-routes.

**Data fetching:**

- `useNotebook(notebookId)` for notebook detail
- `useLessons(notebookId)` for lesson list
- Loading: full-page skeleton
- Error: error message with retry button + link back to dashboard

**Layout structure:**

- `NotebookToolbar` at top (fixed)
- Sidebar: shadcn `Sheet` controlled by `useUIStore.sidebarOpen`, left side, empty content for now
- Canvas area container with `PageNavigationArrows`
- `<Outlet />` for child routes (CoverPage, IndexPage, LessonPage)

**Integrations:**

- `usePageNavigation(notebookId)` for nav state
- `useKeyboardNavigation(prevUrl, nextUrl)` for keyboard shortcuts
- **Reset zoom to 1.0 and sidebarOpen to false on notebookId change** (FR-013)

### Acceptance Criteria

- [ ] Layout at `src/routes/notebook-layout.tsx`
- [ ] Fetches notebook + lessons data
- [ ] Loading skeleton renders while pending
- [ ] Error state with retry + dashboard link
- [ ] Toolbar renders at top
- [ ] Sheet sidebar (left, controlled by Zustand)
- [ ] Canvas area with navigation arrows
- [ ] Outlet renders child routes
- [ ] Zoom and sidebarOpen reset on notebookId change
- [ ] Keyboard navigation active

### Dependencies

- T005-T014 (all hooks, utility, components)

### Parallel

No — depends on all prior Phase 2 tasks.

---

## Issue: T016 — Restructure notebook routes

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-2`

### Description

Update `src/routes/index.tsx` to replace the three placeholder routes with real components inside `NotebookLayout`.

**Route structure:**

```
/app/notebooks/:notebookId        → NotebookLayout > CoverPage (index route)
/app/notebooks/:notebookId/index  → NotebookLayout > IndexPage
/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId → NotebookLayout > LessonPage
```

- Import `NotebookLayout` from `src/routes/notebook-layout.tsx`
- Import `CoverPage`, `IndexPage`, `LessonPage` from `src/features/notebooks/components/` (stub components for now — real implementations in Phases 3-5)
- Remove `NotebookView`, `NotebookIndex`, `PageEditor` placeholders from `src/routes/placeholders.tsx` (keep `ExportsPage`, `ChordsPage`)

### Acceptance Criteria

- [ ] All three notebook routes wrapped in `NotebookLayout`
- [ ] `:notebookId` index route renders `CoverPage`
- [ ] `/index` route renders `IndexPage`
- [ ] `/lessons/:lessonId/pages/:pageId` renders `LessonPage`
- [ ] Placeholder exports removed from `placeholders.tsx`
- [ ] No dead imports

### Dependencies

- T015 (NotebookLayout must exist)

### Parallel

No — sequential after T015.
