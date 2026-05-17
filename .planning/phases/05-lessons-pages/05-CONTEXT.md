# Phase 5: Lessons & Pages - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create and manage lessons within a notebook, navigate between lesson pages using a page-flip shell, add/delete pages with a soft 10-page warning, and see correct global page numbers. The canvas (Phase 6) is out of scope — lesson pages in this phase display a dotted-grid placeholder. Notebook index TOC (Phase 11) is out of scope.

In scope: LES-01, LES-02, LES-03, LES-04, PAGE-01, PAGE-02

</domain>

<decisions>
## Implementation Decisions

### Route Structure
- **D-01:** `LessonsPage` is nested under `NotebookPage` as a router child (`{ path: 'lessons', element: <LessonsPage /> }`). The Cover/Index/Lessons tab bar remains visible on the lesson list — consistent with cover and index tab behavior.
- **D-02:** `LessonPage` (individual lesson view) is a **sibling route**, NOT nested under `NotebookPage`. Route: `notebooks/:id/lessons/:lessonId` at the same level as `notebooks/:id`. This gives the lesson full-screen real estate for Phase 6 canvas.
- **D-03:** Navbar breadcrumb when inside `LessonPage`: **Notebooks › [Notebook Name] › [Lesson Title]**. "Notebooks" links to `/app/notebooks`; "[Notebook Name]" links to `/app/notebooks/:id/lessons` (the lesson list). Breadcrumb detection: `useMatch('/app/notebooks/:id/lessons/:lessonId')` in `Navbar.tsx`.
- **D-04:** `LessonPage` cannot use `useOutletContext` from `NotebookPage` (sibling route). It must query the notebook independently via `useQuery(['notebooks', id])` — TanStack Query cache will already have the data from the lesson list visit.

### Lesson List Design
- **D-05:** Lessons displayed as **vertical list rows** (not a card grid). Clean, scales to many lessons, easy to scan — consistent with the physical notebook index metaphor.
- **D-06:** Each lesson row shows: **lesson title + page count** (e.g., "Lesson 1 — 3 pages"). Global page start is not shown on the list — visible on the lesson view itself.
- **D-07:** Each lesson row has a **⋮ context menu** (`DropdownMenu` component) in the right corner. Menu items: Open, Rename, Delete. Consistent with Phase 4 notebook card ⋮ menu pattern.
- **D-08:** Rename opens a **small dialog** with a pre-filled title input and Save/Cancel buttons. Uses `Dialog` + `react-hook-form` + `zod` (title required). Same pattern as Phase 4 edit forms. Does NOT use inline edit.

### Create Lesson Flow
- **D-09:** Create via **modal dialog** triggered by a "New Lesson" button. Uses `Dialog` + `react-hook-form` + `zod`. Title is required; form validates before submit; submit button disabled while in flight.
- **D-10:** **Two entry points** for creating: a "New Lesson" header button (top-right of LessonsPage) AND a dashed first-slot row in the list ("+ New Lesson"). Both trigger the same dialog. Consistent with Phase 4 notebook dashboard pattern (D-03).
- **D-11:** After successful creation, **auto-navigate** to the new lesson at `/app/notebooks/:id/lessons/:lessonId`. The user created the lesson to work on it — take them there immediately. `useNavigate` after `onSuccess` in the mutation.

### LessonPage Controls Layout
- **D-12:** A **top controls bar** sits directly below the Navbar in `LessonPage`. Layout (left to right): [← Lessons back link] | [Lesson Title] | [Page X of Y] | [Notebook p. N] | [‹ Prev] [› Next] | [+ Add page] [🗑 Delete page]. All page controls in one bar — leaves the entire content area below free for the Phase 6 canvas.
- **D-13:** The **Delete page button is disabled** when `pageCount === 1`. If the backend returns 4xx on last-page delete (fallback), show a Sonner error toast.
- **D-14:** After adding a page, **navigate to the new page** (last page). After deleting a page, navigate to the previous page (or page 1 if deleting page 1). Page index is 1-based; navigate by updating a `page` state variable (or URL param — planner's discretion).
- **D-15:** Canvas placeholder: **dotted-grid CSS background**, empty, no text. The characteristic dotted notebook paper pattern fills the content area. Implemented as a CSS background-image with radial-gradient dots — no image assets, no "coming soon" copy. Remove this placeholder entirely in Phase 6 when the real canvas is added.

### Claude's Discretion
- Exact proportions and spacing of the top controls bar (font size, button sizes, separator placement)
- Dotted-grid CSS implementation: dot size, spacing (recommend ~24px grid), color (muted, low opacity against paper-white background)
- Empty state design for LessonsPage (no lessons yet): icon, heading, CTA wording
- Whether page navigation (`‹ Prev` / `› Next`) is implemented via local React state (current page index) or a URL search param (e.g., `?page=2`) — URL param preferred for shareable/bookmarkable URLs but local state is acceptable for Phase 5

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements & API Contracts
- `.planning/REQUIREMENTS.md` — LES-01–04, PAGE-01–02 with acceptance criteria and endpoint specs (open questions Q1–Q4 must be resolved against swagger before planning)
- `.planning/swagger.json` — Authoritative API contract; verify `Lesson` and `LessonPage` response shapes and HTTP status for last-page delete before writing plans

### Project Constraints & Prior Decisions
- `.planning/PROJECT.md` — TypeScript constraints (erasableSyntaxOnly, verbatimModuleSyntax), navigation rules (React Router only, never window.location.href), XSS rules, cross-feature import rules, auth token rules
- `.planning/phases/04-notebook-management/04-CONTEXT.md` — Phase 4 decisions (D-01–D-17); especially delete dialog pattern (D-11), tab navigation (D-13), TanStack Query mutation pattern (D-17), breadcrumb (D-15)

### Roadmap
- `.planning/ROADMAP.md` — Phase 5 goal and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/dialog.tsx` — Reuse for CreateLessonDialog, RenameLessonDialog, DeleteLessonDialog
- `src/components/ui/dropdown-menu.tsx` — ⋮ context menu on each lesson row (same usage as notebook card ⋮ menu)
- `src/components/ui/sonner.tsx` — Mutation error toasts and 10-page soft warning toast (already configured)
- `src/components/ui/skeleton.tsx` — Loading state while `GET /notebooks/:id/lessons` is in flight
- `src/components/ui/button.tsx` — Top controls bar actions (Add page, Delete page, Prev, Next)
- `src/features/notebooks/components/DeleteNotebookDialog.tsx` — Direct template for `DeleteLessonDialog`; copy the pattern (useMutation + extractErrorMessage + Dialog structure)

### Established Patterns
- `src/features/notebooks/api/notebooksApi.ts` → Template for `src/features/lessons/api/lessonsApi.ts`; feature-scoped API module, all calls via shared `src/api/client.ts`
- TanStack Query `useQuery(['lessons', notebookId])` + `useMutation` with `queryClient.invalidateQueries` on success
- `extractErrorMessage` inline per component (prevents double-toast; already used in DeleteNotebookDialog)
- `react-hook-form` + `zod` for validated forms; `zodResolver` wires validation; title required + trimmed
- `as const` unions for any new type unions (erasableSyntaxOnly — no enum)
- `import type { … }` for all type-only imports (verbatimModuleSyntax)
- HU stub keys: add i18n keys to `public/locales/hu/lessons.json` (stubs, not full translations — deferred to Phase 12)

### Integration Points
- `src/router.tsx` — Add `{ path: 'lessons', element: <LessonsPage /> }` as child of `notebooks/:id`; add `{ path: 'notebooks/:id/lessons/:lessonId', element: <PageErrorBoundary><LessonPage /></PageErrorBoundary> }` as a sibling (not nested)
- `src/pages/NotebookPage.tsx` — Enable the Lessons tab: remove `disabled: true` from the lessons tab entry in the `tabs` array; the `lessons` NavLink will now resolve to LessonsPage
- `src/components/Navbar.tsx` — Add 3-level breadcrumb detection: `useMatch('/app/notebooks/:id/lessons/:lessonId')` shows "Notebooks › [Notebook Name] › [Lesson Title]"; "[Notebook Name]" links to the lesson list
- `src/types/index.ts` — Add `Lesson`, `LessonPage`, `CreateLessonPayload`, `UpdateLessonPayload` types here (consistent with Notebook types location)

</code_context>

<specifics>
## Specific Ideas

- The dashed "+" first row in the lesson list should visually match the other rows in height/padding but use a dashed border and muted label "New Lesson" — same design language as the Phase 4 dashed notebook card.
- The dotted-grid canvas placeholder: implement as `background-image: radial-gradient(circle, var(--muted-foreground) 1px, transparent 1px); background-size: 24px 24px;` on a paper-white container. Low opacity to feel like physical notebook paper.
- The ‹ Prev button should be disabled on page 1; › Next should be disabled on the last page.
- The "Add page" button should remain enabled above 10 pages (soft warning is a toast, not a block — per PAGE-01).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Lessons & Pages*
*Context gathered: 2026-05-17*
