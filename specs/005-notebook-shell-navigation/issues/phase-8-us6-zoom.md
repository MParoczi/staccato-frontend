# Phase 8: User Story 6 — Zoom Controls — GitHub Issues

> Users can zoom in, zoom out, and reset the canvas zoom level. Zoom affects only the canvas area.
>
> **Independent test:** Click zoom in/out buttons, verify canvas scales while toolbar and sidebar remain normal. Click reset, verify canvas returns to 100%. Verify zoom percentage displays in toolbar.

---

## Issue: T041 — Add zoom controls to toolbar

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-8`, `US6`

### Description

Update `src/features/notebooks/components/NotebookToolbar.tsx` to replace the zoom placeholder area with actual controls.

**Controls:**

- Zoom in: ZoomIn Lucide icon — `setZoom(zoom + 0.1)`
- Zoom out: ZoomOut Lucide icon — `setZoom(zoom - 0.1)`
- Reset: RotateCcw Lucide icon — `setZoom(1)`
- Display current zoom percentage as text between buttons (e.g., "100%")

Uses existing `useUIStore.zoom` and `useUIStore.setZoom` (already clamps 0.25-3.0).

### Acceptance Criteria

- [ ] Zoom in/out/reset buttons in toolbar
- [ ] Zoom percentage displayed between buttons
- [ ] Uses existing Zustand store state
- [ ] ZoomIn, ZoomOut, RotateCcw Lucide icons
- [ ] Clamped to 0.25-3.0 range (via existing store)

### Dependencies

- T013 (toolbar exists with placeholder)

### Parallel

No — modifies existing component.

---

## Issue: T042 — Wire zoom level into `DottedPaper` rendering

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-8`, `US6`

### Description

Update `src/routes/notebook-layout.tsx`:

- Pass `useUIStore.zoom` to the canvas container's transform
- Ensure `DottedPaper` in child routes receives current zoom for dot spacing calculation
- Canvas area: `transform: scale(zoom)` on the canvas container
- Toolbar, sidebar, and navigation arrows MUST NOT be affected by zoom (FR-020)

### Acceptance Criteria

- [ ] Zoom level from Zustand applied to canvas container
- [ ] DottedPaper receives zoom for dot spacing
- [ ] Toolbar remains at normal scale
- [ ] Sidebar remains at normal scale
- [ ] Navigation arrows remain at normal scale

### Dependencies

- T041 (zoom controls), T012 (DottedPaper), T015 (layout)

### Parallel

No — depends on T041.

---

## Issue: T043 — Add i18n keys for zoom controls

**Labels:** `i18n`, `005-notebook-shell-navigation`, `phase-8`, `US6`

### Description

Add translation keys to `src/i18n/en.json` and `src/i18n/hu.json` under `notebooks.shell.zoom.*`:

- "Zoom in" tooltip/aria-label
- "Zoom out" tooltip/aria-label
- "Reset zoom" tooltip/aria-label
- Zoom percentage format

### Acceptance Criteria

- [ ] English keys added to `src/i18n/en.json`
- [ ] Hungarian keys added to `src/i18n/hu.json`
- [ ] All zoom control strings covered

### Dependencies

- T041 (to know which strings are needed)

### Parallel

Yes — can be added in parallel with T041, T042.
