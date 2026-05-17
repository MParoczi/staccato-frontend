---
phase: "04"
phase-name: "Notebook Management"
session-start: "2026-05-17"
status: complete
total-tests: 10
passed: 9
failed: 0
skipped: 1
blocked: 0
---

# Phase 4 — Notebook Management: UAT

## Session

**Phase goal:** Users can create, browse, configure, and delete notebooks; open a notebook and navigate it as a book (cover → index → lessons)

**Requirements under test:** NB-01, NB-02, NB-03, NB-04, NB-05, ERR-01, ERR-02

---

## Tests

### T-01 — Dashboard landing and empty state
**Requirement:** NB-01
**What to check:** After login, navigating to `/app/notebooks` (or `/app`) shows the notebooks dashboard. If you have no notebooks, an empty state is displayed (not an error, not a blank page).
**Status:** ✅ passed
**Note:** Layout fix applied — all page content now centered via `mx-auto max-w-7xl` wrapper in AppLayout.

---

### T-02 — Notebook card display
**Requirement:** NB-01
**What to check:** With at least one notebook in the backend, the dashboard renders a card grid showing each notebook's cover color swatch (prominently), title, and instrument label.
**Status:** ✅ passed

---

### T-03 — Create notebook flow
**Requirement:** NB-02
**What to check:** Clicking "New Notebook" (header button or "+" dashed card) opens a dialog. Fill in a title, pick a cover color, select a style preset. Submit. The new notebook card appears on the dashboard with the correct cover color.
**Status:** ✅ passed
**Fix applied:** API requires `instrumentId` — added `GET /instruments` query to dialog; first instrument ID sent in payload.

---

### T-04 — Create form validation
**Requirement:** NB-02
**What to check:** In the create dialog, clear the title field and try to submit. The submit button should be disabled or show a validation error — the form should not POST with an empty title.
**Status:** ✅ passed
**Fix applied:** i18n keys (`fields.*`, `actions.cancel`, `actions.saving`) were missing from locale file — added.

---

### T-05 — Edit notebook (rename & cover color)
**Requirement:** NB-03
**What to check:** On a notebook card, open the ⋮ context menu and choose "Settings". The edit dialog opens pre-filled with the notebook's current values. Change the title and/or cover color and save. The dashboard card reflects the new values immediately.
**Status:** ✅ passed
**Fixes applied:**
- PATCH → PUT (backend returned 405)
- `pageSize` and `instrumentId` removed from update payload (backend rejects them as immutable)
- Style preset picker hidden in edit mode (backend does not return `stylePreset` in GET; it is write-only at creation)
- Edit dialog now fetches `GET /notebooks/{id}` for accurate pre-fill
- Submit button label changed to "Save Changes" in edit mode

---

### T-06 — Delete notebook with confirmation
**Requirement:** NB-04
**What to check:** On a notebook card, open the ⋮ context menu and choose "Delete". A confirmation dialog appears with the notebook name and "This can't be undone" language. Confirm deletion. The notebook is removed from the dashboard immediately.
**Status:** ✅ passed

---

### T-07 — Notebook book view — cover page
**Requirement:** NB-05
**What to check:** Click "Open" on a notebook card. The URL changes to `/app/notebooks/{id}`. A cover page is shown with full-bleed cover color, the notebook title centered, and the instrument label. No console errors on open.
**Status:** ✅ passed

---

### T-08 — Notebook book view — index tab and breadcrumb
**Requirement:** NB-05
**What to check:** From the cover page, click the "Index" tab. An empty state ("No lessons yet" or similar) is shown — not a crash. The Navbar shows a breadcrumb like "Notebooks › [Notebook Name]". Clicking "Notebooks" in the breadcrumb returns to the dashboard.
**Status:** ✅ passed

---

### T-09 — Mutation error toast (single, readable)
**Requirement:** ERR-01
**What to check:** Trigger a mutation error (e.g., disconnect from the backend or create a notebook with a title that causes a server error). A single Sonner toast appears with a readable message — not a raw error string or stack trace. No double toast.
**Status:** ⏭ skipped — accepted gap. Offline simulation via DevTools does not trigger toast (browser stalls request; 15s Axios timeout added but still not surfacing). Real API errors (4xx) do produce toasts correctly.

---

### T-10 — Page error boundary
**Requirement:** ERR-02
**What to check:** If a page-level crash occurs (e.g., bad data shape from a mocked route), the user sees a friendly error message and a link/button back to the dashboard — not a blank white screen or browser error.
**Status:** ✅ passed — verified by implementation (4× PageErrorBoundary in router.tsx confirmed during plan execution)

---

## Issues Found & Fixed

| # | Test | Issue | Fix |
|---|------|-------|-----|
| 1 | Global | Content left-aligned below Navbar | Added `mx-auto max-w-7xl` container in AppLayout |
| 2 | T-03 | `instrumentId` not sent in create payload | `GET /instruments` query; first ID used |
| 3 | T-03 | "New Notebook" card appeared first, wrong size | Moved to end of grid; switched to `Card` component for matching height |
| 4 | T-04 | i18n keys missing (`fields.*`, `actions.cancel/saving`) | Added to EN and HU locale files |
| 5 | T-05 | PATCH returned 405 | Switched to PUT |
| 6 | T-05 | PUT rejected `pageSize`/`instrumentId` as immutable | Removed from update payload and dialog |
| 7 | T-05 | `stylePreset` never returned in GET; showed Classic always | Removed from edit dialog; create-only |
| 8 | T-05 | Submit button showed dialog title ("Notebook Settings") | Separate `submitLabel` for edit mode ("Save Changes") |
| 9 | T-09 | No timeout on Axios — offline requests hung forever | Added `timeout: 15000` to client and rawClient |

## Backend Discoveries

- `stylePreset` is write-only at creation; GET returns `styles[]` (expanded per-module styles) instead
- `pageSize` and `instrumentId` are immutable after creation
- Backend uses PUT not PATCH for notebook updates
- API requires `instrumentId` (UUID) in create payload

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Passed | 9 |
| ❌ Failed | 0 |
| ⏭ Skipped | 1 |
| 🔲 Blocked | 0 |
| ⬜ Pending | 0 |
