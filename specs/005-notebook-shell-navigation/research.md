# Research: Notebook Shell & Navigation

**Feature**: 005-notebook-shell-navigation  
**Date**: 2026-04-05

## R-001: NotebookLayout as a route-level layout with shared data

**Decision**: Use React Router v7's nested layout routing. Create a `NotebookLayout` component that wraps all `/app/notebooks/:notebookId/*` sub-routes. The layout fetches `NotebookDetail` via TanStack Query (`useNotebook(notebookId)`) and renders the toolbar, sidebar, and `<Outlet />` for child routes. Child routes access notebook data through TanStack Query cache (same query key) — no React context needed.

**Rationale**: TanStack Query cache deduplication means child components that call `useNotebook(notebookId)` get the cached data instantly without a redundant fetch. This is simpler than an explicit React context and follows Constitution Principle II (TanStack Query for all server state). The layout handles the loading/error states once, so child routes can assume data is available.

**Alternatives considered**:
- React context provider in layout → Rejected: adds ceremony and duplicates TanStack Query's caching. Constitution II explicitly prohibits duplicating server state outside TanStack Query.
- Fetch in each child route independently → Rejected: causes redundant loading states and potential layout shift.

## R-002: Page navigation state machine

**Decision**: Build a pure utility function `buildPageSequence(index: NotebookIndex, notebookId: string)` that returns an ordered array of `{ globalPageNumber, url, type, lessonId?, pageId? }` entries. The sequence is: `[cover, index, lesson1-page1, lesson1-page2, ..., lesson2-page1, ...]`. A `usePageNavigation` hook uses the current route params to find the current position and derive `prevUrl`/`nextUrl`.

**Rationale**: Separating the sequence builder as a pure function (in `utils/page-sequence.ts`) makes it easily unit-testable. The hook reads from TanStack Query cache for the NotebookIndex and memoizes the sequence. Navigation across lesson boundaries is handled by the linear array — no special boundary logic needed.

**Data source**: `GET /notebooks/{id}/index` returns `NotebookIndexEntry[]` with `{ lessonId, title, startPageNumber }`. Combined with `GET /lessons/{id}` (which returns `pages: LessonPage[]`), we can build the full sequence. However, to avoid fetching every lesson detail upfront, the index's `startPageNumber` plus the lessons list's `pageCount` is sufficient:
- Fetch `NotebookIndex` (has `startPageNumber` per lesson)
- Fetch lessons list via `GET /notebooks/{id}/lessons` (has `pageCount` per lesson)
- Derive: each lesson occupies `pageCount` pages starting at `startPageNumber`

**Alternatives considered**:
- Fetch all lesson details to get page IDs → Rejected: N+1 fetching problem; pageCount + startPageNumber is sufficient for navigation.
- Store navigation state in Zustand → Rejected: this is derived from server data, not client state.

## R-003: Page IDs for lesson page routes

**Decision**: The route `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId` requires actual page IDs. Since the NotebookIndex only gives `startPageNumber` per lesson (not individual page IDs), we need the lesson detail (`GET /lessons/{id}`) which includes `pages: LessonPage[]` with individual page IDs. Fetch lesson detail when navigating to a lesson's pages. The `useLesson(lessonId)` hook provides this. For the page sequence used by navigation arrows, we need page IDs — so we'll fetch the lessons list and then lazily fetch lesson details as the user navigates.

**Rationale**: Eager fetching all lesson details on notebook open would be wasteful. Instead, prefetch the next/previous lesson detail when the user is near a boundary. TanStack Query's `prefetchQuery` makes this straightforward.

**Alternatives considered**:
- Include page IDs in the NotebookIndex response → Not available from the backend. The index only has lesson-level entries.
- Use page numbers instead of page IDs in URLs → The route spec requires `:pageId` (UUID), not page numbers.

## R-004: Dotted paper background component

**Decision**: Create a `DottedPaper` component in `src/components/common/` that renders a CSS radial-gradient background. It accepts the notebook's `pageSize` and the current zoom level, and renders at the correct aspect ratio using `PAGE_SIZE_DIMENSIONS`. The dot spacing = one grid unit = `(containerWidth / gridWidth)` pixels, scaled by zoom. The component uses the existing `--notebook-paper` and `--notebook-dot` CSS variables for colors.

**Rationale**: CSS radial-gradient is hardware-accelerated and performs well at any zoom level. No canvas or SVG needed. The component is reusable for Feature 7 (canvas editor) and the index page.

**CSS approach**:
```css
background-color: var(--notebook-paper);
background-image: radial-gradient(circle, var(--notebook-dot) 1px, transparent 1px);
background-size: {dotSpacing}px {dotSpacing}px;
```

The container renders at the page's aspect ratio (e.g., A4 = 42:59) centered in the viewport. The actual pixel size is computed from available viewport space while maintaining the ratio.

**Alternatives considered**:
- Canvas element with manually drawn dots → Rejected: more complex, worse performance for a static pattern, harder to theme.
- SVG pattern → Rejected: more markup, no benefit over CSS gradient.

## R-005: Sidebar implementation with shadcn/ui Sheet

**Decision**: Use the existing `shadcn/ui Sheet` component (`src/components/ui/sheet.tsx`) for the sidebar drawer. The sidebar slides in from the left. Its open/closed state is managed by the existing `useUIStore.sidebarOpen` Zustand state. The sidebar stays open during navigation (per clarification). Lesson list uses `useLessons(notebookId)` TanStack Query hook.

**Rationale**: Sheet is already in the component library. Using Zustand for open/closed state follows Constitution Principle II (client-only state in Zustand). The sidebar persists across page navigation because the `NotebookLayout` owns it — it doesn't unmount on child route changes.

**Alternatives considered**:
- Custom sidebar implementation → Rejected: Sheet provides accessibility (focus trap, escape to close, aria) out of the box.
- Dialog instead of Sheet → Rejected: Sheet is semantically correct for a persistent side panel.

## R-006: Keyboard navigation

**Decision**: Add a `useKeyboardNavigation` hook that listens for `keydown` events at the document level within the `NotebookLayout`. Left arrow = navigate to prevUrl, Right arrow = navigate to nextUrl. The handler checks `event.target` — if focus is on an `input`, `textarea`, or `[contenteditable]`, the handler is suppressed.

**Rationale**: Document-level listener ensures keyboard nav works regardless of focus position. Suppressing on input elements prevents conflicts with text editing (current feature's inline lesson title editing, and future Feature 8's content editing).

**Alternatives considered**:
- Listen on the canvas container only → Rejected: would require the container to be focused, which is not intuitive.
- Use React Router's `useBlocker` → Rejected: that's for blocking navigation, not triggering it.

## R-007: Canvas aspect ratio rendering

**Decision**: The canvas area renders as a fixed-aspect-ratio "page" using `PAGE_SIZE_DIMENSIONS`. Given the available viewport space (minus toolbar height), compute the max width/height that maintains the page's aspect ratio. Center the page in the viewport. Apply CSS `transform: scale(zoom)` for zoom, with `transform-origin: top center`. The container has `overflow: auto` to enable scrolling when zoomed in.

**Rationale**: Per clarification, the canvas renders at the physical page's aspect ratio (e.g., A4 = 42:59). CSS transform for zoom is performant and doesn't require re-layout of child elements.

**Alternatives considered**:
- Fit width always, scroll vertically → Rejected: doesn't match the "virtual page" metaphor specified.
- Use CSS `aspect-ratio` property → Can be combined with the transform approach for simpler sizing.

## R-008: Cover page text contrast

**Decision**: Auto-detect text color based on cover color luminance. Use a simple relative luminance calculation (WCAG formula). If luminance > 0.5, use dark text; otherwise, use light text (cream/off-white). This ensures readability regardless of the chosen cover color.

**Rationale**: The cover color palette includes both dark colors (navy, charcoal) and potentially lighter custom hex values. Fixed white or dark text would fail for some colors.

## R-009: Missing API functions — pages

**Decision**: Create `src/api/pages.ts` with two functions:
- `createPage(lessonId: string): Promise<LessonPageWithWarning>` — POST /lessons/{id}/pages
- `deletePage(lessonId: string, pageId: string): Promise<void>` — DELETE /lessons/{lessonId}/pages/{pageId}

Also add `LessonPageWithWarning` type to `src/lib/types/lessons.ts`:
```typescript
interface LessonPageWithWarning {
  page: LessonPage;
  warning?: string;
}
```

**Rationale**: The spec requires page CRUD. The backend's POST response includes a warning field when 10+ pages. The DELETE endpoint returns 204.

## R-010: Owner display name on cover page

**Decision**: The cover page shows the notebook owner's display name. `NotebookDetail` currently doesn't include `ownerDisplayName`. Two options: (a) add it to the type when the backend adds it, or (b) use the current user's display name from `useCurrentUser()` since users only view their own notebooks in v1.

**Decision**: Use `useCurrentUser()` to get the display name. The user profile hook is already active in the `AppLayout`. This avoids a backend change and is correct for the current scope (users only see their own notebooks).

**Rationale**: There's no multi-user notebook sharing in scope. Adding `ownerDisplayName` to the DTO can be done later if sharing is added.

## R-011: Lesson title validation

**Decision**: Lesson titles follow the same constraints as notebook titles: required, max 200 characters, whitespace-only rejected. Create a shared Zod schema `lessonTitleSchema` reusable for both create and inline edit.

**Rationale**: Consistent with the notebook title validation from Feature 004. The backend likely enforces the same constraints.

## R-012: Zoom level bounds and behavior

**Decision**: The existing `uiStore.setZoom` already clamps to 0.25–3.0. For the toolbar zoom buttons: increment/decrement by 0.1 (10%). Reset returns to 1.0. Zoom is not persisted across sessions (already the case — `partialize` only saves `theme`). Zoom resets to 1.0 when navigating to a different notebook.

**Rationale**: The existing store already handles clamping. 10% steps provide fine-grained control. Resetting on notebook change prevents confusing zoom persistence.

## R-013: Loading states for notebook pages

**Decision**: The `NotebookLayout` shows a full-page skeleton while `NotebookDetail` is loading. Individual pages (cover, index, lesson) show their own loading states:
- Cover: skeleton with color block and text placeholders
- Index: dotted paper background with skeleton lines for TOC entries
- Lesson page: dotted paper background with a spinner or skeleton

Page-to-page navigation within a cached notebook is instant (TanStack Query cache). Cross-lesson navigation that requires a new lesson detail fetch shows a brief loading spinner.

**Rationale**: Consistent with Feature 004's skeleton approach. TanStack Query caching ensures most navigations feel instant.
