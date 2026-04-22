# Tasks: Module Styling System

**Input**: Design documents from `/specs/007-module-styling-system/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.md`, `quickstart.md`, `checklists/styling.md`

**Tests**: Included because the feature docs explicitly define Vitest + React Testing Library + MSW coverage and prioritized test scenarios.

**Organization**: Tasks are grouped by user story so each increment stays independently implementable and testable in this frontend codebase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: Maps to the user story from `spec.md` (`\[US1]`, `\[US2]`, `\[US3]`, `\[US4]`)
- Every task includes an exact file path

## Phase 1: Setup

**Purpose**: Prepare shared feature copy and baseline constants for the styling feature.

- [x] T001 Add the English `styling.*` translation namespace and baseline toolbar/drawer/preset copy in `src/i18n/en.json`
- [x] T002 [P] Add the Hungarian `styling.*` translation namespace and baseline toolbar/drawer/preset copy in `src/i18n/hu.json`
- [x] T003 [P] Create curated swatches, module tab order, and font preview UI constants in `src/features/styling/utils/style-defaults.ts`

---

## Phase 2: Foundational

**Purpose**: Deliver the shared contracts, validation, and query infrastructure that blocks all user-story work.

**Critical**: Complete this phase before implementing any user story.

- [x] T004 Add the `UpdateNotebookStyleInput` bulk-update type in `src/lib/types/notebooks.ts`
- [x] T005 Update notebook style API helpers for bulk save and preset apply in `src/api/notebooks.ts`
- [x] T006 Update preset API helpers to match `/presets` and `/users/me/presets` contracts in `src/api/presets.ts`
- [x] T007 [P] Implement Zod editor schemas and inferred form types in `src/features/styling/utils/style-schema.ts`
- [x] T008 [P] Implement per-module control visibility and border-disable rules in `src/features/styling/utils/module-type-config.ts`
- [x] T009 Implement the notebook-styles query hook with `['notebooks', notebookId, 'styles']`, `staleTime: 0`, and refetch-on-focus behavior in `src/features/styling/hooks/useNotebookStyles.ts`
- [x] T010 Implement the system-presets query hook with 5-minute caching in `src/features/styling/hooks/useSystemPresets.ts`
- [x] T011 Implement the user-presets query hook preserving the newest-first order returned by `GET /users/me/presets` in `src/features/styling/hooks/useUserPresets.ts`
- [x] T048 [P] Add MSW-backed request-shaping tests for bulk save and preset apply helpers in `src/api/notebooks.test.ts`
- [x] T049 [P] Add MSW-backed request-shaping tests for system/user preset API helpers in `src/api/presets.test.ts`
- [x] T050 [P] Add 100% branch-coverage tests for module control visibility and border-disable rules in `src/features/styling/utils/module-type-config.test.ts`
- [x] T051 [P] Implement shared style serialization/deserialization helpers in `src/features/styling/utils/style-serialization.ts`
- [x] T052 [P] Add 100% branch-coverage tests for style serialization helpers in `src/features/styling/utils/style-serialization.test.ts`

**Checkpoint**: Shared styling infrastructure is ready for story work.

---

## Phase 3: User Story 1 - Edit Module Styles per Type (Priority: P1)

**Goal**: Let a notebook owner open the style editor, edit module-type styles with live preview, and save all 12 styles in one operation.

**Independent Test**: Open the toolbar Styles trigger, wait for the drawer to load 12 server styles, edit fields across tabs, confirm live preview and dirty state update immediately, then save and verify the notebook styles refresh without a page reload.

### Tests for User Story 1

- [x] T012 [P] \[US1] Add 100% branch-coverage hex and numeric schema tests in `src/features/styling/utils/style-schema.test.ts`
- [x] T013 [P] \[US1] Add color picker popover interaction tests for swatches, valid hex, invalid hex, Escape handling, and Tab/Shift+Tab keyboard traversal in `src/features/styling/components/ColorPickerPopover.test.tsx`
- [x] T014 [P] \[US1] Add optimistic save and rollback coverage for notebook style mutations in `src/features/styling/hooks/useStyleMutations.test.tsx`
- [x] T015 [P] \[US1] Add callback-based Styles trigger coverage for `NotebookToolbar` in `src/features/notebooks/components/NotebookToolbar.test.tsx`
- [x] T016 [P] \[US1] Add drawer integration coverage for loading skeletons, rapid tab switching (last-tab-wins), dirty state, close-discard reset behavior, Tab/Shift+Tab traversal, and bulk save in `src/features/styling/components/StyleEditorDrawer.test.tsx`
- [x] T053 [P] \[US1] Add route-level drawer composition coverage in `src/routes/notebook-layout.test.tsx`

### Implementation for User Story 1

- [x] T017 [P] \[US1] Implement the font sample renderer for Default, Monospace, and Serif in `src/features/styling/components/FontFamilyPreview.tsx`
- [x] T018 [P] \[US1] Implement the hex-input and 6×4 swatch color picker popover with viewport-aware flip/shift behavior in `src/features/styling/components/ColorPickerPopover.tsx`
- [x] T019 [P] \[US1] Implement the dotted-paper live preview card for active module styles with last-tab-wins rendering behavior in `src/features/styling/components/StylePreview.tsx`
- [x] T020 \[US1] Implement module-type form controls, disabled border behavior, and hidden Title/Subtitle field preservation in `src/features/styling/components/StyleEditorTab.tsx`
- [x] T021 \[US1] Implement the bulk save mutation flow with optimistic notebook-style cache updates plus success/destructive toast behavior in `src/features/styling/hooks/useStyleMutations.ts`
- [x] T022 \[US1] Implement the desktop drawer, horizontal tab row, loading skeletons, dirty indicator, backdrop/Escape close behavior, close-discard form reset, and save-all form in `src/features/styling/components/StyleEditorDrawer.tsx`
- [x] T023 \[US1] Wire the icon-only Paintbrush trigger and `onOpenStyles` callback prop into `src/features/notebooks/components/NotebookToolbar.tsx`
- [x] T054 \[US1] Compose the style drawer open state in `src/routes/notebook-layout.tsx` and pass the open callback into `NotebookToolbar`

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Browse and Apply a Preset (Priority: P2)

**Goal**: Let a notebook owner browse system and user presets, inspect thumbnail cards, and apply a preset with optimistic updates and dirty-state confirmation.

**Independent Test**: Open the style editor, verify system presets and user presets render in separate sections, apply a preset with and without unsaved form changes, and confirm the notebook plus drawer values refresh to the applied preset.

### Tests for User Story 2

- [x] T024 [P] \[US2] Add preset browser coverage for loading states, empty states, and disabled apply actions in `src/features/styling/components/PresetBrowser.test.tsx`
- [x] T025 [P] \[US2] Extend preset-apply optimistic update and rollback coverage in `src/features/styling/hooks/useStyleMutations.test.tsx`
- [x] T026 [P] \[US2] Extend drawer integration coverage for dirty-form apply confirmation and post-apply tab refresh in `src/features/styling/components/StyleEditorDrawer.test.tsx`

### Implementation for User Story 2

- [x] T027 [P] \[US2] Implement memoized preset thumbnail cards with 4×3 two-tone swatches in `src/features/styling/components/PresetCard.tsx`
- [x] T028 \[US2] Implement system/user preset sections, empty state messaging, and apply actions in `src/features/styling/components/PresetBrowser.tsx`
- [x] T029 \[US2] Extend apply-preset mutation orchestration, rollback handling, concurrent-action guards, and apply success/error toast behavior in `src/features/styling/hooks/useStyleMutations.ts`
- [x] T030 \[US2] Integrate the preset browser, dirty-state confirmation flow, and form reset-after-apply behavior in `src/features/styling/components/StyleEditorDrawer.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Save Current Styles as a Preset (Priority: P3)

**Goal**: Let a notebook owner save the current 12-style configuration as a reusable user preset, including duplicate-style payloads when the preset name is unique.

**Independent Test**: Edit notebook styles, open Save as Preset, submit a unique preset name, verify the new preset appears at the top of user presets, and confirm duplicate-name errors and the 20-preset limit are enforced.

### Tests for User Story 3

- [x] T031 [P] \[US3] Add preset-creation hook coverage for success, duplicate-name conflicts, and 20-preset gating in `src/features/styling/hooks/useUserPresets.test.tsx`
- [x] T032 [P] \[US3] Add save-as-preset dialog validation coverage in `src/features/styling/components/SavePresetDialog.test.tsx`
- [x] T033 [P] \[US3] Extend drawer integration coverage for saving identical styles under a new unique preset name in `src/features/styling/components/StyleEditorDrawer.test.tsx`

### Implementation for User Story 3

- [x] T034 [P] \[US3] Implement the Save as Preset dialog with inline duplicate-name messaging in `src/features/styling/components/SavePresetDialog.tsx`
- [x] T035 \[US3] Extend user preset creation, optimistic insert, server-order preservation, limit handling, and create success/error toast behavior in `src/features/styling/hooks/useUserPresets.ts`
- [x] T036 \[US3] Add the Save as Preset CTA, limit-reached messaging, and dialog launch flow in `src/features/styling/components/PresetBrowser.tsx`
- [x] T037 \[US3] Connect drawer form serialization helpers to preset creation in `src/features/styling/components/StyleEditorDrawer.tsx`

**Checkpoint**: User Stories 1, 2, and 3 are independently testable.

---

## Phase 6: User Story 4 - Manage User-Saved Presets (Priority: P4)

**Goal**: Let a notebook owner rename and delete saved presets inline, with duplicate-name protection and confirmation on delete.

**Independent Test**: Open the preset browser with existing user presets, rename one via the pencil action using Enter and blur, cancel another rename with Escape, and delete a preset only after confirming the dialog.

### Tests for User Story 4

- [x] T038 [P] \[US4] Extend user preset mutation coverage for rename/delete optimistic rollback in `src/features/styling/hooks/useUserPresets.test.tsx`
- [x] T039 [P] \[US4] Add preset-card interaction coverage for inline rename, truncation, focus-accessible full-name reveal, and delete actions in `src/features/styling/components/PresetCard.test.tsx`
- [x] T040 [P] \[US4] Extend drawer integration coverage for rename commit, Escape cancel, duplicate-name errors, and delete confirmation in `src/features/styling/components/StyleEditorDrawer.test.tsx`

### Implementation for User Story 4

- [x] T041 \[US4] Extend rename and delete mutations plus duplicate-name error mapping and rename/delete success/error toast behavior in `src/features/styling/hooks/useUserPresets.ts`
- [x] T042 \[US4] Implement inline rename, ellipsis truncation, hover/focus full-name reveal, and delete affordances in `src/features/styling/components/PresetCard.tsx`
- [x] T043 \[US4] Integrate preset management callbacks and confirmation dialogs in `src/features/styling/components/PresetBrowser.tsx`

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize cross-story copy, rendering polish, and quickstart verification.

- [ ] T044 [P] Finalize English styling success/error copy in `src/i18n/en.json`
- [ ] T045 [P] Finalize Hungarian styling success/error copy in `src/i18n/hu.json`
- [ ] T046 [P] Add render-performance polish for memoized preset thumbnails and live preview in `src/features/styling/components/PresetCard.tsx`
- [ ] T047 Run the toolbar-to-drawer validation scenarios documented in `specs/007-module-styling-system/quickstart.md`
- [ ] T055 Run the performance and interaction validation checklist for `SC-001`, `SC-002`, `SC-003`, `FR-038`, `FR-047`, and `FR-048` documented in `specs/007-module-styling-system/quickstart.md`
- [ ] T056 Run the desktop browser compatibility checklist for Chrome, Firefox, Safari, and Edge documented in `specs/007-module-styling-system/quickstart.md`
- [ ] T057 Validate success/destructive toast timing and manual-dismiss behavior documented in `specs/007-module-styling-system/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** — no dependencies
- **Phase 2: Foundational** — depends on Phase 1 and blocks all user stories
- **Phase 3: User Story 1** — depends on Phase 2, including the new API/pure-logic test coverage and route-level composition seam
- **Phase 4: User Story 2** — depends on Phase 3 because preset browsing lives inside the style editor drawer
- **Phase 5: User Story 3** — depends on Phase 4 because saving presets extends the preset browser surface
- **Phase 6: User Story 4** — depends on Phase 4; it can proceed independently of User Story 3 if seeded user presets are available
- **Phase 7: Polish** — depends on all desired user stories being complete

### User Story Dependency Graph

```text
Setup -> Foundational -> US1 -> US2 -> US3
                                 \-> US4
```

### Within Each User Story

- Write the listed tests first and confirm they fail before implementation
- Finish shared hooks/utilities before wiring the drawer container for that story
- Keep optimistic-update rollback logic in place before enabling mutation-driven UI actions
- Validate the story's independent test before moving to the next priority

### Parallel Opportunities

- `T002` and `T003` can run in parallel after `T001`
- `T007`, `T008`, `T048`, `T049`, `T050`, and `T051` can run in parallel after `T006`
- US1 component work `T017`-`T019` can run in parallel after the foundational phase
- US2 test tasks `T024`-`T026` can run in parallel
- US3 test tasks `T031`-`T033` can run in parallel
- US4 test tasks `T038`-`T040` can run in parallel
- Polish tasks `T044`-`T046` can run in parallel before `T047`, `T055`, `T056`, and `T057`

---

## Parallel Example: User Story 1

```text
T012 \[US1] Add hex and numeric schema coverage in src/features/styling/utils/style-schema.test.ts
T013 \[US1] Add color picker popover interaction tests in src/features/styling/components/ColorPickerPopover.test.tsx
T015 \[US1] Add Styles trigger coverage in src/features/notebooks/components/NotebookToolbar.test.tsx
T053 \[US1] Add route-level drawer composition coverage in src/routes/notebook-layout.test.tsx

T017 \[US1] Implement the font sample renderer in src/features/styling/components/FontFamilyPreview.tsx
T018 \[US1] Implement the color picker popover in src/features/styling/components/ColorPickerPopover.tsx
T019 \[US1] Implement the dotted-paper live preview card in src/features/styling/components/StylePreview.tsx
```

## Parallel Example: User Story 2

```text
T024 \[US2] Add preset browser coverage in src/features/styling/components/PresetBrowser.test.tsx
T025 \[US2] Extend preset-apply mutation coverage in src/features/styling/hooks/useStyleMutations.test.tsx
T026 \[US2] Extend drawer integration coverage in src/features/styling/components/StyleEditorDrawer.test.tsx

T027 \[US2] Implement memoized preset thumbnail cards in src/features/styling/components/PresetCard.tsx
```

## Parallel Example: User Story 3

```text
T031 \[US3] Add preset-creation hook coverage in src/features/styling/hooks/useUserPresets.test.tsx
T032 \[US3] Add save-as-preset dialog validation coverage in src/features/styling/components/SavePresetDialog.test.tsx
T033 \[US3] Extend drawer integration coverage in src/features/styling/components/StyleEditorDrawer.test.tsx

T034 \[US3] Implement the Save as Preset dialog in src/features/styling/components/SavePresetDialog.tsx
```

## Parallel Example: User Story 4

```text
T038 \[US4] Extend user preset mutation coverage in src/features/styling/hooks/useUserPresets.test.tsx
T039 \[US4] Add preset-card interaction coverage in src/features/styling/components/PresetCard.test.tsx
T040 \[US4] Extend drawer integration coverage in src/features/styling/components/StyleEditorDrawer.test.tsx
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the User Story 1 independent test before proceeding
5. Keep route-level composition in `src/routes/notebook-layout.tsx` so feature boundaries remain constitution-compliant

### Incremental Delivery

1. Deliver US1 for direct style editing and bulk save
2. Add US2 for preset browsing and apply flows
3. Add US3 for saving reusable user presets
4. Add US4 for rename/delete management
5. Finish with Phase 7 polish and quickstart verification

### Suggested MVP Scope

- **MVP**: Phase 3 only (`US1`)
- **Next highest-value increment**: Phase 4 (`US2`)
- **Follow-on increments**: Phase 5 (`US3`), then Phase 6 (`US4`)

---

## Notes

- All tasks use the required checklist format
- Story tasks include `[US#]` labels for traceability
- `[P]` markers are only used where parallel execution is reasonable
- The task list assumes implementation stays under `src/features/styling/` and extends existing API/type/i18n files already present in the repo


