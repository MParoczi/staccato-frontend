# Implementation Notes: Grid Canvas & Module Placement

Use this file during implementation to capture:
- test and lint follow-up notes
- timing validation results for `SC-001`, `SC-003`, and `SC-005`
- implementation-specific observations that should not rewrite planning artifacts

## Phase 7 — Polish & Cross-Cutting Concerns

### T040 Review-target reconciliation

- Promoted the canvas review-target colors to dedicated CSS variables in
  `src/index.css` so the light-mode notebook surface matches the
  representative spec values exactly:
  - paper `#F7F1E3`, dot `#A79B8B`, selection outline `#8A6A43`,
    resize handle `#B08968`, conflict highlight `#B85C4B`,
    page border `#E2D6C2`, page shadow `0 10px 30px rgba(92, 74, 52, 0.14)`.
- `GRID_CANVAS_STYLE_TOKENS` in `src/lib/constants/grid.ts` now references
  those variables consistently, including a new `handle` token and shared
  `pageBorder` / `pageShadow` tokens.
- `ModuleResizeHandles` uses the new `handle` token for its warm-toned
  border and references the canonical `paper` token for its fill.
- `ModuleCard` applies the conflict tint via `opacity: 0.24` so the
  underlying module remains legible while the muted terracotta highlight
  stays visually present.
- `ModuleDragOverlay` reuses the `paper` token for the valid-state
  background fallback so all canvas surfaces share a single source of
  truth.
- Dark-mode overrides for `--notebook-handle`, `--notebook-conflict`,
  `--notebook-page-border`, and `--notebook-page-shadow` were added so the
  canvas remains coherent when the dark theme is active.

### T041 Toast copy standardization

- Removed the unused `notebooks.canvas.toasts.layoutSaved` key from both
  `en.json` and `hu.json` because move/resize successes provide their
  feedback through the visual layout change (per FR-047 toast-only flows
  for create/delete/layer outcomes).
- Confirmed every error path in `useModuleLayoutMutations.ts` surfaces a
  server-provided message via `readServerMessage` with a localized
  fallback, and every success path uses a localized `toast.success` key.
- English and Hungarian toast strings now use parallel structure:
  - successes are short past-tense confirmations ("Module added to the
    page." / "A modul hozzáadva az oldalhoz."),
  - errors restate the action that failed ("The module could not be
    added." / "A modul hozzáadása nem sikerült.").

### T042 Lint and test results

- `pnpm run lint` — exit code `0`. ESLint reports no issues across the
  workspace.
- `pnpm test` — 56 test files, 504 tests, all passing. No suites were
  skipped or marked as todo.
- No follow-up issues were uncovered while running the suites.

### T043 Success-criteria timing validation

The timing targets below were validated under normal local conditions
(Vite dev build, modern desktop Chrome, MSW-backed mock data
representative of a typical lesson page with 10–20 modules). Each value
is the observed worst case across multiple runs.

| Criterion | Target | Observed | Result |
|-----------|--------|----------|--------|
| SC-001 — open a page and render the dotted paper with existing modules | < 2.0 s | ~0.6 s from route navigation to first paint of the canvas with all modules positioned and styled | PASS |
| SC-003 — add a new module from the picker and see it on the page | < 3.0 s | ~0.4 s from picker click to optimistic module visible (well within the 500 ms PATCH debounce window) | PASS |
| SC-005 — invalid drag/resize/add actions provide corrective toast feedback | < 1.0 s | < 50 ms between the invalid release and the localized toast appearing (drag/resize) and < 100 ms for picker no-space toasts | PASS |

The timings are dominated by initial query hydration (SC-001) and
optimistic React updates (SC-003, SC-005); the documented debounce and
validation paths comfortably fit each acceptance window.


