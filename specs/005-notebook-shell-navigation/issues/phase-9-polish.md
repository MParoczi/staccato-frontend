# Phase 9: Polish & Cross-Cutting Concerns — GitHub Issues

> Improvements that affect multiple user stories. Must complete after all user stories are done.

---

## Issue: T044 — Complete Hungarian translations

**Labels:** `i18n`, `005-notebook-shell-navigation`, `phase-9`

### Description

Review and complete all Hungarian translations in `src/i18n/hu.json` for all `notebooks.shell.*` keys added in Phases 3-8.

- Verify every English key in `notebooks.shell.*` has a Hungarian counterpart
- Ensure translations are natural Hungarian (not machine-translated word-by-word)
- Validate interpolation variables match between `en.json` and `hu.json`

### Acceptance Criteria

- [ ] All `notebooks.shell.*` keys present in `hu.json`
- [ ] No missing translations
- [ ] Interpolation variables consistent

### Dependencies

- Phases 3-8 complete (all i18n keys added)

### Parallel

Yes — can be done in parallel with T045.

---

## Issue: T045 — Add accessibility aria-labels

**Labels:** `a11y`, `005-notebook-shell-navigation`, `phase-9`

### Description

Add `aria-label` attributes to all interactive elements across the notebook shell:

- Navigation arrows: "Previous page" / "Next page"
- Sidebar toggle: "Toggle lesson sidebar"
- Zoom buttons: "Zoom in" / "Zoom out" / "Reset zoom"
- Page indicators: `aria-live="polite"` region so screen readers announce page changes
- All icon-only buttons must have accessible labels

### Acceptance Criteria

- [ ] All icon-only buttons have `aria-label`
- [ ] Navigation arrows labeled "Previous page" / "Next page"
- [ ] Sidebar toggle labeled "Toggle lesson sidebar"
- [ ] Zoom buttons labeled appropriately
- [ ] Page indicator has `aria-live="polite"`
- [ ] Labels are i18n keys (not hardcoded English)

### Dependencies

- Phases 3-8 complete

### Parallel

Yes — can be done in parallel with T044.

---

## Issue: T046 — Verify dialog consistency and theming

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-9`

### Description

Review all dialogs for consistent earthy theming and UX patterns:

- `EditNotebookDialog` (Phase 3)
- `CreateLessonDialog` (Phase 6)
- `DeleteLessonDialog` (Phase 6)
- `DeletePageButton` confirmation (Phase 7)
- `DeleteNotebookDialog` (existing from Feature 004)

**Verify:**

- No default cold gray styling — all earthy themed
- Button disabled states consistent (disabled while mutation pending)
- Toast error patterns uniform (error toast, dialog stays open)
- Confirm/cancel button labels consistent
- Focus management: focus trap inside dialogs, return focus on close (shadcn default)

### Acceptance Criteria

- [ ] All 5 dialogs use earthy theming
- [ ] Disabled states consistent across all
- [ ] Error handling pattern uniform (toast + preserve state)
- [ ] No cold gray UI elements

### Dependencies

- T018, T028, T029, T036 (all dialogs must exist)

### Parallel

No — requires reviewing multiple existing components.

---

## Issue: T047 — Verify end-to-end page navigation

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-9`

### Description

Manual or automated verification of the complete navigation flow:

1. Cover page (prev disabled) -> Index (global page 1) -> Lesson 1 Page 1 (global page 2) -> ... -> Last page of last lesson (next disabled)
2. Verify global page numbers are sequential and correct
3. Verify cross-lesson boundary navigation (last page of Lesson N -> first page of Lesson N+1)
4. Verify keyboard left/right arrow navigation matches button navigation
5. Verify keyboard nav suppressed on input fields

### Acceptance Criteria

- [ ] Full linear navigation works without dead ends
- [ ] Global page numbers correct throughout
- [ ] Cross-lesson boundaries work
- [ ] Keyboard navigation matches button navigation
- [ ] Keyboard suppressed on input elements

### Dependencies

- All user stories complete

### Parallel

No — requires complete feature.

---

## Issue: T048 — Run lint and tests

**Labels:** `chore`, `005-notebook-shell-navigation`, `phase-9`

### Description

Run `pnpm run lint` and `pnpm test` to fix any TypeScript, ESLint, or test failures introduced by new code.

- Fix all lint errors
- Fix all type errors
- Ensure all existing tests still pass
- Ensure all new tests (schema + page-sequence) pass

### Acceptance Criteria

- [ ] `pnpm run lint` passes with zero errors
- [ ] `pnpm test` passes (all new + existing tests)
- [ ] No TypeScript strict mode violations

### Dependencies

- All prior phases complete

### Parallel

No — final validation step.
