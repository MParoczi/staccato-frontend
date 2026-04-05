# Tasks: Notebook Shell & Navigation

**Input**: Design documents from `/specs/005-notebook-shell-navigation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Types, API module, and validation schemas needed by multiple stories

- [x] T001 Add `LessonPageWithWarning` interface to `src/lib/types/lessons.ts` and re-export from `src/lib/types/index.ts`
- [x] T002 [P] Create page API module `src/api/pages.ts` with `createPage(lessonId)` and `deletePage(lessonId, pageId)` functions per contracts/api-endpoints.md
- [x] T003 [P] Create Zod schema `src/features/notebooks/schemas/edit-notebook-schema.ts` — title (required, 1-200 chars, trimmed, no whitespace-only) + coverColor (required, 6-digit hex)
- [x] T004 [P] Create Zod schema `src/features/notebooks/schemas/lesson-title-schema.ts` — title (required, 1-200 chars, trimmed, no whitespace-only). Reusable for create and inline edit.
- [x] T004a [P] Create unit tests for Zod schemas: `src/features/notebooks/schemas/edit-notebook-schema.test.ts` and `src/features/notebooks/schemas/lesson-title-schema.test.ts` — valid inputs, empty/whitespace-only rejection, length boundary (200 chars), hex color validation (edit-notebook only). Constitution XII: Zod schemas MUST have tests.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story — layout shell, shared component, query hooks, navigation utility, route wiring

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Create `useNotebook(notebookId)` query hook in `src/features/notebooks/hooks/useNotebook.ts` — query key `["notebooks", notebookId]`, calls `getNotebook`
- [x] T006 [P] Create `useNotebookIndex(notebookId)` query hook in `src/features/notebooks/hooks/useNotebookIndex.ts` — query key `["notebooks", notebookId, "index"]`, calls `getNotebookIndex`
- [x] T007 [P] Create `useLessons(notebookId)` query hook in `src/features/notebooks/hooks/useLessons.ts` — query key `["notebooks", notebookId, "lessons"]`, calls `getLessons`
- [x] T008 [P] Create `useLesson(notebookId, lessonId)` query hook in `src/features/notebooks/hooks/useLesson.ts` — query key `["notebooks", notebookId, "lessons", lessonId]`, calls `getLesson`
- [x] T009 [P] Create page sequence utility `src/features/notebooks/utils/page-sequence.ts` — export `PageSequenceEntry` type and `buildPageSequence(notebookId, index, lessons)` pure function that returns the linear array: cover, index, then all lesson pages. Unit-testable.
- [x] T009a [P] Create unit tests `src/features/notebooks/utils/page-sequence.test.ts` — cases: empty lessons (cover + index only), single lesson with 1 page, single lesson with multiple pages, multiple lessons, cross-lesson boundary prev/next URLs, global page number correctness, cover has no prev, last page has no next. Constitution XII: utility functions MUST have tests.
- [x] T010 [P] Create `usePageNavigation(notebookId)` hook in `src/features/notebooks/hooks/usePageNavigation.ts` — reads current route params, calls `useNotebookIndex` + `useLessons` + `useLesson` for current lesson, uses `buildPageSequence` to compute `prevUrl`, `nextUrl`, `globalPageNumber`, `currentPageType`, `pageNumberInLesson`, `totalPagesInLesson` per contracts/ui-contracts.md
- [x] T011 [P] Create `useKeyboardNavigation(prevUrl, nextUrl)` hook in `src/features/notebooks/hooks/useKeyboardNavigation.ts` — document-level keydown listener for left/right arrows, suppressed when focus is on input/textarea/contenteditable
- [x] T012 [P] Create `DottedPaper` shared component in `src/components/common/DottedPaper.tsx` — accepts `pageSize`, `zoom`, `className`, `children`. Renders CSS radial-gradient background using `--notebook-paper` and `--notebook-dot` variables. Fixed aspect ratio from `PAGE_SIZE_DIMENSIONS`, centered in parent container. Apply `transform: scale(zoom)` with `transform-origin: top center`.
- [x] T013 Create `NotebookToolbar` component in `src/features/notebooks/components/NotebookToolbar.tsx` — slim fixed-top bar with: breadcrumb ("My Notebooks > [Title]" with link to `/app/notebooks`), sidebar toggle (Bookmark icon, toggles `useUIStore.sidebarOpen`), zoom controls placeholder area, page indicator pill (globalPageNumber, or hidden on cover), Style Editor button (enabled, shows "Coming soon" toast), Export button (enabled, shows "Coming soon" toast), Delete notebook button (opens confirmation via existing `DeleteNotebookDialog`). Uses earthy dark theme variables.
- [x] T014 Create `PageNavigationArrows` component in `src/features/notebooks/components/PageNavigationArrows.tsx` — prev/next ChevronLeft/ChevronRight icons at bottom of canvas area. Always visible at subtle low contrast. Disabled (dimmed) when `prevUrl`/`nextUrl` is null. Clicking navigates via React Router `useNavigate`.
- [x] T015 Create `NotebookLayout` route layout in `src/routes/notebook-layout.tsx` — fetches `useNotebook(notebookId)` + `useLessons(notebookId)`, renders loading skeleton on pending, error state with retry + dashboard link on error. Renders `NotebookToolbar`, sidebar Sheet (controlled by `useUIStore.sidebarOpen`, left side, empty content for now), canvas area container with `PageNavigationArrows`, and `<Outlet />` for child routes. Integrates `usePageNavigation` and `useKeyboardNavigation`. Resets zoom to 1.0 and sidebarOpen to false on notebookId change (FR-013: sidebar closed by default on notebook entry).
- [x] T016 Restructure notebook routes in `src/routes/index.tsx` — replace the three placeholder routes (`NotebookView`, `NotebookIndex`, `PageEditor`) with a nested `NotebookLayout` wrapping: index route (`:notebookId` → `CoverPage`), `index` route → `IndexPage`, `lessons/:lessonId/pages/:pageId` → `LessonPage`. Remove placeholders from `src/routes/placeholders.tsx` (keep ExportsPage, ChordsPage).

**Checkpoint**: Notebook shell renders at all three routes with toolbar, nav arrows, keyboard shortcuts, and layout. Child routes are stubs. Sidebar opens/closes but has no content.

---

## Phase 3: User Story 1 — View Notebook Cover Page (Priority: P1)

**Goal**: Users can view a notebook cover with title, instrument, owner name, creation date on a colored background, and edit the notebook's title and cover color.

**Independent Test**: Navigate to `/app/notebooks/:id`, verify cover renders with all metadata. Click "Open Notebook" to navigate to index. Open edit dialog, change title/color, confirm update. Delete notebook via toolbar.

### Implementation for User Story 1

- [x] T017 [P] [US1] Create `useUpdateNotebook(notebookId)` mutation hook in `src/features/notebooks/hooks/useUpdateNotebook.ts` — calls `updateNotebook`, invalidates `["notebooks", notebookId]` and `["notebooks"]` (dashboard list)
- [x] T018 [P] [US1] Create `EditNotebookDialog` component in `src/features/notebooks/components/EditNotebookDialog.tsx` — Dialog with React Hook Form using edit-notebook-schema. Shows title input, CoverColorPicker (reuse existing from Feature 004), instrument and pageSize as read-only with immutability notice. Submit calls `useUpdateNotebook`. Disable button while pending. Toast on error, dialog stays open. Themed earthy.
- [x] T019 [US1] Create `CoverPage` component in `src/features/notebooks/components/CoverPage.tsx` — reads notebookId from route params, uses `useNotebook` for data, `useCurrentUser` for owner display name. Renders notebook coverColor filling the `DottedPaper`-sized canvas area (no dots, just colored background at page aspect ratio). Centers title (large serif/display font), instrument name, owner display name, creation date (Intl.DateTimeFormat). Auto-contrast text color via WCAG luminance. "Open Notebook" button navigates to `/:notebookId/index`. Edit button opens `EditNotebookDialog`.
- [x] T020 [US1] Add i18n keys for cover page and edit dialog to `src/i18n/en.json` and `src/i18n/hu.json` — keys under `notebooks.shell.cover.*` and `notebooks.shell.edit.*`

**Checkpoint**: Cover page fully functional — view metadata, edit title/color, delete notebook, navigate to index.

---

## Phase 4: User Story 2 — Browse Index Page and Navigate Between Pages (Priority: P1)

**Goal**: Users can view the auto-generated table of contents on dotted paper and navigate linearly through all pages using arrows and keyboard shortcuts.

**Independent Test**: Open notebook, verify index page shows TOC with lesson titles and page numbers. Click a TOC entry to navigate. Use prev/next arrows and arrow keys to traverse cover → index → all lesson pages without dead ends. Verify global page numbers are correct.

### Implementation for User Story 2

- [x] T021 [US2] Create `IndexPage` component in `src/features/notebooks/components/IndexPage.tsx` — reads notebookId from route params, uses `useNotebook` + `useNotebookIndex`. Renders `DottedPaper` with "INDEX" heading (serif font). Maps index entries to TOC rows: sequential number, lesson title (truncated with ellipsis), dotted leader line (CSS), right-aligned starting page number. Each entry navigates to that lesson's first page by lazily fetching lesson detail via `useLesson(lessonId)` to resolve the first page ID (per Research R-003 two-tier approach). Empty state: encouraging message with link to open sidebar to add a lesson. Global page number "1" in bottom-right corner.
- [x] T022 [US2] Add i18n keys for index page to `src/i18n/en.json` and `src/i18n/hu.json` — keys under `notebooks.shell.index.*`

**Checkpoint**: Index page renders TOC correctly. Full linear navigation works across cover, index, and lesson pages (lesson pages still stubs but arrows work).

---

## Phase 5: User Story 3 — View Lesson Pages (Priority: P1)

**Goal**: Users can view lesson pages with dotted paper background, lesson title, page indicator, and a placeholder canvas.

**Independent Test**: Navigate to `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`, verify dotted paper renders, lesson title shows at top, page indicator shows correct position (e.g., "Page 2 / 4"), global page number is correct.

### Implementation for User Story 3

- [ ] T023 [US3] Create `LessonPage` component in `src/features/notebooks/components/LessonPage.tsx` — reads notebookId, lessonId, pageId from route params. Uses `useLesson(notebookId, lessonId)` for lesson data. Renders `DottedPaper` with lesson title at top, in-lesson page indicator ("Page X / Y") at top-right, global page number in bottom-right corner. Centered placeholder message for future canvas/module editor. Handles 404 (stale URL) with "Page not found" message and link to index.
- [ ] T024 [US3] Add i18n keys for lesson page to `src/i18n/en.json` and `src/i18n/hu.json` — keys under `notebooks.shell.lesson.*`

**Checkpoint**: All three page types fully render. Complete linear navigation works end-to-end. Core reading experience is functional.

---

## Phase 6: User Story 4 — Manage Lessons via Sidebar (Priority: P2)

**Goal**: Users can open the sidebar to see all lessons, navigate to any lesson, create new lessons, edit lesson titles inline, and delete lessons.

**Independent Test**: Toggle sidebar open, verify lesson list with titles and dates. Click a lesson — navigates to first page, sidebar stays open. Add a new lesson — appears in list, navigates to its first page. Edit a lesson title inline. Delete a lesson with confirmation.

### Implementation for User Story 4

- [ ] T025 [P] [US4] Create `useCreateLesson(notebookId)` mutation hook in `src/features/notebooks/hooks/useCreateLesson.ts` — calls `createLesson`, invalidates `["notebooks", nId, "lessons"]` and `["notebooks", nId, "index"]`
- [ ] T026 [P] [US4] Create `useUpdateLesson(notebookId)` mutation hook in `src/features/notebooks/hooks/useUpdateLesson.ts` — calls `updateLesson`, invalidates `["notebooks", nId, "lessons"]`, `["notebooks", nId, "index"]`, `["notebooks", nId, "lessons", lId]`
- [ ] T027 [P] [US4] Create `useDeleteLesson(notebookId)` mutation hook in `src/features/notebooks/hooks/useDeleteLesson.ts` — calls `deleteLesson`, invalidates `["notebooks", nId, "lessons"]`, `["notebooks", nId, "index"]`, `["notebooks", nId]`
- [ ] T028 [P] [US4] Create `CreateLessonDialog` component in `src/features/notebooks/components/CreateLessonDialog.tsx` — Dialog with title input using lesson-title-schema. Submit calls `useCreateLesson`. On success: close dialog, navigate to new lesson's first page. Disable button while pending. Toast on error, dialog preserved. Themed earthy.
- [ ] T029 [P] [US4] Create `DeleteLessonDialog` component in `src/features/notebooks/components/DeleteLessonDialog.tsx` — AlertDialog with confirmation text: "Delete [title]? This will permanently delete all pages. This action cannot be undone." Confirm calls `useDeleteLesson`. Disable confirm while pending. Toast on error. Themed earthy.
- [ ] T030 [US4] Create `LessonSidebarEntry` component in `src/features/notebooks/components/LessonSidebarEntry.tsx` — displays lesson title (bold, truncated), creation date (muted, Intl.DateTimeFormat). Active lesson highlighted with warm brown background. Pencil icon to enter inline title edit mode (React Hook Form with lesson-title-schema, Enter/blur to save via `useUpdateLesson`, Escape to cancel, revert on error with toast). Trash icon opens `DeleteLessonDialog`. Click row navigates to first page via `useLesson` to get first page ID.
- [ ] T031 [US4] Create `NotebookSidebar` component in `src/features/notebooks/components/NotebookSidebar.tsx` — renders inside the Sheet in NotebookLayout. Shows notebook title, ScrollArea with lesson list (each as `LessonSidebarEntry`), "Add Lesson" button at bottom opening `CreateLessonDialog`. Empty state: "No lessons yet" message with the Add Lesson button. Loading: skeleton entries.
- [ ] T032 [US4] Wire `NotebookSidebar` into the Sheet in `src/routes/notebook-layout.tsx` — replace empty sidebar content with `NotebookSidebar`. Pass lessons data and loading state.
- [ ] T033 [US4] Add i18n keys for sidebar, lesson CRUD dialogs to `src/i18n/en.json` and `src/i18n/hu.json` — keys under `notebooks.shell.sidebar.*`, `notebooks.shell.createLesson.*`, `notebooks.shell.deleteLesson.*`

**Checkpoint**: Sidebar fully functional — view lessons, navigate, create, edit inline, delete. All invalidation working (index TOC updates when lessons change).

---

## Phase 7: User Story 5 — Manage Pages Within a Lesson (Priority: P2)

**Goal**: Users can add and delete pages within a lesson. 10+ page warning displayed as toast. Last page deletion prevented with error. After deletion, navigate to previous page.

**Independent Test**: Navigate to a lesson page. Click "Add Page" — new page appears, count updates. Add pages until 10+ and verify toast warning. Try deleting the only page — verify error. Delete a non-last page — verify confirmation dialog, removal, navigation to previous page.

### Implementation for User Story 5

- [ ] T034 [P] [US5] Create `useCreatePage(notebookId, lessonId)` mutation hook in `src/features/notebooks/hooks/useCreatePage.ts` — calls `createPage`, invalidates `["notebooks", nId, "lessons", lId]`, `["notebooks", nId, "lessons", lId, "pages"]`, `["notebooks", nId, "index"]`. On success: if response has `warning`, show toast. Navigate to new page.
- [ ] T035 [P] [US5] Create `useDeletePage(notebookId, lessonId)` mutation hook in `src/features/notebooks/hooks/useDeletePage.ts` — calls `deletePage`, invalidates same keys. Handles 422 LAST_PAGE_DELETION error: show toast "Cannot delete the last page in a lesson." On success: navigate to previous page (or next if deleting page 1).
- [ ] T036 [US5] Create `DeletePageButton` component in `src/features/notebooks/components/DeletePageButton.tsx` — if `isLastPage`, clicking shows error toast immediately (no dialog). Otherwise, opens AlertDialog: "Delete this page? This action cannot be undone." Confirm calls `useDeletePage`. Disable while pending.
- [ ] T037 [US5] Add "Add Page" button to `NotebookToolbar` in `src/features/notebooks/components/NotebookToolbar.tsx` — visible only on lesson pages. Calls `useCreatePage`. Disable while pending.
- [ ] T038 [US5] Add floating "Add Page" button to `LessonPage` in `src/features/notebooks/components/LessonPage.tsx` — small button near the page indicator. Same mutation as toolbar button.
- [ ] T039 [US5] Add `DeletePageButton` to `LessonPage` in `src/features/notebooks/components/LessonPage.tsx` — positioned near the page indicator area. Passes `isLastPage` computed from lesson pages array.
- [ ] T040 [US5] Add i18n keys for page management to `src/i18n/en.json` and `src/i18n/hu.json` — keys under `notebooks.shell.page.*`

**Checkpoint**: Full page CRUD works — add pages (with 10+ warning), delete pages (with confirmation, last-page prevention, correct navigation after deletion).

---

## Phase 8: User Story 6 — Zoom Controls (Priority: P3)

**Goal**: Users can zoom in, zoom out, and reset the canvas zoom level. Zoom affects only the canvas area.

**Independent Test**: Click zoom in/out buttons, verify canvas scales while toolbar and sidebar remain normal. Click reset, verify canvas returns to 100%. Verify zoom percentage displays in toolbar.

### Implementation for User Story 6

- [ ] T041 [US6] Add zoom controls to `NotebookToolbar` in `src/features/notebooks/components/NotebookToolbar.tsx` — ZoomIn, ZoomOut, RotateCcw (reset) Lucide icons. Zoom in: `setZoom(zoom + 0.1)`. Zoom out: `setZoom(zoom - 0.1)`. Reset: `setZoom(1)`. Display current zoom percentage between buttons. Uses existing `useUIStore.zoom` and `useUIStore.setZoom` (already clamps 0.25–3.0).
- [ ] T042 [US6] Wire zoom level into `DottedPaper` rendering in `src/routes/notebook-layout.tsx` — pass `useUIStore.zoom` to the canvas container's transform. Ensure `DottedPaper` in child routes receives current zoom for dot spacing calculation.
- [ ] T043 [US6] Add i18n keys for zoom controls to `src/i18n/en.json` and `src/i18n/hu.json` — keys under `notebooks.shell.zoom.*`

**Checkpoint**: Zoom fully functional — in/out/reset, percentage display, only canvas scales.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T044 [P] Review and complete Hungarian translations in `src/i18n/hu.json` for all `notebooks.shell.*` keys added in phases 3–8
- [ ] T045 [P] Add aria-labels to all interactive elements: navigation arrows ("Previous page"/"Next page"), sidebar toggle ("Toggle lesson sidebar"), zoom buttons, page indicators (aria-live="polite")
- [ ] T046 Verify all dialogs (EditNotebook, CreateLesson, DeleteLesson, DeletePage, DeleteNotebook) have consistent earthy theming — no default cold gray. Confirm button disabled states and toast error patterns are uniform.
- [ ] T047 Verify page sequence navigation end-to-end: cover → index → all lesson pages → last page (next disabled). Verify global page numbers are correct. Verify cross-lesson boundary navigation works.
- [ ] T048 Run `pnpm run lint` and `pnpm test` — fix any TypeScript, ESLint, or test failures introduced by new code.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion — BLOCKS all user stories
- **User Stories (Phases 3–8)**: All depend on Foundational phase completion
  - US1 (Phase 3), US2 (Phase 4), US3 (Phase 5) are all P1 — implement sequentially in order
  - US4 (Phase 6) and US5 (Phase 7) are P2 — can start after foundational, but benefit from US1-US3 being complete
  - US6 (Phase 8) is P3 — can start after foundational
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only. No other story dependencies.
- **US2 (P1)**: Depends on Foundational only. Benefits from US1 (cover page exists for "Previous" from index).
- **US3 (P1)**: Depends on Foundational only. Benefits from US2 (navigation arrows work to reach lesson pages).
- **US4 (P2)**: Depends on Foundational only. Benefits from US3 (lesson pages exist to navigate to).
- **US5 (P2)**: Depends on Foundational + US3 (LessonPage component exists to add buttons to).
- **US6 (P3)**: Depends on Foundational only. Benefits from US1-US3 (pages exist to zoom).

### Within Each User Story

- Mutation hooks (marked [P]) can be created in parallel
- Dialog components (marked [P]) can be created in parallel with hooks
- Page/container components depend on hooks being ready
- i18n keys can be added in parallel with any other task in the story

### Parallel Opportunities

Within Phase 1: T002, T003, T004 can all run in parallel.
Within Phase 2: T005–T012 (hooks, utility, DottedPaper) can all run in parallel. T013–T015 (toolbar, arrows, layout) depend on hooks. T016 (route restructuring) depends on T015.
Within US4: T025–T029 (hooks + dialogs) all run in parallel. T030 depends on hooks. T031 depends on T030.
Within US5: T034–T035 (hooks) run in parallel. T036–T039 depend on hooks.

---

## Parallel Example: User Story 4

```
# Launch all mutation hooks in parallel:
Task T025: "Create useCreateLesson hook in src/features/notebooks/hooks/useCreateLesson.ts"
Task T026: "Create useUpdateLesson hook in src/features/notebooks/hooks/useUpdateLesson.ts"
Task T027: "Create useDeleteLesson hook in src/features/notebooks/hooks/useDeleteLesson.ts"

# Launch dialogs in parallel (after hooks):
Task T028: "Create CreateLessonDialog in src/features/notebooks/components/CreateLessonDialog.tsx"
Task T029: "Create DeleteLessonDialog in src/features/notebooks/components/DeleteLessonDialog.tsx"

# Then sequential:
Task T030: "Create LessonSidebarEntry" (needs hooks + dialogs)
Task T031: "Create NotebookSidebar" (needs T030)
Task T032: "Wire into NotebookLayout" (needs T031)
```

---

## Implementation Strategy

### MVP First (User Stories 1–3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Cover Page
4. Complete Phase 4: User Story 2 — Index Page + Navigation
5. Complete Phase 5: User Story 3 — Lesson Pages
6. **STOP and VALIDATE**: Full reading experience works — cover, index, lesson pages, linear navigation, keyboard shortcuts.

### Incremental Delivery

1. Setup + Foundational → Shell renders with toolbar, arrows, routes
2. Add US1 → Cover page functional → Demo
3. Add US2 → Index page + full navigation → Demo
4. Add US3 → Lesson pages render → Demo (MVP complete!)
5. Add US4 → Sidebar with lesson CRUD → Demo
6. Add US5 → Page add/delete → Demo
7. Add US6 → Zoom controls → Demo
8. Polish → Translations, accessibility, verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable after foundational phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing components reused: CoverColorPicker, DeleteNotebookDialog (from Feature 004)
- Existing store state reused: useUIStore.sidebarOpen, useUIStore.zoom (already in place)
- Desktop-only scope — no mobile responsive layout work needed
