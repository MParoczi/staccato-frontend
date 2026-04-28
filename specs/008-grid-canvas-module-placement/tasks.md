# Tasks: Grid Canvas & Module Placement

**Input**: Design documents from `/specs/008-grid-canvas-module-placement/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md, contracts/

**Tests**: Automated tests are required for this feature because the plan and quickstart explicitly call for utility, API, hook, component, and integration coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. `[US1]`, `[US2]`)
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the frontend workspace for the canvas feature and shared copy/token setup.

- [X] T001 Add the drag dependency for canvas interactions in `package.json` and `pnpm-lock.yaml`
- [X] T002 [P] Add localized canvas labels, menu text, and toast-only feedback strings in `src/i18n/en.json` and `src/i18n/hu.json`
- [X] T003 [P] Add shared grid, zoom, and representative style token constants in `src/lib/constants/grid.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts, state, and utilities that MUST be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 [P] Extend shared canvas domain types for `ModuleLayout`, layout mutations, and transient interaction state in `src/lib/types/modules.ts`
- [x] T005 [P] Align module API helpers with the documented GET/POST/PATCH `/layout`/DELETE contracts and add API coverage in `src/api/modules.ts` and `src/api/modules.test.ts`
- [x] T006 [P] Clamp and persist canvas zoom and selected-module helpers for the 50%-200% range in `src/stores/uiStore.ts` and `src/stores/uiStore.test.ts`
- [x] T007 [P] Implement zoom-aware grid conversion helpers and tests in `src/features/notebooks/utils/grid-layout.ts` and `src/features/notebooks/utils/grid-layout.test.ts`
- [x] T008 [P] Implement rectangle overlap detection with edge-touch validity tests in `src/features/notebooks/utils/overlap.ts` and `src/features/notebooks/utils/overlap.test.ts`
- [x] T009 [P] Implement first-fit module placement scanning and no-space tests in `src/features/notebooks/utils/placement.ts` and `src/features/notebooks/utils/placement.test.ts`
- [x] T010 [P] Implement the composed bounds/min-size/overlap validation pipeline and tests in `src/features/notebooks/utils/layout-validation.ts` and `src/features/notebooks/utils/layout-validation.test.ts`
- [x] T011 [P] Implement layering helpers for bring-to-front/send-to-back and tests in `src/features/notebooks/utils/z-index.ts` and `src/features/notebooks/utils/z-index.test.ts`
- [x] T012 [P] Implement the page-modules query hook and query-key test coverage in `src/features/notebooks/hooks/usePageModules.ts` and `src/features/notebooks/hooks/usePageModules.test.tsx`
- [x] T013 [P] Create the shared optimistic module-mutation scaffold and test harness in `src/features/notebooks/hooks/useModuleLayoutMutations.ts` and `src/features/notebooks/hooks/useModuleLayoutMutations.test.tsx`
- [x] T014 Upgrade true page sizing, dotted-paper rendering, and review-target styling in `src/components/common/DottedPaper.tsx` and `src/components/common/DottedPaper.test.tsx`

**Checkpoint**: Foundation ready. User story work can begin.

---

## Phase 3: User Story 1 - View and Select Modules on the Page Canvas (Priority: P1) 🎯 MVP

**Goal**: Render the notebook page as a dotted-paper canvas, show existing modules with saved styles and stacking order, and support selection/deselection.

**Independent Test**: Load a page with existing modules, confirm page dimensions and dotted-paper styling, confirm module positions and z-index ordering, click a module to select it, and click empty canvas space to clear selection.

### Tests for User Story 1

- [x] T015 [P] [US1] Add module rendering and selection-affordance tests in `src/features/notebooks/components/ModuleCard.test.tsx`
- [x] T016 [P] [US1] Add page-load and select/deselect integration tests in `src/features/notebooks/components/GridCanvas.test.tsx` and `src/features/notebooks/components/LessonPage.test.tsx`

### Implementation for User Story 1

- [x] T017 [P] [US1] Implement the memoized module shell with style mapping, selection outline, header drag region, and conflict visuals in `src/features/notebooks/components/ModuleCard.tsx`
- [x] T018 [P] [US1] Implement presentational eight-handle selection grips with labels in `src/features/notebooks/components/ModuleResizeHandles.tsx`
- [x] T019 [US1] Implement selection and empty-canvas deselection state handling in `src/features/notebooks/hooks/useCanvasInteractions.ts`
- [x] T020 [US1] Replace the lesson-page canvas placeholder with page rendering, module stacking, and selection wiring in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/components/LessonPage.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Reposition and Resize Modules Safely (Priority: P1)

**Goal**: Enable snapped drag and resize interactions with preview, conflict highlighting, optimistic updates, rollback, and zoom-lock during active manipulation.

**Independent Test**: Select a module, drag it to a valid grid position, resize it from multiple handles, verify snapped previews, reject overlap/out-of-bounds/min-size cases, and confirm optimistic save with rollback on server rejection.

### Tests for User Story 2

- [x] T021 [P] [US2] Add snapped drag/resize session tests with invalid-preview coverage in `src/features/notebooks/hooks/useCanvasInteractions.test.tsx`
- [x] T022 [P] [US2] Add debounced optimistic layout-save and rollback tests in `src/features/notebooks/hooks/useModuleLayoutMutations.test.tsx`
- [x] T023 [P] [US2] Extend drag/resize integration coverage for valid and invalid releases in `src/features/notebooks/components/GridCanvas.test.tsx` and `src/features/notebooks/components/LessonPage.test.tsx`

### Implementation for User Story 2

- [x] T024 [P] [US2] Implement the snapped semi-transparent drag ghost in `src/features/notebooks/components/ModuleDragOverlay.tsx`
- [x] T025 [US2] Implement optimistic move/resize persistence with 500 ms delayed `PATCH /layout`, rollback, and server-message toasts in `src/features/notebooks/hooks/useModuleLayoutMutations.ts`
- [x] T026 [US2] Extend resize-handle behavior and pointer-driven resize math in `src/features/notebooks/components/ModuleResizeHandles.tsx` and `src/features/notebooks/hooks/useCanvasInteractions.ts`
- [x] T027 [US2] Wire dnd-kit header dragging, conflict highlighting, bounds rejection, and zoom-disable behavior during active drag/resize in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/hooks/useCanvasInteractions.ts`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Add, Delete, and Layer Modules (Priority: P2)

**Goal**: Let editors add modules from the picker, delete selected modules with confirmation rules, and change visual layering without bypassing placement rules.

**Independent Test**: Open the add-module picker, create a module at the first valid slot, verify no-space and backend validation errors, delete empty and non-empty modules with the correct flow, and change z-index ordering through context actions.

### Tests for User Story 3

- [x] T028 [P] [US3] Add first-fit creation and no-space validation tests in `src/features/notebooks/components/AddModulePicker.test.tsx` and `src/features/notebooks/utils/placement.test.ts`
- [x] T029 [P] [US3] Add delete, rollback, and layering integration coverage in `src/features/notebooks/components/LessonPage.test.tsx` and `src/features/notebooks/hooks/useModuleLayoutMutations.test.tsx`

### Implementation for User Story 3

- [x] T030 [P] [US3] Implement the keyboard-accessible 12-type module picker with labeled icons and immediate create flow in `src/features/notebooks/components/AddModulePicker.tsx`
- [x] T031 [P] [US3] Implement delete, confirm-delete, bring-to-front, and send-to-back actions in `src/features/notebooks/components/ModuleContextMenu.tsx`
- [x] T032 [US3] Extend optimistic create/delete/layer mutations, validation-code mapping, and z-index reconciliation in `src/features/notebooks/hooks/useModuleLayoutMutations.ts`
- [x] T033 [US3] Integrate add-module and context-menu actions into the canvas shell in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/components/LessonPage.tsx`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Control Page Zoom and Viewport Pan While Preserving Layout Meaning (Priority: P3)

**Goal**: Deliver zoom controls, shortcuts, and plain-wheel panning while preserving snapped layout semantics, selection state, and required accessibility.

**Independent Test**: Use zoom buttons, Ctrl shortcuts, and wheel interactions to move between 50% and 200%, confirm plain-wheel vertical pan, verify zoom is ignored during active drag/resize, and confirm visible focus plus keyboard access for canvas controls.

### Tests for User Story 4

- [ ] T034 [P] [US4] Add keyboard-shortcut and wheel pan/zoom tests in `src/features/notebooks/hooks/useCanvasZoomShortcuts.test.tsx` and `src/features/notebooks/components/GridCanvas.test.tsx`
- [ ] T035 [P] [US4] Add accessibility-focused integration tests for focus states, labels, and keyboard-triggered actions in `src/features/notebooks/components/LessonPage.test.tsx`

### Implementation for User Story 4

- [ ] T036 [P] [US4] Implement labeled zoom controls with visible focus treatment in `src/features/notebooks/components/CanvasViewportControls.tsx`
- [ ] T037 [P] [US4] Implement `Ctrl+Plus`, `Ctrl+Minus`, and `Ctrl+0` handling in `src/features/notebooks/hooks/useCanvasZoomShortcuts.ts`
- [ ] T038 [US4] Implement plain-wheel vertical panning, `Ctrl+wheel` zooming, zoom clamping, and selection-preserving scale updates in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/hooks/useCanvasInteractions.ts`
- [ ] T039 [US4] Finalize accessibility labels and keyboard activation paths across `src/features/notebooks/components/AddModulePicker.tsx`, `src/features/notebooks/components/ModuleContextMenu.tsx`, and `src/features/notebooks/components/LessonPage.tsx`

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final review alignment, copy cleanup, and validation across all stories.

- [ ] T040 [P] Reconcile paper, dot, selection, conflict, and page-shadow review targets across `src/components/common/DottedPaper.tsx`, `src/features/notebooks/components/GridCanvas.tsx`, and `src/features/notebooks/components/ModuleCard.tsx`
- [ ] T041 [P] Standardize localized toast-only success and error copy in `src/i18n/en.json`, `src/i18n/hu.json`, and `src/features/notebooks/hooks/useModuleLayoutMutations.ts`
- [ ] T042 Run `pnpm test` and `pnpm run lint` from `package.json` and capture implementation follow-up notes in `specs/008-grid-canvas-module-placement/implementation-notes.md`
- [ ] T043 Validate `SC-001`, `SC-003`, and `SC-005` timing targets under normal conditions and record the results in `specs/008-grid-canvas-module-placement/implementation-notes.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** → no dependencies
- **Phase 2: Foundational** → depends on Phase 1 and blocks all user stories
- **Phase 3: US1** → depends on Phase 2 only
- **Phase 4: US2** → depends on US1 canvas rendering and Phase 2 shared utilities
- **Phase 5: US3** → depends on US1 canvas rendering and Phase 2 shared utilities
- **Phase 6: US4** → depends on US1 rendering plus the interactive canvas flows from US2 and US3
- **Phase 7: Polish** → depends on all target user stories being complete

### User Story Dependency Graph

```text
Setup -> Foundational -> US1
US1 -> US2
US1 -> US3
US2 -> US4
US3 -> US4
US4 -> Polish
```

### Within Each User Story

- Write or extend tests before implementation work for that story
- Finish utilities/hooks before wiring components that depend on them
- Complete optimistic mutation logic before final UI integration for each action flow
- Validate each story independently before moving to the next phase

### Parallel Opportunities

- `T002` and `T003` can run together after dependency installation starts
- `T004` through `T013` can be split across API, store, util, and hook workstreams
- In US1, `T015`/`T016` and `T017`/`T018` can run in parallel
- In US2, `T021`/`T022`/`T023` can run in parallel before `T024`-`T027`
- In US3, `T030` and `T031` can run in parallel before `T032` and `T033`
- In US4, `T036` and `T037` can run in parallel before `T038` and `T039`
- `T040` and `T041` can run in parallel before final validation in `T042` and `T043`

---

## Parallel Example: User Story 1

```bash
Task: "T015 [US1] Add module rendering and selection-affordance tests in src/features/notebooks/components/ModuleCard.test.tsx"
Task: "T016 [US1] Add page-load and select/deselect integration tests in src/features/notebooks/components/GridCanvas.test.tsx and src/features/notebooks/components/LessonPage.test.tsx"
Task: "T017 [US1] Implement the memoized module shell in src/features/notebooks/components/ModuleCard.tsx"
Task: "T018 [US1] Implement presentational eight-handle selection grips in src/features/notebooks/components/ModuleResizeHandles.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [US2] Add snapped drag/resize session tests in src/features/notebooks/hooks/useCanvasInteractions.test.tsx"
Task: "T022 [US2] Add debounced optimistic layout-save tests in src/features/notebooks/hooks/useModuleLayoutMutations.test.tsx"
Task: "T024 [US2] Implement the snapped semi-transparent drag ghost in src/features/notebooks/components/ModuleDragOverlay.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T030 [US3] Implement the keyboard-accessible 12-type module picker in src/features/notebooks/components/AddModulePicker.tsx"
Task: "T031 [US3] Implement delete and layering actions in src/features/notebooks/components/ModuleContextMenu.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "T036 [US4] Implement labeled zoom controls in src/features/notebooks/components/CanvasViewportControls.tsx"
Task: "T037 [US4] Implement keyboard zoom shortcuts in src/features/notebooks/hooks/useCanvasZoomShortcuts.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate canvas rendering, stacking, and selection flows
5. Demo the MVP before starting manipulation features

### Incremental Delivery

1. Setup + Foundational establish contracts, state, math, and test scaffolding
2. Deliver US1 for visible canvas rendering and selection
3. Deliver US2 for safe drag/resize with rollback behavior
4. Deliver US3 for add/delete/layer management
5. Deliver US4 for zoom, pan, and accessibility hardening
6. Finish with polish and full regression validation

### Suggested MVP Scope

- **MVP**: Phase 1 + Phase 2 + Phase 3 (User Story 1)
- **Next highest-value increment**: User Story 2 drag/resize flows
- **Final increments**: User Story 3 module management, then User Story 4 zoom/pan/accessibility

## Notes

- All tasks follow the required checklist format with task ID, optional `[P]`, required `[US#]` labels for story phases, and exact file paths
- The task order sequences foundational utilities before interactive canvas assembly
- Validation and tests are explicitly included for drag, resize, add, delete, layering, zoom, pan, and accessibility behaviors

