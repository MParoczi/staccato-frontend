# Phase 4: User Story 2 — Create a New Notebook — GitHub Issues

> Users create notebooks via a two-step wizard dialog with title, instrument, page size, cover color, and optional style preset.
>
> **Independent test:** Click "Create Notebook" → wizard Step 1 → fill fields → Step 2 → pick color/preset → submit → redirect to `/app/notebooks/:id`. Validate empty title, missing instrument, missing page size show errors. Navigate to `/app/notebooks/new` → wizard auto-opens.

---

## Issue: T013 — Create `PageSizeSelector` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create a presentational `PageSizeSelector` in `src/features/notebooks/components/PageSizeSelector.tsx`.

- Renders A4 / A5 / A6 / B5 / B6 as clickable cards with:
  - Scaled rectangle at correct aspect ratio (use `PAGE_SIZE_DIMENSIONS` from `src/lib/constants/grid.ts` for width:height ratio, render as div with `aspect-ratio` CSS)
  - Size label (e.g., "A4")
  - Grid dimension subtitle (e.g., "42 × 59 grid")
- Selected state: `ring-2` primary border + background highlight
- Radio-group semantics: `role="radiogroup"` wrapper, `role="radio"` + `aria-checked` on each card
- Receives `value` and `onChange` props typed as `PageSize`

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/PageSizeSelector.tsx`
- [ ] All 5 page sizes rendered with correct aspect ratios
- [ ] Accessible radio-group semantics
- [ ] Controlled via `value` / `onChange`

### Dependencies

- Phase 3 complete (US1)

### Parallel

Yes — independent of T014, T015, T016, T017, T018.

---

## Issue: T014 — Create `CoverColorPicker` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create a presentational `CoverColorPicker` in `src/features/notebooks/components/CoverColorPicker.tsx`.

- shadcn `Popover` triggered by a button showing current color swatch (40px circle with selected hex)
- Popover content:
  - Grid of 8 color swatches from `COVER_COLORS` constant (clickable circles, `aria-label` with localized color name, selected: `ring-2` + check icon)
  - Text input for custom hex (validated: 6-digit hex with or without `#`, inline error on invalid)
- Receives `value` and `onChange` props (string hex)

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/CoverColorPicker.tsx`
- [ ] 8 preset swatches render from `COVER_COLORS`
- [ ] Custom hex input validates and shows inline error
- [ ] Each swatch has `aria-label` with localized color name
- [ ] Controlled via `value` / `onChange`

### Dependencies

- Phase 3 complete (US1)

### Parallel

Yes — independent of T013, T015, T016, T017, T018.

---

## Issue: T015 — Create `PresetThumbnail` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create a presentational `PresetThumbnail` in `src/features/notebooks/components/PresetThumbnail.tsx`.

- Receives `SystemStylePreset` and `selected` boolean
- Renders a small 3×4 grid of colored rectangles (each rectangle's background from the style's `backgroundColor`, with a small top accent bar from `headerBgColor`)
- Preset name below the grid
- Selected state: `ring-2` primary border
- Clickable with `role="radio"` and `aria-checked`

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/PresetThumbnail.tsx`
- [ ] Mini grid preview renders style colors
- [ ] Selected state visually distinct
- [ ] Accessible radio semantics

### Dependencies

- Phase 3 complete (US1)

### Parallel

Yes — independent of T013, T014, T016, T017, T018.

---

## Issue: T016 — Create `PresetSelector` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create a presentational `PresetSelector` in `src/features/notebooks/components/PresetSelector.tsx`.

- Receives `presets: SystemStylePreset[]`, `selectedId: string | null`, `onChange`
- Filters to first 5 by `displayOrder`
- Renders `PresetThumbnail` for each + a "None" option
- `role="radiogroup"` wrapper
- Loading state: 5 small `Skeleton` rectangles
- Error state: fallback text message

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/PresetSelector.tsx`
- [ ] Renders up to 5 presets + "None" option
- [ ] Loading and error states handled
- [ ] Accessible radiogroup semantics

### Dependencies

- T015 (PresetThumbnail)

### Parallel

Yes — can be built in parallel if T015 interface is known. Otherwise sequential after T015.

---

## Issue: T017 — Create `useSystemPresets` hook

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create the `useSystemPresets` hook in `src/features/notebooks/hooks/useSystemPresets.ts`.

- Wrap `useQuery` with key `["presets"]`
- Fetcher: `getSystemPresets()` from `src/api/presets.ts`
- `staleTime: 300_000` (5 min — public data)
- Accepts `enabled` boolean option (false by default, true when dialog opens)

### Acceptance Criteria

- [ ] Hook at `src/features/notebooks/hooks/useSystemPresets.ts`
- [ ] Query key `["presets"]`, staleTime 5 min
- [ ] `enabled` option controls whether the query fires
- [ ] Returns full query result

### Dependencies

- Phase 3 complete (US1)

### Parallel

Yes — independent of T013–T016, T018.

---

## Issue: T018 — Create `useCreateNotebook` mutation hook

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create the `useCreateNotebook` mutation hook in `src/features/notebooks/hooks/useCreateNotebook.ts`.

- Wrap `useMutation` with `mutationFn: createNotebook()` from `src/api/notebooks.ts`
- `onSuccess`: invalidate `["notebooks"]` query, navigate to `/app/notebooks/${data.id}` using the returned `NotebookDetail.id`
- No optimistic update (redirect on success)

### Acceptance Criteria

- [ ] Hook at `src/features/notebooks/hooks/useCreateNotebook.ts`
- [ ] Invalidates `["notebooks"]` on success
- [ ] Navigates to new notebook detail page on success
- [ ] Returns mutation result (mutate, isPending, isError, etc.)

### Dependencies

- Phase 3 complete (US1)

### Parallel

Yes — independent of T013–T017.

---

## Issue: T019 — Create `StepBasics` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create `StepBasics` in `src/features/notebooks/components/StepBasics.tsx`.

- Receives React Hook Form control/register + `useInstruments` data + `useCurrentUser` data
- Renders:
  - Title `Input` (register with schema validation, max 200 chars)
  - Instrument `Select` dropdown (populated from instruments, pre-filled from `user.defaultInstrumentId` if instrument exists in list, error state with retry if instruments query failed)
  - `PageSizeSelector` (pre-filled from `user.defaultPageSize`)
  - AlertTriangle icon + localized immutability warning "These cannot be changed later"
- "Next" button disabled until all three required fields valid and instruments loaded

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/StepBasics.tsx`
- [ ] Title, instrument, page size fields render
- [ ] Pre-fills from user defaults
- [ ] Immutability warning displayed
- [ ] "Next" disabled until valid

### Dependencies

- T013 (PageSizeSelector), T006 (schema)

### Parallel

No — depends on T013.

---

## Issue: T020 — Create `StepAppearance` component

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create `StepAppearance` in `src/features/notebooks/components/StepAppearance.tsx`.

- Receives React Hook Form control + `useSystemPresets` data + selected preset state
- Renders:
  - `CoverColorPicker` (default leather brown `#8B4513`)
  - `PresetSelector` (with presets data, loading/error states handled)
- "Back" button (calls `onBack` prop) and "Create" submit button
- Submit button disabled + shows spinner while mutation is pending

### Acceptance Criteria

- [ ] Component at `src/features/notebooks/components/StepAppearance.tsx`
- [ ] Color picker and preset selector render
- [ ] Back and submit buttons functional
- [ ] Submit disabled + spinner during pending

### Dependencies

- T014 (CoverColorPicker), T016 (PresetSelector)

### Parallel

No — depends on T014 and T016.

---

## Issue: T021 — Create `CreateNotebookDialog` container

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Create `CreateNotebookDialog` in `src/features/notebooks/components/CreateNotebookDialog.tsx`.

- shadcn `Dialog` managing step state (1 or 2)
- Initializes React Hook Form with Zod schema resolver from `create-notebook-schema.ts`
- Default values: `coverColor` from `DEFAULT_COVER_COLOR`, `instrumentId` and `pageSize` from `useCurrentUser()` cache if available
- Calls `useInstruments({ enabled: open })` and `useSystemPresets({ enabled: open })` for lazy fetching
- Step 1 → `StepBasics`; Step 2 → `StepAppearance`
- On back: set step to 1 (form data preserved)
- On close: form resets (`reset()` in Dialog `onOpenChange` when closing)
- On submit: build `CreateNotebookRequest` — if a preset is selected, map its styles stripping `id` and `notebookId`; if no preset, find `isDefault: true` preset styles (fallback: omit styles); call `useCreateNotebook` mutation
- On error: show error toast, keep dialog open
- Receives `open` and `onOpenChange` props

### Acceptance Criteria

- [ ] Container at `src/features/notebooks/components/CreateNotebookDialog.tsx`
- [ ] Two-step wizard with back/forward navigation
- [ ] Form resets on dialog close
- [ ] Lazy fetching of instruments and presets
- [ ] Correct `CreateNotebookRequest` payload built on submit
- [ ] Error toast on failure, dialog stays open

### Dependencies

- T019 (StepBasics), T020 (StepAppearance), T017 (useSystemPresets), T018 (useCreateNotebook)

### Parallel

No — depends on all step components and hooks.

---

## Issue: T022 — Integrate `CreateNotebookDialog` into dashboard

**Labels:** `feature`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Update `src/features/notebooks/components/NotebooksDashboardPage.tsx`:

- Add `useState` for dialog open state
- "Create Notebook" header button and dashed-border add card both set dialog open to `true`
- Detect `/app/notebooks/new` via `useLocation()` and set dialog open on mount
- On dialog close, navigate to `/app/notebooks` if currently on `/new`
- Render `CreateNotebookDialog` with `open` / `onOpenChange` props

### Acceptance Criteria

- [ ] Dialog opens from header button, add card, and `/new` route
- [ ] Dialog close navigates away from `/new`
- [ ] No duplicate dialogs rendered

### Dependencies

- T021 (CreateNotebookDialog), T011 (NotebooksDashboardPage)

### Parallel

No — sequential after T021.

---

## Issue: T022b — Write hook tests for `useCreateNotebook` and `useSystemPresets`

**Labels:** `test`, `004-notebook-dashboard`, `phase-4`, `US2`

### Description

Write tests in:

- `src/features/notebooks/hooks/useCreateNotebook.test.ts`
- `src/features/notebooks/hooks/useSystemPresets.test.ts`

**MSW handlers:**

- `POST /notebooks` — success 201, error 400
- `GET /presets/system`

**Test cases:**

- [ ] `useCreateNotebook` invalidates `["notebooks"]` on success
- [ ] `useSystemPresets` respects `enabled` flag
- [ ] `useSystemPresets` uses `staleTime: 300_000`

### Acceptance Criteria

- [ ] Both test files exist
- [ ] All test cases pass
- [ ] MSW used for API mocking

### Dependencies

- T017 (useSystemPresets), T018 (useCreateNotebook)

### Parallel

Yes — can be written in parallel with T019–T022.
