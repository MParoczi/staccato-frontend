# Phase 6: Polish & Cross-Cutting Concerns — GitHub Issues

> Accessibility, i18n completeness, and final quality pass. All user stories must be complete before this phase.

---

## Issue: T026 — Verify i18n completeness

**Labels:** `i18n`, `004-notebook-dashboard`, `phase-6`

### Description

Verify all `notebooks.*` i18n keys are present and correct in both `src/i18n/en.json` and `src/i18n/hu.json`.

**Checks:**

- [ ] ICU pluralization for lesson count works correctly in Hungarian (`{count, plural, one {# lecke} other {# lecke}}`)
- [ ] Date formatting uses `Intl.DateTimeFormat` with user locale everywhere
- [ ] No hardcoded user-facing strings remain in any notebook component

### Acceptance Criteria

- [ ] All `notebooks.*` keys exist in both language files
- [ ] Pluralization works in both English and Hungarian
- [ ] Zero hardcoded strings in `src/features/notebooks/`

### Dependencies

- Phases 3–5 complete (all components exist)

### Parallel

Yes — independent of T027, T028.

---

## Issue: T027 — Accessibility pass

**Labels:** `a11y`, `004-notebook-dashboard`, `phase-6`

### Description

Accessibility audit across all new notebook components.

**Verify:**

- [ ] All color swatches in `CoverColorPicker` have `aria-label` with localized color name
- [ ] `PageSizeSelector` and `PresetSelector` use `role="radiogroup"` / `role="radio"` with `aria-checked`
- [ ] Dialog / AlertDialog focus trap works (shadcn built-in)
- [ ] DropdownMenu keyboard navigation works (shadcn built-in)
- [ ] All interactive elements meet 44px minimum touch target on mobile
- [ ] `prefers-reduced-motion` disables hover translate/scale on `NotebookCard`

### Acceptance Criteria

- [ ] All items above verified and passing
- [ ] No accessibility regressions

### Dependencies

- Phases 3–5 complete

### Parallel

Yes — independent of T026, T028.

---

## Issue: T028 — Lint pass

**Labels:** `chore`, `004-notebook-dashboard`, `phase-6`

### Description

Run `pnpm run lint` and fix any linting errors across all new files:

- `src/features/notebooks/**`
- `src/lib/constants/notebook-colors.ts`
- `src/lib/types/notebooks.ts`
- `src/hooks/useInstruments.ts`

### Acceptance Criteria

- [ ] `pnpm run lint` exits with 0 errors on all new files
- [ ] No warnings introduced

### Dependencies

- Phases 3–5 complete

### Parallel

Yes — independent of T026, T027.

---

## Issue: T029 — Final review

**Labels:** `chore`, `004-notebook-dashboard`, `phase-6`

### Description

End-to-end verification that all acceptance scenarios from `spec.md` are met.

**Verify:**

- [ ] `NotebooksDashboardPage` renders correctly for all states: loading, empty, populated, error
- [ ] Create wizard works end-to-end with validation
- [ ] Delete works with optimistic update and rollback
- [ ] Sort resets on page visit
- [ ] Responsive grid works at all breakpoints (1 / 2 / 3 / 4 columns)
- [ ] All acceptance scenarios from `spec.md` are met

### Acceptance Criteria

- [ ] Full manual walkthrough passes
- [ ] No regressions in existing functionality

### Dependencies

- T026, T027, T028 (all polish tasks complete)

### Parallel

No — final sequential task.
