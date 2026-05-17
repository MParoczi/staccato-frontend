# Phase 4: Notebook Management - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create, browse, configure, and delete notebooks. Opening a notebook shows a cover page and an (empty) index page. The dashboard is the primary workspace after login. Lessons are out of scope (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- **D-01:** Notebook cards displayed in a responsive grid (2–3 columns). Reuse existing `Card` component — consistent with shadcn radix-nova style.
- **D-02:** Each card shows: large cover color swatch (prominently), notebook title, and instrument label. No lesson count or page size on the card.
- **D-03:** "New Notebook" action lives in TWO places: a persistent header button (top-right of page) AND a dashed first-slot card in the grid ("+ New Notebook"). Both trigger the same create dialog.
- **D-04:** Empty state (no notebooks): centered icon/illustration, "No notebooks yet" heading, "Create your first notebook" CTA button.

### Create Notebook Flow
- **D-05:** Create form is a **Modal Dialog** (reuse existing `Dialog` component). No navigation away from the dashboard.
- **D-06:** Create dialog shows **all fields**: title (required), cover color, instrument, page size, and style preset. Page size defaults to the user's `defaultPageSize` profile preference.
- **D-07:** Cover color = **fixed palette of swatches** (8–12 preset colors). Claude picks the palette colors. Simple clickable swatches — no free hex input.
- **D-08:** Style preset = **visual thumbnail picker** showing small CSS-generated previews of the 5 system presets (Classic, Colorful, Dark, Minimal, Pastel). Not a plain select dropdown. Thumbnails should be styled mini-cards, not external image assets.

### Notebook Settings Access
- **D-09:** Dashboard cards each have a **⋮ context menu** (`DropdownMenu` component) in the top-right corner. Menu items: Open, Settings, Delete.
- **D-10:** "Settings" opens an **Edit Dialog** — same structure as the create dialog but pre-filled with current notebook values. All fields editable (title, cover color, instrument, page size, style preset).
- **D-11:** "Delete" in context menu → opens a **confirmation dialog** ("Delete '[Name]'? This can't be undone.") with Cancel and Delete buttons. On confirm, sends DELETE request, removes notebook from dashboard (cache invalidation), no undo.

### Book View Structure
- **D-12:** Cover page: **full-bleed cover color** fills the page background. Notebook title is large and centered. Instrument label sits below the title. No other metadata. Matches the physical notebook cover metaphor.
- **D-13:** Navigation between cover and index: **horizontal tab bar** directly below the Navbar (`Cover | Index | Lessons…`). "Lessons…" tab is visible but disabled or shows a future-coming label in Phase 4. Tabs are the primary nav within a notebook.
- **D-14:** Index tab in Phase 4: **empty state only** — "No lessons yet" message with a short placeholder. No interactive actions (lesson creation is Phase 5). Not skeleton loaders — just an honest empty state.
- **D-15:** Returning to dashboard: **Navbar gains a breadcrumb** when inside a notebook — "Notebooks › [Notebook Name]". Clicking "Notebooks" navigates to `/app/notebooks`. Navbar breadcrumb is only shown on notebook routes, not on the dashboard itself.

### Error Handling
- **D-16:** `PageErrorBoundary` wraps each page-level route (one per route, not one global boundary). Renders a friendly message + "Go back to notebooks" link on crash. Does not affect other routes.
- **D-17:** Mutation errors (create / update / delete) show a single Sonner toast. Error message derived from RFC 7807 `detail` field or a sensible fallback. No double-toasting.

### Claude's Discretion
- Color palette values (hex codes for the 8–12 cover color swatches) — pick a visually balanced set
- Style preset thumbnail CSS implementation — rendered as mini styled `div`s, not image files
- Exact breakpoints for the 2–3 column grid
- Notebook route structure: `/app/notebooks` (dashboard), `/app/notebooks/:id` (book view), `/app/notebooks/:id/cover` and `/app/notebooks/:id/index` as nested tabs or query-param driven

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — NB-01–05, ERR-01–02 with acceptance criteria and API contracts (ground truth for endpoints)

### Project Constraints & Decisions
- `.planning/PROJECT.md` — TypeScript constraints (erasableSyntaxOnly, verbatimModuleSyntax), auth token rules, navigation rules (React Router only), XSS rules, package constraints
- `.planning/ROADMAP.md` — Phase 4 goal and success criteria (5 criteria)

### No external specs
No external ADRs or design docs exist for this phase. Requirements are fully captured above and in REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx` — Use as the base for notebook cards on the dashboard
- `src/components/ui/dialog.tsx` — Use for create dialog, edit dialog, and delete confirmation dialog
- `src/components/ui/dropdown-menu.tsx` — Use for the ⋮ context menu on each notebook card
- `src/components/ui/sonner.tsx` — Already configured; use `toast.error()` for mutation errors
- `src/components/ui/select.tsx` — Use for instrument and page size dropdowns in the create/edit dialog
- `src/components/ui/badge.tsx` — Optional for instrument label on notebook cards
- `src/components/ui/skeleton.tsx` — Use for loading state while `GET /notebooks` is in flight

### Established Patterns
- `src/features/profile/api/profileApi.ts` — Template for `src/features/notebooks/api/notebooksApi.ts`; typed async functions, single `client` import
- `src/components/AppLayout.tsx` — TanStack Query `useQuery` + `useEffect` → `authStore.updateUser` pattern; reuse `useQuery`/`useMutation` for notebook data
- `src/stores/authStore.ts` — Do NOT use for notebook state; notebooks are server state (TanStack Query only)
- `src/types/index.ts` — Add `Notebook`, `NotebookPageSize`, `NotebookStylePreset`, `CreateNotebookPayload`, `UpdateNotebookPayload` types here

### Integration Points
- `src/router.tsx` — Add `/app/notebooks/:id` route (book view) with nested child routes for cover and index tabs; keep dashboard at `/app/notebooks`
- `src/components/Navbar.tsx` — Add breadcrumb display logic when `useMatch('/app/notebooks/:id*')` is truthy; show "Notebooks › [name]" link row
- `src/pages/NotebooksPage.tsx` — Full replacement (current file is a logout stub only)
- New files needed: `src/pages/NotebookPage.tsx` (book view), `src/features/notebooks/api/notebooksApi.ts`, possibly `src/features/notebooks/components/` for card, dialogs

</code_context>

<specifics>
## Specific Ideas

- Style preset visual thumbnail: render as a small `div` (e.g., 48×36px) with CSS that approximates the preset's feel — e.g., Classic = light neutral background, Colorful = accent color blocks, Dark = dark bg with light text. No image assets.
- Cover page full-bleed: the notebook's cover color becomes the page background. Text (title + instrument) is overlaid with contrast-safe text color (auto-detect light/dark based on luminance).
- The dashed "+" first card in the grid should visually match the other cards in size/shape but use a dashed border and muted "New Notebook" label.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Notebook Management*
*Context gathered: 2026-05-17*
