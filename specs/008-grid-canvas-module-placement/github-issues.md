# GitHub Issues — 008-grid-canvas-module-placement

Copy each block below into a new GitHub issue at `https://github.com/MParoczi/staccato-frontend/issues/new`.

- **Repository**: `MParoczi/staccato-frontend`
- **Base branch for PRs**: `008-grid-canvas-module-placement`
- **Specification**: `specs/008-grid-canvas-module-placement/`
- **Phase 1 (Setup)** is already implemented (`T001`–`T003` marked `[x]` in `tasks.md`) and is intentionally omitted below.

Each issue is scoped to one phase so `.github/agents/speckit-implementation.agent.md` can pick it up, implement every task in that phase, verify the work, mark the phase tasks complete in `tasks.md`, and open a single PR targeting `008-grid-canvas-module-placement`.

Suggested labels (create them first if they do not exist): `speckit`, `feature/008-grid-canvas-module-placement`, `phase:N` (one per phase), plus `user-story:US1` / `user-story:US2` / `user-story:US3` / `user-story:US4` where noted.

---

## Issue 1 — Phase 2: Foundational

**Title**

```text
[008-grid-canvas-module-placement] Phase 2: Foundational — canvas contracts, state, utilities, and shared dotted-paper infrastructure
```

**Labels**: `speckit`, `feature/008-grid-canvas-module-placement`, `phase:2`

**Body**

```markdown
## Phase

**Specification**: `specs/008-grid-canvas-module-placement/`
**Base branch (branch off this and target it with the PR)**: `008-grid-canvas-module-placement`
**Phase**: 2 — Foundational (Blocking Prerequisites)

> Blocking prerequisites. No user-story work should begin until this phase is complete. Phase 1 (Setup — T001–T003) is already merged into the base branch.

## Tasks to implement

Implement every task in this list in the order shown. `[P]` marks tasks that can be done in parallel (different files, no dependencies).

- [ ] **T004 [P]** Extend shared canvas domain types for `ModuleLayout`, layout mutations, and transient interaction state in `src/lib/types/modules.ts`
- [ ] **T005 [P]** Align module API helpers with the documented GET/POST/PATCH `/layout`/DELETE contracts and add API coverage in `src/api/modules.ts` and `src/api/modules.test.ts`
- [ ] **T006 [P]** Clamp and persist canvas zoom and selected-module helpers for the 50%-200% range in `src/stores/uiStore.ts` and `src/stores/uiStore.test.ts`
- [ ] **T007 [P]** Implement zoom-aware grid conversion helpers and tests in `src/features/notebooks/utils/grid-layout.ts` and `src/features/notebooks/utils/grid-layout.test.ts`
- [ ] **T008 [P]** Implement rectangle overlap detection with edge-touch validity tests in `src/features/notebooks/utils/overlap.ts` and `src/features/notebooks/utils/overlap.test.ts`
- [ ] **T009 [P]** Implement first-fit module placement scanning and no-space tests in `src/features/notebooks/utils/placement.ts` and `src/features/notebooks/utils/placement.test.ts`
- [ ] **T010 [P]** Implement the composed bounds/min-size/overlap validation pipeline and tests in `src/features/notebooks/utils/layout-validation.ts` and `src/features/notebooks/utils/layout-validation.test.ts`
- [ ] **T011 [P]** Implement layering helpers for bring-to-front/send-to-back and tests in `src/features/notebooks/utils/z-index.ts` and `src/features/notebooks/utils/z-index.test.ts`
- [ ] **T012 [P]** Implement the page-modules query hook and query-key test coverage in `src/features/notebooks/hooks/usePageModules.ts` and `src/features/notebooks/hooks/usePageModules.test.tsx`
- [ ] **T013 [P]** Create the shared optimistic module-mutation scaffold and test harness in `src/features/notebooks/hooks/useModuleLayoutMutations.ts` and `src/features/notebooks/hooks/useModuleLayoutMutations.test.tsx`
- [ ] **T014** Upgrade true page sizing, dotted-paper rendering, and review-target styling in `src/components/common/DottedPaper.tsx` and `src/components/common/DottedPaper.test.tsx`

## Dependencies

- Phase 1 is already merged.
- `[P]` tasks may be split across API, store, util, and hook workstreams.
- `T014` should land after the foundational constants/types are in place because it consumes page sizing and style token decisions.
- No user-story UI work should begin until this phase is complete.

## Checkpoint / Acceptance criteria

- Shared canvas types, layout payloads, and transient interaction types are in place.
- Module API helpers match the documented `/pages/{pageId}/modules` and `/modules/{moduleId}/layout` contracts.
- Canvas zoom state is clamped/persisted in the existing `uiStore`.
- Grid math, overlap detection, placement scanning, layout validation, and z-index helpers all have explicit automated coverage.
- Dotted-paper rendering supports real page sizing, zoom-aware dots, and representative review-target styling.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T004–T014 are marked `[x]` in `tasks.md` in the same commit as the implementation.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `008-grid-canvas-module-placement/phase-2-foundational`
- One commit for the full phase
- PR targets `008-grid-canvas-module-placement`
```

---

## Issue 2 — Phase 3: User Story 1 (View and Select Modules on the Page Canvas)

**Title**

```text
[008-grid-canvas-module-placement] Phase 3: User Story 1 — render the page canvas and module selection MVP
```

**Labels**: `speckit`, `feature/008-grid-canvas-module-placement`, `phase:3`, `user-story:US1`

**Body**

```markdown
## Phase

**Specification**: `specs/008-grid-canvas-module-placement/`
**Base branch (branch off this and target it with the PR)**: `008-grid-canvas-module-placement`
**Phase**: 3 — User Story 1: View and Select Modules on the Page Canvas (Priority: P1) — MVP

**Goal**: Render the dotted-paper lesson page, show existing modules with saved layout/style/z-index, and support module selection and empty-canvas deselection.

**Independent test**: Load a page with existing modules, confirm page dimensions and dotted-paper styling, confirm module positions and stacking order, click a module to select it, and click empty canvas space to clear selection.

## Tasks to implement

### Tests for User Story 1
- [ ] **T015 [P] [US1]** Add module rendering and selection-affordance tests in `src/features/notebooks/components/ModuleCard.test.tsx`
- [ ] **T016 [P] [US1]** Add page-load and select/deselect integration tests in `src/features/notebooks/components/GridCanvas.test.tsx` and `src/features/notebooks/components/LessonPage.test.tsx`

### Implementation for User Story 1
- [ ] **T017 [P] [US1]** Implement the memoized module shell with style mapping, selection outline, header drag region, and conflict visuals in `src/features/notebooks/components/ModuleCard.tsx`
- [ ] **T018 [P] [US1]** Implement presentational eight-handle selection grips with labels in `src/features/notebooks/components/ModuleResizeHandles.tsx`
- [ ] **T019 [US1]** Implement selection and empty-canvas deselection state handling in `src/features/notebooks/hooks/useCanvasInteractions.ts`
- [ ] **T020 [US1]** Replace the lesson-page canvas placeholder with page rendering, module stacking, and selection wiring in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/components/LessonPage.tsx`

## Dependencies

- Phase 2 must already be merged.
- `T017` and `T018` can proceed in parallel after the foundational phase.
- `T019` should land before `T020` final wiring because `GridCanvas` consumes the interaction state.

## Checkpoint / Acceptance criteria

- A true dotted-paper page renders at the correct size for the current page type.
- Saved modules render at the correct position, dimensions, and stacking order.
- Selecting a module shows the styled selection affordances and handles.
- Clicking empty canvas space clears selection.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T015–T020 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `008-grid-canvas-module-placement/phase-3-us1-canvas-selection`
- One commit for the full phase
- PR targets `008-grid-canvas-module-placement`
```

---

## Issue 3 — Phase 4: User Story 2 (Reposition and Resize Modules Safely)

**Title**

```text
[008-grid-canvas-module-placement] Phase 4: User Story 2 — snapped drag and resize with optimistic rollback
```

**Labels**: `speckit`, `feature/008-grid-canvas-module-placement`, `phase:4`, `user-story:US2`

**Body**

```markdown
## Phase

**Specification**: `specs/008-grid-canvas-module-placement/`
**Base branch (branch off this and target it with the PR)**: `008-grid-canvas-module-placement`
**Phase**: 4 — User Story 2: Reposition and Resize Modules Safely (Priority: P1)

**Goal**: Enable snapped drag and resize interactions with preview, conflict highlighting, optimistic updates, rollback, and zoom-lock during active manipulation.

**Independent test**: Select a module, drag it to a valid grid position, resize it from multiple handles, verify snapped previews, reject overlap/out-of-bounds/min-size cases, and confirm optimistic save with rollback on server rejection.

## Tasks to implement

### Tests for User Story 2
- [ ] **T021 [P] [US2]** Add snapped drag/resize session tests with invalid-preview coverage in `src/features/notebooks/hooks/useCanvasInteractions.test.tsx`
- [ ] **T022 [P] [US2]** Add debounced optimistic layout-save and rollback tests in `src/features/notebooks/hooks/useModuleLayoutMutations.test.tsx`
- [ ] **T023 [P] [US2]** Extend drag/resize integration coverage for valid and invalid releases in `src/features/notebooks/components/GridCanvas.test.tsx` and `src/features/notebooks/components/LessonPage.test.tsx`

### Implementation for User Story 2
- [ ] **T024 [P] [US2]** Implement the snapped semi-transparent drag ghost in `src/features/notebooks/components/ModuleDragOverlay.tsx`
- [ ] **T025 [US2]** Implement optimistic move/resize persistence with 500 ms delayed `PATCH /layout`, rollback, and server-message toasts in `src/features/notebooks/hooks/useModuleLayoutMutations.ts`
- [ ] **T026 [US2]** Extend resize-handle behavior and pointer-driven resize math in `src/features/notebooks/components/ModuleResizeHandles.tsx` and `src/features/notebooks/hooks/useCanvasInteractions.ts`
- [ ] **T027 [US2]** Wire dnd-kit header dragging, conflict highlighting, bounds rejection, and zoom-disable behavior during active drag/resize in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/hooks/useCanvasInteractions.ts`

## Dependencies

- Phase 3 must already be merged.
- `T021`–`T023` can run in parallel.
- `T025` should land before `T027` final UI wiring because `GridCanvas` consumes the mutation flow.
- Respect the clarified rules: toast-only feedback and ignored zoom changes during active drag/resize.

## Checkpoint / Acceptance criteria

- Dragging works only from the selected module header.
- Drag and resize previews snap to grid and highlight overlap conflicts.
- Invalid releases reject with rollback and a toast.
- Valid releases update optimistically and persist through the `/layout` endpoint after 500 ms.
- Zoom requests are ignored during active drag/resize.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T021–T027 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `008-grid-canvas-module-placement/phase-4-us2-drag-resize`
- One commit for the full phase
- PR targets `008-grid-canvas-module-placement`
```

---

## Issue 4 — Phase 5: User Story 3 (Add, Delete, and Layer Modules)

**Title**

```text
[008-grid-canvas-module-placement] Phase 5: User Story 3 — add, delete, and layer modules on the canvas
```

**Labels**: `speckit`, `feature/008-grid-canvas-module-placement`, `phase:5`, `user-story:US3`

**Body**

```markdown
## Phase

**Specification**: `specs/008-grid-canvas-module-placement/`
**Base branch (branch off this and target it with the PR)**: `008-grid-canvas-module-placement`
**Phase**: 5 — User Story 3: Add, Delete, and Layer Modules (Priority: P2)

**Goal**: Let editors add modules from the picker, delete selected modules with confirmation rules, and change visual layering without bypassing placement rules.

**Independent test**: Open the add-module picker, create a module at the first valid slot, verify no-space and backend validation errors, delete empty and non-empty modules with the correct flow, and change z-index ordering through context actions.

## Tasks to implement

### Tests for User Story 3
- [ ] **T028 [P] [US3]** Add first-fit creation and no-space validation tests in `src/features/notebooks/components/AddModulePicker.test.tsx` and `src/features/notebooks/utils/placement.test.ts`
- [ ] **T029 [P] [US3]** Add delete, rollback, and layering integration coverage in `src/features/notebooks/components/LessonPage.test.tsx` and `src/features/notebooks/hooks/useModuleLayoutMutations.test.tsx`

### Implementation for User Story 3
- [ ] **T030 [P] [US3]** Implement the keyboard-accessible 12-type module picker with labeled icons and immediate create flow in `src/features/notebooks/components/AddModulePicker.tsx`
- [ ] **T031 [P] [US3]** Implement delete, confirm-delete, bring-to-front, and send-to-back actions in `src/features/notebooks/components/ModuleContextMenu.tsx`
- [ ] **T032 [US3]** Extend optimistic create/delete/layer mutations, validation-code mapping, and z-index reconciliation in `src/features/notebooks/hooks/useModuleLayoutMutations.ts`
- [ ] **T033 [US3]** Integrate add-module and context-menu actions into the canvas shell in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/components/LessonPage.tsx`

## Dependencies

- Phase 3 must already be merged.
- Phase 2 placement and z-index utilities must already exist.
- `T030` and `T031` may be built in parallel before `T032` and `T033`.
- Add-module flow must use immediate first-fit auto-placement; click-to-place is out of scope.

## Checkpoint / Acceptance criteria

- Add Module opens a keyboard-accessible 12-type picker.
- Selecting a type immediately creates a module at the first valid position or shows the proper toast failure.
- Delete respects empty vs non-empty confirmation behavior.
- Bring to Front / Send to Back update visual order without bypassing overlap rules.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T028–T033 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `008-grid-canvas-module-placement/phase-5-us3-add-delete-layer`
- One commit for the full phase
- PR targets `008-grid-canvas-module-placement`
```

---

## Issue 5 — Phase 6: User Story 4 (Zoom, Pan, and Accessibility)

**Title**

```text
[008-grid-canvas-module-placement] Phase 6: User Story 4 — zoom, pan, and accessibility hardening
```

**Labels**: `speckit`, `feature/008-grid-canvas-module-placement`, `phase:6`, `user-story:US4`

**Body**

```markdown
## Phase

**Specification**: `specs/008-grid-canvas-module-placement/`
**Base branch (branch off this and target it with the PR)**: `008-grid-canvas-module-placement`
**Phase**: 6 — User Story 4: Control Page Zoom and Viewport Pan While Preserving Layout Meaning (Priority: P3)

**Goal**: Deliver zoom controls, shortcuts, `Ctrl+wheel` zoom, plain-wheel panning, and the basic accessibility requirements for canvas controls and actions.

**Independent test**: Use zoom buttons, Ctrl shortcuts, and wheel interactions to move between 50% and 200%, confirm plain-wheel vertical pan, verify zoom is ignored during active drag/resize, and confirm visible focus plus keyboard access for canvas controls.

## Tasks to implement

### Tests for User Story 4
- [ ] **T034 [P] [US4]** Add keyboard-shortcut and wheel pan/zoom tests in `src/features/notebooks/hooks/useCanvasZoomShortcuts.test.tsx` and `src/features/notebooks/components/GridCanvas.test.tsx`
- [ ] **T035 [P] [US4]** Add accessibility-focused integration tests for focus states, labels, and keyboard-triggered actions in `src/features/notebooks/components/LessonPage.test.tsx`

### Implementation for User Story 4
- [ ] **T036 [P] [US4]** Implement labeled zoom controls with visible focus treatment in `src/features/notebooks/components/CanvasViewportControls.tsx`
- [ ] **T037 [P] [US4]** Implement `Ctrl+Plus`, `Ctrl+Minus`, and `Ctrl+0` handling in `src/features/notebooks/hooks/useCanvasZoomShortcuts.ts`
- [ ] **T038 [US4]** Implement plain-wheel vertical panning, `Ctrl+wheel` zooming, zoom clamping, and selection-preserving scale updates in `src/features/notebooks/components/GridCanvas.tsx` and `src/features/notebooks/hooks/useCanvasInteractions.ts`
- [ ] **T039 [US4]** Finalize accessibility labels and keyboard activation paths across `src/features/notebooks/components/AddModulePicker.tsx`, `src/features/notebooks/components/ModuleContextMenu.tsx`, and `src/features/notebooks/components/LessonPage.tsx`

## Dependencies

- Phase 4 and Phase 5 must already be merged.
- `T036` and `T037` may proceed in parallel before `T038` and `T039`.
- Respect the clarified spec behavior: plain wheel pans, `Ctrl+wheel` zooms, and zoom requests are ignored during active drag/resize.

## Checkpoint / Acceptance criteria

- Zoom controls, keyboard shortcuts, and `Ctrl+wheel` zoom all work within the 50%–200% range.
- Plain wheel pans the canvas viewport vertically.
- Zoom does not mutate saved layout coordinates and remains disabled during active drag/resize.
- Basic accessibility is in place: visible focus, labels, and keyboard access to zoom/add/context-menu actions.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T034–T039 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `008-grid-canvas-module-placement/phase-6-us4-zoom-pan-accessibility`
- One commit for the full phase
- PR targets `008-grid-canvas-module-placement`
```

---

## Issue 6 — Phase 7: Polish & cross-cutting concerns

**Title**

```text
[008-grid-canvas-module-placement] Phase 7: Polish — review-target styling, toast copy, and final validation
```

**Labels**: `speckit`, `feature/008-grid-canvas-module-placement`, `phase:7`, `polish`

**Body**

```markdown
## Phase

**Specification**: `specs/008-grid-canvas-module-placement/`
**Base branch (branch off this and target it with the PR)**: `008-grid-canvas-module-placement`
**Phase**: 7 — Polish & Cross-Cutting Concerns

**Purpose**: Finalize representative styling targets, standardized toast copy, and the validation work that spans all stories.

## Tasks to implement

- [ ] **T040 [P]** Reconcile paper, dot, selection, conflict, and page-shadow review targets across `src/components/common/DottedPaper.tsx`, `src/features/notebooks/components/GridCanvas.tsx`, and `src/features/notebooks/components/ModuleCard.tsx`
- [ ] **T041 [P]** Standardize localized toast-only success and error copy in `src/i18n/en.json`, `src/i18n/hu.json`, and `src/features/notebooks/hooks/useModuleLayoutMutations.ts`
- [ ] **T042** Run `pnpm test` and `pnpm run lint` from `package.json` and capture implementation follow-up notes in `specs/008-grid-canvas-module-placement/implementation-notes.md`
- [ ] **T043** Validate `SC-001`, `SC-003`, and `SC-005` timing targets under normal conditions and record the results in `specs/008-grid-canvas-module-placement/implementation-notes.md`

## Dependencies

- All earlier implementation phases should be merged first.
- `T040` and `T041` can run in parallel before the final validation tasks.
- `T042` and `T043` should update only `implementation-notes.md`, not planning artifacts.

## Checkpoint / Acceptance criteria

- Representative paper, dot, selection, conflict, and shadow targets are reflected in the implemented UI.
- English and Hungarian toast-only feedback copy are finalized together.
- `pnpm run lint` passes.
- `pnpm test` passes.
- Timing validation for `SC-001`, `SC-003`, and `SC-005` is recorded in `implementation-notes.md`.
- T040–T043 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`
- [ ] Validation outcomes are documented in `implementation-notes.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `008-grid-canvas-module-placement/phase-7-polish`
- One commit for the full phase
- PR targets `008-grid-canvas-module-placement`
```

---

## How to create these on GitHub

1. Open `https://github.com/MParoczi/staccato-frontend/issues/new` in the browser.
2. For each issue above, copy the **Title** into the title field.
3. Copy the **Body** fenced `markdown` contents (excluding the outer fences) into the GitHub issue description.
4. Apply the listed labels (create them once if missing).
5. Create the issues in phase order (2 → 7) so the implementation agent can work through them in sequence, each targeting the `008-grid-canvas-module-placement` base branch.

