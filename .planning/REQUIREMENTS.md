# v0.4 Requirements — Notebook Management

## Milestone

**Name:** v0.4 — Notebook Management
**Goal:** Users can create, browse, configure, and delete notebooks; open a notebook and navigate it as a book (cover → index)
**Phases in Scope:** Phase 4 (Notebook Management)
**Generated:** 2026-05-16
**Spec source:** v2.1 (2026-05-15) — authoritative; no backend changes in scope

---

## Requirements

### NB-01 — Notebook Dashboard

Users can see all their notebooks on a dashboard page at `/app/notebooks` after logging in. Each notebook card shows cover color, title, instrument, and page size. An empty state is displayed when no notebooks exist.

**Priority:** Must-have
**Acceptance:**
- `GET /notebooks` is called on mount and result rendered as notebook cards
- Dashboard renders with correct cover color swatch, title, instrument label, and page size per notebook
- Empty state UI is shown when the list is empty (not an error)
- Dashboard is the default landing after login (redirect from `/app`)

---

### NB-02 — Create Notebook

Users can create a new notebook via a modal/dialog. Required fields: title. Optional fields: instrument (guitar is the only available option for now; defaults to guitar), page size (select; defaults to user's `defaultPageSize` profile preference), cover color (palette picker), style preset (system presets only: Classic, Colorful, Dark, Minimal, Pastel).

**Priority:** Must-have
**Acceptance:**
- `POST /notebooks` sends correct payload on submit
- Newly created notebook appears on the dashboard immediately (optimistic or cache-invalidated)
- Form validates: title is required; submit is disabled while request is in flight
- Cover color palette renders selectable swatches; chosen color is applied to the created notebook's card

---

### NB-03 — Rename & Reconfigure Notebook

Users can rename a notebook and change its cover color from a settings panel accessible within the notebook view (and optionally via a context menu on the dashboard card). Changes are reflected on the dashboard immediately.

**Priority:** Must-have
**Acceptance:**
- `PATCH /notebooks/{id}` sends updated title and/or cover color
- Dashboard card reflects the new title and cover color without a full page reload
- TanStack Query cache is invalidated or updated optimistically after mutation success

---

### NB-04 — Delete Notebook

Users can delete a notebook from the dashboard or notebook settings. Deletion is permanent — no undo, no trash. A confirmation step (dialog) is presented before the delete request is sent.

**Priority:** Must-have
**Acceptance:**
- Confirmation dialog is required before `DELETE /notebooks/{id}` is called
- Notebook is removed from the dashboard immediately after deletion
- Navigating to a deleted notebook's URL shows a not-found / error state, not a crash

---

### NB-05 — Notebook Book View

When a user opens a notebook (`/app/notebooks/{id}`), the cover page renders first. An index page tab/section is accessible from the notebook view. Lessons are not rendered yet (Phase 5); the index is empty but structurally present.

**Priority:** Must-have
**Acceptance:**
- Route `/app/notebooks/{id}` renders the notebook cover (title, instrument, cover color)
- Index page/section is navigable from the notebook view with an empty state
- No console errors or crashes on first open with a brand-new notebook
- Browser back button returns to the dashboard

---

### ERR-01 — Mutation Error Toasts

API mutation failures (create, rename, delete) display a Sonner toast. Each failure produces exactly one toast — no double-toasting on retry or optimistic rollback failure. Toast messages are user-readable (not raw API error strings or stack traces).

**Priority:** Must-have
**Acceptance:**
- Create / rename / delete failures each produce exactly one Sonner toast
- Toast copy is derived from the API's RFC 7807 `detail` field or a sensible fallback string
- No unhandled promise rejections in the console on mutation failure

---

### ERR-02 — Page Error Boundary

A `PageErrorBoundary` component wraps all page-level routes under `/app`. If a page crashes (rendering error, bad data shape), the user sees a friendly recovery UI instead of a blank screen.

**Priority:** Must-have
**Acceptance:**
- A deliberate `throw` inside the dashboard or notebook view renders the error boundary UI, not a white screen
- Error boundary displays a message and a link/button to navigate back to the dashboard
- Error boundary does not affect other routes (error is contained to the crashing page)

---

## Success Criteria

1. User can create a notebook (title, instrument, page size, cover color) and see it appear on the dashboard with the correct cover color and metadata.
2. User can open a notebook and see the cover page first, followed by the (empty) index page.
3. User can rename a notebook and change its cover color from notebook settings; changes reflect immediately in the dashboard.
4. User can delete a notebook and see it removed from the dashboard; deletion is permanent (no undo prompt).
5. Sonner toast notifications appear correctly for mutation errors (not double-toasted); `PageErrorBoundary` catches page-level crashes without a white screen.

---

## API Contracts (v2.1 Spec — Ground Truth)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /notebooks` | List | All notebooks for authenticated user |
| `POST /notebooks` | Create | New notebook with metadata |
| `GET /notebooks/{id}` | Read | Notebook details + cover |
| `PATCH /notebooks/{id}` | Update | Rename and/or change cover color |
| `DELETE /notebooks/{id}` | Delete | Permanent deletion |

No backend changes are in scope. If endpoint shapes differ from this table at runtime, treat them as risk items and adapt the API module accordingly.

---

## Out of Scope (v0.4)

- Lessons and pages (Phase 5)
- Canvas and module placement (Phase 6+)
- Style editor drawer and user-saved presets (Phase 10)
- Notebook index physical page content (Phase 11)
- PDF export (Phase 11)
- Hungarian localization for new strings (Phase 12 — add HU stubs only)
- Custom style preset creation/editing (system presets selectable at creation; no editing UI in this phase)
- Realtime multi-user editing (out of v1 scope entirely)
