# Tasks: Notebook Dashboard

**Input**: Design documents from `/specs/004-notebook-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Constitution XII mandates tests for Zod schemas (100% branch), API function modules (MSW), and critical user flows (notebook CRUD). Test tasks are included in their respective phases.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Types, constants, API updates, and i18n scaffolding needed before any component work

- [x] T001 [P] Add `CreateNotebookRequest` and `CreateNotebookStyleInput` types to `src/lib/types/notebooks.ts` — `CreateNotebookRequest` has title, instrumentId, pageSize, coverColor, and optional styles array; `CreateNotebookStyleInput` is `Omit<NotebookModuleStyle, 'id' | 'notebookId'>`; export both from `src/lib/types/index.ts`
- [x] T002 [P] Create `COVER_COLORS` constant and `DEFAULT_COVER_COLOR` in `src/lib/constants/notebook-colors.ts` — array of `{ hex: string; labelKey: string }` with 8 earthy book-cover colors (Leather Brown #8B4513 as default, Dark Navy #1B2A4A, Forest Green #2D5016, Burgundy #722F37, Charcoal #36454F, Slate Blue #4A6274, Deep Teal #1A5653, Warm Terracotta #C75B39); export from `src/lib/constants/index.ts`
- [x] T003 [P] Update `createNotebook()` in `src/api/notebooks.ts` — change the `data` parameter type from inline object to `CreateNotebookRequest` (imported from types); this adds the optional `styles` field to the POST body
- [x] T003b Move `useInstruments` from `src/features/profile/hooks/useInstruments.ts` to `src/hooks/useInstruments.ts` — add optional `options?: { enabled?: boolean }` parameter (default `enabled: true`) passed through to `useQuery`; update the import in `src/features/profile/components/PreferencesSection.tsx` (and any other profile consumers) to `import { useInstruments } from '@/hooks/useInstruments'`; delete the old file. This makes it a shared hook per constitution Principle I, and enables lazy fetching via `useInstruments({ enabled: isDialogOpen })` in the notebook wizard
- [x] T004 Add `notebooks.*` i18n keys to `src/i18n/en.json` and `src/i18n/hu.json` — scaffold keys for: `notebooks.dashboard.title`, `notebooks.dashboard.sortLastUpdated`, `notebooks.dashboard.sortCreatedDate`, `notebooks.dashboard.sortTitle`, `notebooks.dashboard.createButton`, `notebooks.dashboard.emptyTitle`, `notebooks.dashboard.emptyMessage`, `notebooks.dashboard.emptyAction`, `notebooks.dashboard.addCard` ("New notebook"), `notebooks.card.lessons` (with ICU pluralization: `{count, plural, one {# lesson} other {# lessons}}`), `notebooks.card.updated`, `notebooks.create.title`, `notebooks.create.stepBasics`, `notebooks.create.stepAppearance`, `notebooks.create.titleLabel`, `notebooks.create.titleRequired`, `notebooks.create.titleMaxLength`, `notebooks.create.instrumentLabel`, `notebooks.create.instrumentRequired`, `notebooks.create.pageSizeLabel`, `notebooks.create.pageSizeRequired`, `notebooks.create.immutabilityWarning` ("These cannot be changed later"), `notebooks.create.coverColorLabel`, `notebooks.create.customHex`, `notebooks.create.invalidHex`, `notebooks.create.presetLabel`, `notebooks.create.presetNone`, `notebooks.create.next`, `notebooks.create.back`, `notebooks.create.submit`, `notebooks.create.submitting`, `notebooks.create.error`, `notebooks.delete.title` ("Delete {title}?"), `notebooks.delete.message` ("This will permanently delete all lessons and content. This action cannot be undone."), `notebooks.delete.confirm`, `notebooks.delete.error`, `notebooks.colors.leatherBrown`, `notebooks.colors.darkNavy`, `notebooks.colors.forestGreen`, `notebooks.colors.burgundy`, `notebooks.colors.charcoal`, `notebooks.colors.slateBlue`, `notebooks.colors.deepTeal`, `notebooks.colors.warmTerracotta`; Hungarian translations in hu.json with correct pluralization (`{count, plural, one {# lecke} other {# lecke}}`)

---

## Phase 2: Foundational

**Purpose**: Shared hooks and schemas that MUST be complete before user story components can be built

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Create `useNotebooks` hook in `src/features/notebooks/hooks/useNotebooks.ts` — wrap `useQuery` with key `["notebooks"]`, fetcher `getNotebooks()` from `src/api/notebooks.ts`, `staleTime: 0` (refetch on window focus per constitution XI); return the query result
- [x] T006 [P] Create Zod schema in `src/features/notebooks/schemas/create-notebook-schema.ts` — fields: `title` (string, min 1, max 200, trimmed, refine to reject whitespace-only), `instrumentId` (string, min 1), `pageSize` (z.enum for A4/A5/A6/B5/B6), `coverColor` (string, regex for valid 6-digit hex with or without #, transform to always include `#` prefix for API consistency); export schema and inferred type

- [x] T006b [P] Write unit tests for Zod schema in `src/features/notebooks/schemas/create-notebook-schema.test.ts` — 100% branch coverage per constitution XII; test cases: valid input passes, empty title rejected, whitespace-only title rejected, title exceeding 200 chars rejected, missing instrumentId rejected, invalid pageSize rejected, valid 6-digit hex with `#` accepted, valid 6-digit hex without `#` accepted, 3-digit hex shorthand rejected, non-hex string rejected, empty coverColor rejected

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — View Notebook Collection (Priority: P1) 🎯 MVP

**Goal**: Users see their notebook collection as visual cards in a responsive grid, with sorting, loading skeletons, and an empty state

**Independent Test**: Navigate to `/app/notebooks` with notebook data → see card grid; with no notebooks → see empty state; change sort → cards reorder; during loading → see skeletons

### Implementation for User Story 1

- [x] T007 [P] [US1] Create `NotebookCard` component in `src/features/notebooks/components/NotebookCard.tsx` — presentational; receives `NotebookSummary` + `onDelete` callback as props; renders card with: coverColor top stripe (~35-40% height) via inline background-color, warm white body with title (2-line truncation with ellipsis), instrument name (Music icon from Lucide + name, truncated), page size Badge, lesson count with ICU-pluralized label, locale-formatted date via `Intl.DateTimeFormat`; three-dot DropdownMenu (MoreVertical icon) in top-right of body area with "Delete" item (Trash2 icon); card is clickable via `useNavigate` to `/app/notebooks/${notebook.id}`; menu click uses `e.stopPropagation()` to prevent navigation; hover: `transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg` with `@media (prefers-reduced-motion: reduce)` disabling transforms; all text via `useTranslation` with `notebooks` namespace
- [x] T008 [P] [US1] Create `NotebookCardSkeleton` component in `src/features/notebooks/components/NotebookCardSkeleton.tsx` — matches NotebookCard layout using shadcn `Skeleton` component: colored stripe placeholder at top, text line placeholders for title, instrument, page size, lesson count, date; same card dimensions as NotebookCard
- [x] T009 [P] [US1] Create `EmptyState` component in `src/features/notebooks/components/EmptyState.tsx` — centered layout with BookOpen Lucide icon (large, muted earthy tone), localized heading "No notebooks yet", localized subtext "Create your first notebook!", and a primary Button calling `onCreate` prop; warm inviting styling per Zone 1 design system; no emojis
- [x] T010 [P] [US1] Create `SortControl` component in `src/features/notebooks/components/SortControl.tsx` — presentational; shadcn Select dropdown with three options: "Last updated" (value: `updatedAt`), "Created date" (value: `createdAt`), "Title (A–Z)" (value: `title`); receives `value` and `onChange` props; subtle styling (not visually dominant); all labels localized
- [x] T011 [US1] Create `NotebooksDashboardPage` container in `src/features/notebooks/components/NotebooksDashboardPage.tsx` — uses `useNotebooks()` hook; local `useState` for sort (default `updatedAt`, resets on mount); `useMemo` to sort notebook data client-side (updatedAt desc, createdAt desc, title asc); renders page header with localized title + SortControl + "Create Notebook" Button (Plus icon); loading state → 6 × NotebookCardSkeleton in CSS Grid; error state → error message + retry button; empty state → EmptyState component; populated state → responsive CSS Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`) with NotebookCard per notebook + dashed-border add card as last grid item (Plus icon + localized "New notebook" text, onClick opens create dialog); uses `useLocation()` to detect `/app/notebooks/new` and auto-open create dialog (create dialog integration completed in Phase 4); cream page background per Zone 1
- [x] T012 [US1] Update routing in `src/routes/index.tsx` — replace `NotebooksDashboard` and `NewNotebook` placeholder imports with real `NotebooksDashboardPage` from `src/features/notebooks/components/NotebooksDashboardPage`; both `/app/notebooks` and `/app/notebooks/new` routes render `NotebooksDashboardPage`; remove `NotebooksDashboard` and `NewNotebook` exports from `src/routes/placeholders.tsx`

- [x] T012b [US1] Write hook test for `useNotebooks` in `src/features/notebooks/hooks/useNotebooks.test.ts` — MSW handler for GET /notebooks returning mock `NotebookSummary[]`; test: returns data on success, handles error state, uses query key `["notebooks"]` with `staleTime: 0`

**Checkpoint**: At this point, the dashboard displays notebooks as cards with sorting, loading, and empty state. Cards navigate to `/app/notebooks/:id`. Create and delete not yet wired.

---

## Phase 4: User Story 2 — Create a New Notebook (Priority: P1)

**Goal**: Users create notebooks via a two-step wizard dialog with title, instrument, page size, cover color, and optional style preset

**Independent Test**: Click "Create Notebook" → wizard opens at Step 1; fill all fields → proceed to Step 2 → pick color/preset → submit → notebook created and redirect to `/app/notebooks/:id`; validate empty title, missing instrument, missing page size show errors; navigate to `/app/notebooks/new` → wizard auto-opens

### Implementation for User Story 2

- [ ] T013 [P] [US2] Create `PageSizeSelector` component in `src/features/notebooks/components/PageSizeSelector.tsx` — presentational; renders A4/A5/A6/B5/B6 as clickable cards with: scaled rectangle at correct aspect ratio (use `PAGE_SIZE_DIMENSIONS` from `src/lib/constants/grid.ts` for width:height ratio, render as a small div with calculated `aspect-ratio` CSS), size label (e.g., "A4"), grid dimension subtitle (e.g., "42 × 59 grid"); selected state: ring-2 primary border + background highlight; radio-group semantics with `role="radiogroup"` and `role="radio"` + `aria-checked`; receives `value` and `onChange` props typed as `PageSize`
- [ ] T014 [P] [US2] Create `CoverColorPicker` component in `src/features/notebooks/components/CoverColorPicker.tsx` — presentational; shadcn Popover triggered by a button showing the current color swatch (40px circle with selected hex); popover content: grid of 8 color swatches from `COVER_COLORS` constant (each a clickable circle with `aria-label` of localized color name, selected state: ring-2 + check icon), plus a text input for custom hex (validated: 6-digit hex with or without #, inline error below on invalid); receives `value` and `onChange` props (string hex)
- [ ] T015 [P] [US2] Create `PresetThumbnail` component in `src/features/notebooks/components/PresetThumbnail.tsx` — presentational; receives `SystemStylePreset` and `selected` boolean; renders a small 3×4 grid of colored rectangles (each rectangle's background from the style's `backgroundColor`, with a small top accent bar from `headerBgColor`); preset name below the grid; selected state: ring-2 primary border; clickable with `role="radio"` and `aria-checked`
- [ ] T016 [P] [US2] Create `PresetSelector` component in `src/features/notebooks/components/PresetSelector.tsx` — presentational; receives `presets: SystemStylePreset[]`, `selectedId: string | null`, `onChange`; filters to first 5 by `displayOrder`, renders PresetThumbnail for each + a "None" option; `role="radiogroup"` wrapper; loading state: 5 small Skeleton rectangles; error state: fallback text message
- [ ] T017 [P] [US2] Create `useSystemPresets` hook in `src/features/notebooks/hooks/useSystemPresets.ts` — wrap `useQuery` with key `["presets"]`, fetcher `getSystemPresets()` from `src/api/presets.ts`, `staleTime: 300_000` (5 min, public data); accepts `enabled` boolean option (false by default, true when dialog opens)
- [ ] T018 [P] [US2] Create `useCreateNotebook` mutation hook in `src/features/notebooks/hooks/useCreateNotebook.ts` — wrap `useMutation` with `mutationFn: createNotebook()` from `src/api/notebooks.ts`; `onSuccess`: invalidate `["notebooks"]` query, navigate to `/app/notebooks/${data.id}` using the returned `NotebookDetail.id`; no optimistic update (redirect on success)
- [ ] T019 [US2] Create `StepBasics` component in `src/features/notebooks/components/StepBasics.tsx` — receives React Hook Form control/register + useInstruments data + useCurrentUser data; renders: title Input (register with schema validation, max 200 chars), instrument Select dropdown (populated from instruments, pre-filled from `user.defaultInstrumentId` if instrument exists in list, error state with retry if instruments query failed), PageSizeSelector (pre-filled from `user.defaultPageSize`), AlertTriangle icon + localized immutability warning "These cannot be changed later"; "Next" button disabled until all three required fields valid and instruments loaded
- [ ] T020 [US2] Create `StepAppearance` component in `src/features/notebooks/components/StepAppearance.tsx` — receives React Hook Form control + useSystemPresets data + selected preset state; renders: CoverColorPicker (default leather brown #8B4513), PresetSelector (with presets data, loading/error states handled); "Back" button (calls onBack prop) and "Create" submit button; submit button disabled + shows spinner while mutation is pending
- [ ] T021 [US2] Create `CreateNotebookDialog` container in `src/features/notebooks/components/CreateNotebookDialog.tsx` — shadcn Dialog; manages step state (1 or 2); initializes React Hook Form with Zod schema resolver from `create-notebook-schema.ts`; default values: coverColor from `DEFAULT_COVER_COLOR`, instrumentId and pageSize from `useCurrentUser()` cache if available; calls `useInstruments({ enabled: open })` and `useSystemPresets({ enabled: open })` for lazy fetching; step 1 → StepBasics; step 2 → StepAppearance; on back: set step to 1 (form data preserved); on close: form resets (React Hook Form `reset()` in Dialog `onOpenChange` when closing); on submit: build `CreateNotebookRequest` — if a preset is selected, map its styles stripping `id` and `notebookId`; if no preset selected, find the `isDefault: true` preset's styles (fallback: omit styles); call `useCreateNotebook` mutation; on error: show error toast, keep dialog open; receives `open` and `onOpenChange` props
- [ ] T022 [US2] Integrate `CreateNotebookDialog` into `NotebooksDashboardPage` in `src/features/notebooks/components/NotebooksDashboardPage.tsx` — add `useState` for dialog open state; "Create Notebook" header button and dashed-border add card both set dialog open to true; detect `/app/notebooks/new` via `useLocation()` and set dialog open on mount; on dialog close, navigate to `/app/notebooks` if currently on `/new`; render `CreateNotebookDialog` with open/onOpenChange props

- [ ] T022b [P] [US2] Write hook tests for `useCreateNotebook` in `src/features/notebooks/hooks/useCreateNotebook.test.ts` and `useSystemPresets` in `src/features/notebooks/hooks/useSystemPresets.test.ts` — MSW handlers for POST /notebooks (success 201, error 400) and GET /presets/system; test: useCreateNotebook invalidates `["notebooks"]` on success; useSystemPresets respects `enabled` flag and uses staleTime 300_000

**Checkpoint**: At this point, users can view notebooks AND create new ones. The full creation wizard with validation, pre-filling, color picker, preset selector, and redirect works end-to-end.

---

## Phase 5: User Story 3 — Delete a Notebook (Priority: P2)

**Goal**: Users delete notebooks via three-dot menu with confirmation dialog and optimistic removal

**Independent Test**: Click three-dot menu → select "Delete" → confirmation dialog with notebook title → confirm → card removed immediately; cancel → dialog closes, card stays; simulate server error → card reappears with error toast

### Implementation for User Story 3

- [ ] T023 [US3] Create `useDeleteNotebook` mutation hook in `src/features/notebooks/hooks/useDeleteNotebook.ts` — wrap `useMutation` with `mutationFn: deleteNotebook()` from `src/api/notebooks.ts`; optimistic update pattern per constitution: `onMutate`: cancel refetches for `["notebooks"]`, snapshot `queryClient.getQueryData<NotebookSummary[]>(["notebooks"])`, set cache to filtered list without deleted notebook, return `{ previousNotebooks }` context; `onError`: restore cache from `context.previousNotebooks`, show error toast via sonner; `onSettled`: invalidate `["notebooks"]`
- [ ] T024 [US3] Create `DeleteNotebookDialog` component in `src/features/notebooks/components/DeleteNotebookDialog.tsx` — shadcn AlertDialog; receives `notebook: NotebookSummary | null`, `open`, `onOpenChange` props; displays localized title "Delete {notebook.title}?" and message "This will permanently delete all lessons and content. This action cannot be undone."; Cancel button + destructive Confirm button; confirm calls `useDeleteNotebook` mutation then closes dialog; both buttons disabled while mutation is pending
- [ ] T025 [US3] Integrate `DeleteNotebookDialog` into `NotebooksDashboardPage` in `src/features/notebooks/components/NotebooksDashboardPage.tsx` — add `useState` for `notebookToDelete: NotebookSummary | null`; pass `onDelete` callback to each `NotebookCard` that sets `notebookToDelete`; render `DeleteNotebookDialog` with `open={notebookToDelete !== null}` and `onOpenChange` that clears `notebookToDelete` on close

- [ ] T025b [US3] Write hook test for `useDeleteNotebook` in `src/features/notebooks/hooks/useDeleteNotebook.test.ts` — MSW handler for DELETE /notebooks/{id} (success 204, error 404); test: optimistic removal from `["notebooks"]` cache on mutate, rollback on error, invalidation on settled

**Checkpoint**: All user stories are now independently functional. Full CRUD (view, create, delete) works on the dashboard.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, i18n completeness, and final quality pass

- [ ] T026 [P] Verify all `notebooks.*` i18n keys are present and correct in both `src/i18n/en.json` and `src/i18n/hu.json` — check ICU pluralization for lesson count in Hungarian, verify date formatting uses `Intl.DateTimeFormat` with user locale everywhere, ensure no hardcoded user-facing strings remain in any component
- [ ] T027 [P] Accessibility pass across all new components — verify: all color swatches in CoverColorPicker have `aria-label` with localized color name; PageSizeSelector and PresetSelector use `role="radiogroup"`/`role="radio"` with `aria-checked`; Dialog/AlertDialog focus trap works (shadcn built-in); DropdownMenu keyboard navigation works (shadcn built-in); all interactive elements meet 44px minimum touch target on mobile; `prefers-reduced-motion` disables hover translate/scale on NotebookCard
- [ ] T028 [P] Run `pnpm run lint` and fix any linting errors across all new files in `src/features/notebooks/`, `src/lib/constants/notebook-colors.ts`, and `src/lib/types/notebooks.ts`
- [ ] T029 Final review — verify: NotebooksDashboardPage renders correctly for all states (loading, empty, populated, error); create wizard works end-to-end with validation; delete works with optimistic update and rollback; sort resets on page visit; responsive grid works at all breakpoints; all acceptance scenarios from spec.md are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T004) completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (T005-T006) — this is the MVP
- **US2 (Phase 4)**: Depends on US1 (Phase 3) — wizard lives inside the dashboard page
- **US3 (Phase 5)**: Depends on US1 (Phase 3) — delete triggers from card on the dashboard
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories — **this is the MVP**
- **User Story 2 (P1)**: Depends on US1 dashboard page existing (wizard integrates into it)
- **User Story 3 (P2)**: Depends on US1 card component existing (delete triggers from card menu); can run in parallel with US2

### Within Each User Story

- Presentational components (marked [P]) before container components
- Hooks before containers that use them
- Integration tasks last (wire into dashboard page)

### Parallel Opportunities

- **Phase 1**: T001 + T002 + T003 can all run in parallel (different files)
- **Phase 3 (US1)**: T007 + T008 + T009 + T010 can all run in parallel (independent presentational components)
- **Phase 4 (US2)**: T013 + T014 + T015 + T016 + T017 + T018 can all run in parallel (independent components and hooks)
- **Phase 4→5**: US2 (T022) and US3 (T023-T025) can run in parallel after US1 is complete
- **Phase 6**: T026 + T027 + T028 can all run in parallel

---

## Parallel Example: User Story 1

```
# Launch all presentational components for US1 together:
Task: "T007 - Create NotebookCard in src/features/notebooks/components/NotebookCard.tsx"
Task: "T008 - Create NotebookCardSkeleton in src/features/notebooks/components/NotebookCardSkeleton.tsx"
Task: "T009 - Create EmptyState in src/features/notebooks/components/EmptyState.tsx"
Task: "T010 - Create SortControl in src/features/notebooks/components/SortControl.tsx"

# Then sequentially:
Task: "T011 - Create NotebooksDashboardPage (composes all above)"
Task: "T012 - Update routing to use real dashboard"
```

## Parallel Example: User Story 2

```
# Launch all presentational components + hooks for US2 together:
Task: "T013 - PageSizeSelector"
Task: "T014 - CoverColorPicker"
Task: "T015 - PresetThumbnail"
Task: "T016 - PresetSelector"
Task: "T017 - useSystemPresets hook"
Task: "T018 - useCreateNotebook hook"

# Then sequentially (depend on above):
Task: "T019 - StepBasics (uses PageSizeSelector, useInstruments)"
Task: "T020 - StepAppearance (uses CoverColorPicker, PresetSelector)"
Task: "T021 - CreateNotebookDialog (orchestrates steps)"
Task: "T022 - Integrate into NotebooksDashboardPage"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T006)
3. Complete Phase 3: User Story 1 (T007-T012)
4. **STOP and VALIDATE**: Dashboard shows notebooks, sorting works, loading/empty states work, cards navigate to detail page
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **MVP!** (Dashboard with view + sort)
3. Add User Story 2 → Test independently → **Create flow** (Dashboard + wizard)
4. Add User Story 3 → Test independently → **Full CRUD** (Dashboard + create + delete)
5. Polish pass → Accessibility, i18n verification, lint
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Phase 3 (US1) is complete:

1. Team completes Setup + Foundational + US1 together
2. Once US1 is done:
   - Developer A: User Story 2 (creation wizard)
   - Developer B: User Story 3 (deletion flow)
3. Both stories integrate into the dashboard independently

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing code reused: `useInstruments` (moved to `src/hooks/` in T003b), `useCurrentUser` from profile, all shadcn/ui components, all API functions in `src/api/notebooks.ts`, all types in `src/lib/types/`
- The `useInstruments` hook is moved from `src/features/profile/hooks/useInstruments.ts` to `src/hooks/useInstruments.ts` (T003b) to comply with constitution Principle I — shared hooks must live in `src/hooks/`, not in feature folders
