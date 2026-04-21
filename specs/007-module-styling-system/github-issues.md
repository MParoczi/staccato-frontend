# GitHub Issues — 007-module-styling-system

Copy each block below into a new GitHub issue at `https://github.com/MParoczi/staccato-frontend/issues/new`.

- **Repository**: `MParoczi/staccato-frontend`
- **Base branch for PRs**: `007-module-styling-system`
- **Specification**: `specs/007-module-styling-system/`
- **Phase 1 (Setup)** is intentionally omitted below so the implementation agent can start on the first meaningful implementation phase.

Each issue is scoped to one phase so `.github/agents/speckit-implementation.agent.md` can pick it up, implement every task in that phase, verify the work, mark the phase tasks complete in `tasks.md`, and open a single PR targeting `007-module-styling-system`.

Suggested labels (create them first if they do not exist): `speckit`, `feature/007-module-styling-system`, `phase:N` (one per phase), plus `user-story:US1` / `user-story:US2` / `user-story:US3` / `user-story:US4` where noted.

---

## Issue 1 — Phase 2: Foundational

**Title**

```text
[007-module-styling-system] Phase 2: Foundational — API contracts, schemas, hooks, and utility coverage
```

**Labels**: `speckit`, `feature/007-module-styling-system`, `phase:2`

**Body**

```markdown
## Phase

**Specification**: `specs/007-module-styling-system/`
**Base branch (branch off this and target it with the PR)**: `007-module-styling-system`
**Phase**: 2 — Foundational

> Blocking prerequisites. No user-story work should begin until this phase is complete.

## Tasks to implement

Implement every task in this list. Respect the ordering in `tasks.md`; `[P]` means the task can be done in parallel with other `[P]` tasks that touch different files.

- [ ] **T004** Add the `UpdateNotebookStyleInput` bulk-update type in `src/lib/types/notebooks.ts`
- [ ] **T005** Update notebook style API helpers for bulk save and preset apply in `src/api/notebooks.ts`
- [ ] **T006** Update preset API helpers to match `/presets` and `/users/me/presets` contracts in `src/api/presets.ts`
- [ ] **T007 [P]** Implement Zod editor schemas and inferred form types in `src/features/styling/utils/style-schema.ts`
- [ ] **T008 [P]** Implement per-module control visibility and border-disable rules in `src/features/styling/utils/module-type-config.ts`
- [ ] **T009** Implement the notebook-styles query hook with `['notebooks', notebookId, 'styles']`, `staleTime: 0`, and refetch-on-focus behavior in `src/features/styling/hooks/useNotebookStyles.ts`
- [ ] **T010** Implement the system-presets query hook with 5-minute caching in `src/features/styling/hooks/useSystemPresets.ts`
- [ ] **T011** Implement the user-presets query hook preserving the newest-first order returned by `GET /users/me/presets` in `src/features/styling/hooks/useUserPresets.ts`
- [ ] **T048 [P]** Add MSW-backed request-shaping tests for bulk save and preset apply helpers in `src/api/notebooks.test.ts`
- [ ] **T049 [P]** Add MSW-backed request-shaping tests for system/user preset API helpers in `src/api/presets.test.ts`
- [ ] **T050 [P]** Add 100% branch-coverage tests for module control visibility and border-disable rules in `src/features/styling/utils/module-type-config.test.ts`
- [ ] **T051 [P]** Implement shared style serialization/deserialization helpers in `src/features/styling/utils/style-serialization.ts`
- [ ] **T052 [P]** Add 100% branch-coverage tests for style serialization helpers in `src/features/styling/utils/style-serialization.test.ts`

## Dependencies / constraints

- Read `.specify/memory/constitution.md`, `CLAUDE.md`, and the full `specs/007-module-styling-system/` folder before coding.
- Keep feature boundaries clean: no cross-feature imports from `src/features/styling/` into other feature folders.
- All server state must remain in TanStack Query.
- API functions must be tested with MSW mocks.
- Pure logic and schemas must get branch-focused tests per the constitution.

## Checkpoint / acceptance criteria

- Shared styling infrastructure is ready for story work.
- `src/api/notebooks.ts` owns `updateNotebookStyles()` and `applyPresetToNotebook()`.
- `src/api/presets.ts` matches `/presets` and `/users/me/presets` contracts.
- `useUserPresets()` preserves backend-provided newest-first order; no invented client sort heuristic.
- `style-schema.ts`, `module-type-config.ts`, and `style-serialization.ts` all have the intended test coverage.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T004, T005, T006, T007, T008, T009, T010, T011, T048, T049, T050, T051, and T052 are marked `[x]` in `tasks.md` in the same commit as the implementation.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `007-module-styling-system/phase-2-foundational`
- One commit for the full phase
- PR targets `007-module-styling-system`
```

---

## Issue 2 — Phase 3: User Story 1 (Style editor + bulk save)

**Title**

```text
[007-module-styling-system] Phase 3: User Story 1 — Style editor drawer, live preview, and bulk save
```

**Labels**: `speckit`, `feature/007-module-styling-system`, `phase:3`, `user-story:US1`

**Body**

```markdown
## Phase

**Specification**: `specs/007-module-styling-system/`
**Base branch (branch off this and target it with the PR)**: `007-module-styling-system`
**Phase**: 3 — User Story 1: Edit Module Styles per Type (Priority: P1)

**Goal**: Let a notebook owner open the style editor, edit module-type styles with live preview, and save all 12 styles in one operation.

**Independent test**: Open the toolbar Styles trigger, wait for the drawer to load 12 server styles, edit fields across tabs, confirm live preview and dirty state update immediately, then save and verify the notebook styles refresh without a page reload.

## Tasks to implement

### Tests for User Story 1
- [ ] **T012 [P] \[US1]** Add 100% branch-coverage hex and numeric schema tests in `src/features/styling/utils/style-schema.test.ts`
- [ ] **T013 [P] \[US1]** Add color picker popover interaction tests for swatches, valid hex, invalid hex, Escape handling, and Tab/Shift+Tab keyboard traversal in `src/features/styling/components/ColorPickerPopover.test.tsx`
- [ ] **T014 [P] \[US1]** Add optimistic save and rollback coverage for notebook style mutations in `src/features/styling/hooks/useStyleMutations.test.tsx`
- [ ] **T015 [P] \[US1]** Add callback-based Styles trigger coverage for `NotebookToolbar` in `src/features/notebooks/components/NotebookToolbar.test.tsx`
- [ ] **T016 [P] \[US1]** Add drawer integration coverage for loading skeletons, rapid tab switching (last-tab-wins), dirty state, close-discard reset behavior, Tab/Shift+Tab traversal, and bulk save in `src/features/styling/components/StyleEditorDrawer.test.tsx`
- [ ] **T053 [P] \[US1]** Add route-level drawer composition coverage in `src/routes/notebook-layout.test.tsx`

### Implementation for User Story 1
- [ ] **T017 [P] \[US1]** Implement the font sample renderer for Default, Monospace, and Serif in `src/features/styling/components/FontFamilyPreview.tsx`
- [ ] **T018 [P] \[US1]** Implement the hex-input and 6×4 swatch color picker popover with viewport-aware flip/shift behavior in `src/features/styling/components/ColorPickerPopover.tsx`
- [ ] **T019 [P] \[US1]** Implement the dotted-paper live preview card for active module styles with last-tab-wins rendering behavior in `src/features/styling/components/StylePreview.tsx`
- [ ] **T020 \[US1]** Implement module-type form controls, disabled border behavior, and hidden Title/Subtitle field preservation in `src/features/styling/components/StyleEditorTab.tsx`
- [ ] **T021 \[US1]** Implement the bulk save mutation flow with optimistic notebook-style cache updates plus success/destructive toast behavior in `src/features/styling/hooks/useStyleMutations.ts`
- [ ] **T022 \[US1]** Implement the desktop drawer, horizontal tab row, loading skeletons, dirty indicator, backdrop/Escape close behavior, close-discard form reset, and save-all form in `src/features/styling/components/StyleEditorDrawer.tsx`
- [ ] **T023 \[US1]** Wire the icon-only Paintbrush trigger and `onOpenStyles` callback prop into `src/features/notebooks/components/NotebookToolbar.tsx`
- [ ] **T054 \[US1]** Compose the style drawer open state in `src/routes/notebook-layout.tsx` and pass the open callback into `NotebookToolbar`

## Dependencies / constraints

- Phase 2 must already be merged.
- Composition seam must remain route-owned (`NotebookLayout`), not a cross-feature import.
- Title/Subtitle hidden fields must preserve server-loaded values unchanged.
- Close behavior must discard unsaved changes without a confirmation prompt.

## Checkpoint / acceptance criteria

- Styles trigger opens the drawer from the notebook area without violating feature boundaries.
- Drawer loads notebook styles, supports keyboard traversal, and resets unsaved changes on close.
- Live preview updates immediately and obeys last-tab-wins behavior.
- Save persists all 12 styles in one bulk operation with optimistic updates and rollback on error.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T012–T023, T053, and T054 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `007-module-styling-system/phase-3-us1-style-editor`
- One commit for the full phase
- PR targets `007-module-styling-system`
```

---

## Issue 3 — Phase 4: User Story 2 (Preset browser + apply)

**Title**

```text
[007-module-styling-system] Phase 4: User Story 2 — Preset browser and apply flow
```

**Labels**: `speckit`, `feature/007-module-styling-system`, `phase:4`, `user-story:US2`

**Body**

```markdown
## Phase

**Specification**: `specs/007-module-styling-system/`
**Base branch (branch off this and target it with the PR)**: `007-module-styling-system`
**Phase**: 4 — User Story 2: Browse and Apply a Preset (Priority: P2)

**Goal**: Let a notebook owner browse system and user presets, inspect thumbnail cards, and apply a preset with optimistic updates and dirty-state confirmation.

**Independent test**: Open the style editor, verify system presets and user presets render in separate sections, apply a preset with and without unsaved form changes, and confirm the notebook plus drawer values refresh to the applied preset.

## Tasks to implement

### Tests for User Story 2
- [ ] **T024 [P] \[US2]** Add preset browser coverage for loading states, empty states, and disabled apply actions in `src/features/styling/components/PresetBrowser.test.tsx`
- [ ] **T025 [P] \[US2]** Extend preset-apply optimistic update and rollback coverage in `src/features/styling/hooks/useStyleMutations.test.tsx`
- [ ] **T026 [P] \[US2]** Extend drawer integration coverage for dirty-form apply confirmation and post-apply tab refresh in `src/features/styling/components/StyleEditorDrawer.test.tsx`

### Implementation for User Story 2
- [ ] **T027 [P] \[US2]** Implement memoized preset thumbnail cards with 4×3 two-tone swatches in `src/features/styling/components/PresetCard.tsx`
- [ ] **T028 \[US2]** Implement system/user preset sections, empty state messaging, and apply actions in `src/features/styling/components/PresetBrowser.tsx`
- [ ] **T029 \[US2]** Extend apply-preset mutation orchestration, rollback handling, concurrent-action guards, and apply success/error toast behavior in `src/features/styling/hooks/useStyleMutations.ts`
- [ ] **T030 \[US2]** Integrate the preset browser, dirty-state confirmation flow, and form reset-after-apply behavior in `src/features/styling/components/StyleEditorDrawer.tsx`

## Dependencies / constraints

- Phase 3 must already be merged.
- User presets must preserve backend-provided newest-first order.
- Applying a preset while dirty must require confirmation.
- Apply uses `POST /notebooks/{id}/styles/apply-preset/{presetId}` via `src/api/notebooks.ts`.

## Checkpoint / acceptance criteria

- System and user preset sections render independently with proper loading/empty states.
- Thumbnail cards match the documented 4×3 two-tone design.
- Applying a preset updates notebook styles optimistically, handles rollback, and refreshes drawer state.
- Dirty-form preset apply asks for confirmation before replacement.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T024–T030 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `007-module-styling-system/phase-4-us2-preset-browser`
- One commit for the full phase
- PR targets `007-module-styling-system`
```

---

## Issue 4 — Phase 5: User Story 3 (Save as preset)

**Title**

```text
[007-module-styling-system] Phase 5: User Story 3 — Save current styles as a reusable preset
```

**Labels**: `speckit`, `feature/007-module-styling-system`, `phase:5`, `user-story:US3`

**Body**

```markdown
## Phase

**Specification**: `specs/007-module-styling-system/`
**Base branch (branch off this and target it with the PR)**: `007-module-styling-system`
**Phase**: 5 — User Story 3: Save Current Styles as a Preset (Priority: P3)

**Goal**: Let a notebook owner save the current 12-style configuration as a reusable user preset, including duplicate-style payloads when the preset name is unique.

**Independent test**: Edit notebook styles, open Save as Preset, submit a unique preset name, verify the new preset appears at the top of user presets, and confirm duplicate-name errors and the 20-preset limit are enforced.

## Tasks to implement

### Tests for User Story 3
- [ ] **T031 [P] \[US3]** Add preset-creation hook coverage for success, duplicate-name conflicts, and 20-preset gating in `src/features/styling/hooks/useUserPresets.test.tsx`
- [ ] **T032 [P] \[US3]** Add save-as-preset dialog validation coverage in `src/features/styling/components/SavePresetDialog.test.tsx`
- [ ] **T033 [P] \[US3]** Extend drawer integration coverage for saving identical styles under a new unique preset name in `src/features/styling/components/StyleEditorDrawer.test.tsx`

### Implementation for User Story 3
- [ ] **T034 [P] \[US3]** Implement the Save as Preset dialog with inline duplicate-name messaging in `src/features/styling/components/SavePresetDialog.tsx`
- [ ] **T035 \[US3]** Extend user preset creation, optimistic insert, server-order preservation, limit handling, and create success/error toast behavior in `src/features/styling/hooks/useUserPresets.ts`
- [ ] **T036 \[US3]** Add the Save as Preset CTA, limit-reached messaging, and dialog launch flow in `src/features/styling/components/PresetBrowser.tsx`
- [ ] **T037 \[US3]** Connect drawer form serialization helpers to preset creation in `src/features/styling/components/StyleEditorDrawer.tsx`

## Dependencies / constraints

- Phase 4 must already be merged.
- Preset uniqueness is name-based only.
- Saving an identical style payload is allowed if the preset name is unique.
- Max 20 user presets must be enforced.

## Checkpoint / acceptance criteria

- Save as Preset dialog validates names and surfaces duplicate-name errors inline.
- New presets appear in newest-first server order on the next fetch/update path.
- Identical style payloads may be saved under new unique names.
- Limit handling blocks creation at 20 presets and surfaces the proper message.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T031–T037 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `007-module-styling-system/phase-5-us3-save-preset`
- One commit for the full phase
- PR targets `007-module-styling-system`
```

---

## Issue 5 — Phase 6: User Story 4 (Manage saved presets)

**Title**

```text
[007-module-styling-system] Phase 6: User Story 4 — Rename and delete user presets
```

**Labels**: `speckit`, `feature/007-module-styling-system`, `phase:6`, `user-story:US4`

**Body**

```markdown
## Phase

**Specification**: `specs/007-module-styling-system/`
**Base branch (branch off this and target it with the PR)**: `007-module-styling-system`
**Phase**: 6 — User Story 4: Manage User-Saved Presets (Priority: P4)

**Goal**: Let a notebook owner rename and delete saved presets inline, with duplicate-name protection and confirmation on delete.

**Independent test**: Open the preset browser with existing user presets, rename one via the pencil action using Enter and blur, cancel another rename with Escape, and delete a preset only after confirming the dialog.

## Tasks to implement

### Tests for User Story 4
- [ ] **T038 [P] \[US4]** Extend user preset mutation coverage for rename/delete optimistic rollback in `src/features/styling/hooks/useUserPresets.test.tsx`
- [ ] **T039 [P] \[US4]** Add preset-card interaction coverage for inline rename, truncation, focus-accessible full-name reveal, and delete actions in `src/features/styling/components/PresetCard.test.tsx`
- [ ] **T040 [P] \[US4]** Extend drawer integration coverage for rename commit, Escape cancel, duplicate-name errors, and delete confirmation in `src/features/styling/components/StyleEditorDrawer.test.tsx`

### Implementation for User Story 4
- [ ] **T041 \[US4]** Extend rename and delete mutations plus duplicate-name error mapping and rename/delete success/error toast behavior in `src/features/styling/hooks/useUserPresets.ts`
- [ ] **T042 \[US4]** Implement inline rename, ellipsis truncation, hover/focus full-name reveal, and delete affordances in `src/features/styling/components/PresetCard.tsx`
- [ ] **T043 \[US4]** Integrate preset management callbacks and confirmation dialogs in `src/features/styling/components/PresetBrowser.tsx`

## Dependencies / constraints

- Phase 4 must already be merged.
- Rename begins from a pencil icon, commits on Enter or blur, and cancels on Escape.
- Truncated preset names must expose the full name on hover and keyboard focus.

## Checkpoint / acceptance criteria

- Rename/delete mutations behave optimistically and rollback correctly on failure.
- Duplicate rename attempts surface the inline duplicate-name error.
- Delete requires confirmation.
- Full preset names remain accessible when truncated.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T038–T043 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `007-module-styling-system/phase-6-us4-manage-presets`
- One commit for the full phase
- PR targets `007-module-styling-system`
```

---

## Issue 6 — Phase 7: Polish & cross-cutting concerns

**Title**

```text
[007-module-styling-system] Phase 7: Polish — copy, performance, browser checks, and full validation
```

**Labels**: `speckit`, `feature/007-module-styling-system`, `phase:7`, `polish`

**Body**

```markdown
## Phase

**Specification**: `specs/007-module-styling-system/`
**Base branch (branch off this and target it with the PR)**: `007-module-styling-system`
**Phase**: 7 — Polish & Cross-Cutting Concerns

**Purpose**: Finalize cross-story copy, rendering polish, and full validation for the styling system.

## Tasks to implement

- [ ] **T044 [P]** Finalize English styling success/error copy in `src/i18n/en.json`
- [ ] **T045 [P]** Finalize Hungarian styling success/error copy in `src/i18n/hu.json`
- [ ] **T046 [P]** Add render-performance polish for memoized preset thumbnails and live preview in `src/features/styling/components/PresetCard.tsx`
- [ ] **T047** Run the toolbar-to-drawer validation scenarios documented in `specs/007-module-styling-system/quickstart.md`
- [ ] **T055** Run the performance and interaction validation checklist for `SC-001`, `SC-002`, `SC-003`, `FR-038`, `FR-047`, and `FR-048` documented in `specs/007-module-styling-system/quickstart.md`
- [ ] **T056** Run the desktop browser compatibility checklist for Chrome, Firefox, Safari, and Edge documented in `specs/007-module-styling-system/quickstart.md`
- [ ] **T057** Validate success/destructive toast timing and manual-dismiss behavior documented in `specs/007-module-styling-system/quickstart.md`

## Dependencies / constraints

- All earlier implementation phases should be merged first.
- Preserve the finalized spec behavior while doing polish; do not widen scope.
- Use `pnpm` commands only.

## Checkpoint / acceptance criteria

- English and Hungarian copy are finalized together.
- Thumbnail/live-preview render polish is in place.
- Quickstart validation scenarios are executed.
- Performance, browser compatibility, and toast-behavior checks are completed.
- `pnpm run lint` passes.
- `pnpm test` passes.
- T044–T047 and T055–T057 are marked `[x]` in `tasks.md`.

## Quality gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All phase tasks marked `[x]` in `tasks.md`
- [ ] Validation outcomes are documented in the PR body

## Agent instructions

Follow `.github/agents/speckit-implementation.agent.md` exactly:
- Branch name: `007-module-styling-system/phase-7-polish`
- One commit for the full phase
- PR targets `007-module-styling-system`
```

---

## How to create these on GitHub

1. Open `https://github.com/MParoczi/staccato-frontend/issues/new` in the browser.
2. For each issue above, copy the **Title** into the title field.
3. Copy the **Body** fenced `markdown` contents (excluding the outer fences) into the GitHub issue description.
4. Apply the listed labels (create them once if missing).
5. Create the issues in phase order (2 → 7) so the implementation agent can work through them in sequence, each targeting the `007-module-styling-system` base branch.


