# Requirements: v0.5 — Phase 5: Lessons & Pages

**Milestone:** v0.5 Lessons & Pages
**Phase:** 5
**Status:** Active
**Created:** 2026-05-17

---

## Scope

Phase 5 delivers lesson CRUD within a notebook, multi-page lesson management, and correct global page numbering across the notebook. The canvas (Phase 6) is out of scope — lesson pages in this phase display a placeholder content area.

**In scope:** LES-01, LES-02, LES-03, LES-04, PAGE-01, PAGE-02
**Out of scope:** Canvas/module placement (Phase 6), building block editors (Phase 7+), notebook index page TOC (Phase 11)

---

## API Contracts

All endpoints use the shared Axios instance at `src/api/client.ts`. Full spec: `.planning/swagger.json`.

### Lessons

| Method | Endpoint | Request Body | Notes |
|--------|----------|--------------|-------|
| `GET` | `/notebooks/{id}/lessons` | — | Returns `Lesson[]` ordered by `createdAt` asc |
| `POST` | `/notebooks/{id}/lessons` | `CreateLessonRequest` | Creates lesson; backend auto-creates first page |
| `GET` | `/lessons/{id}` | — | Returns single `Lesson` |
| `PUT` | `/lessons/{id}` | `UpdateLessonRequest` | Rename only |
| `DELETE` | `/lessons/{id}` | — | Cascades: deletes all pages and modules |

### LessonPages

| Method | Endpoint | Request Body | Notes |
|--------|----------|--------------|-------|
| `GET` | `/lessons/{id}/pages` | — | Returns `LessonPage[]` ordered by `pageNumber` asc |
| `POST` | `/lessons/{id}/pages` | — | No body; appends a new blank page |
| `DELETE` | `/lessons/{lessonId}/pages/{pageId}` | — | Backend rejects if last page (422 or 400) |

### Request Schemas (from swagger)

```typescript
// POST /notebooks/{id}/lessons
interface CreateLessonRequest {
  title?: string | null
}

// PUT /lessons/{id}
interface UpdateLessonRequest {
  title?: string | null
}
```

### Assumed Response Shapes

The swagger does not define response schemas. These are assumed from backend patterns and must be verified at plan time against a running backend or backend source.

```typescript
interface Lesson {
  id: string            // UUID
  notebookId: string    // UUID
  title: string
  pageCount: number     // total pages in this lesson
  globalPageStart: number  // first global page number for this lesson
  createdAt: string     // ISO 8601
  updatedAt: string     // ISO 8601
}

interface LessonPage {
  id: string            // UUID
  lessonId: string      // UUID
  pageNumber: number    // 1-based position within the lesson
  globalPageNumber: number  // notebook-wide: cover=1, index=2, lesson pages start at 3
  createdAt: string
}
```

**Global page numbering formula (frontend display):**
- Cover page = 1
- Index page = 2
- Lesson 1, page 1 = 3; page 2 = 4; …
- Lesson 2, page 1 = 3 + lesson1.pageCount; …

The backend is expected to return `globalPageNumber` on `LessonPage` and `globalPageStart` on `Lesson`. If these fields are absent, compute client-side from the ordered lesson list.

---

## Requirements

### LES-01 — Create Lesson

Users can create a lesson within a notebook. The lesson appears in the lesson list ordered by creation date. The first page is auto-created by the backend when the lesson is created.

**Acceptance:**
- `POST /notebooks/{id}/lessons` is called on form submit with `{ title }` payload
- Title is required; form validates before submit; submit button disabled while in flight
- Newly created lesson appears in the lesson list immediately (TanStack Query cache invalidated)
- Lessons are displayed in `createdAt` ascending order (oldest first)
- The new lesson navigates the user to the lesson view (or the list scrolls to reveal it)
- First page exists on the lesson without a separate page-creation step (backend guarantees this)

**Feature scope:** `LessonsPage` (lesson list at `/app/notebooks/:id/lessons`), `CreateLessonDialog` or inline form, `lessonsApi.createLesson`

---

### LES-02 — Rename Lesson

Users can rename a lesson. The updated title is reflected immediately in the lesson list.

**Acceptance:**
- `PUT /lessons/{id}` is called with `{ title }` payload
- Title is required; empty title is not submitted
- Lesson list reflects the new title without a full page reload (TanStack Query cache updated)
- Rename can be triggered from the lesson list row (inline edit or dialog)
- Mutation errors show exactly one Sonner toast (consistent with ERR-01 pattern from v0.4)

**Feature scope:** Rename action in lesson list row, `lessonsApi.updateLesson`

---

### LES-03 — Delete Lesson

Users can delete a lesson. Deletion is permanent and requires confirmation. All pages and modules are removed by the backend (cascade).

**Acceptance:**
- A confirmation dialog is shown before `DELETE /lessons/{id}` is called
- Confirmation copy includes the lesson title and "This can't be undone" (consistent with v0.4 notebook delete)
- Lesson disappears from the list immediately after deletion (cache invalidated)
- If the user is currently viewing the deleted lesson, they are navigated back to the lesson list
- Mutation errors show exactly one Sonner toast

**Feature scope:** `DeleteLessonDialog`, `lessonsApi.deleteLesson`

---

### LES-04 — Lesson Navigation

Users can open a lesson and see a page navigation shell. Each lesson page is accessible via previous/next navigation. The lesson URL follows the pattern `/app/notebooks/:id/lessons/:lessonId`.

**Acceptance:**
- Clicking a lesson in the lesson list navigates to `/app/notebooks/:id/lessons/:lessonId`
- The lesson view shows: lesson title, current page number (e.g. "Page 1 of 3"), previous/next page buttons
- The current page's global page number is displayed (e.g. "Notebook p. 5")
- An empty canvas placeholder is shown for the page content area (canvas implemented in Phase 6)
- Back navigation returns to the lesson list
- The "Lessons" tab in `NotebookPage.tsx` is enabled (remove `disabled: true`)

**Routing additions:**
```
/app/notebooks/:id/lessons          → LessonsPage (lesson list)
/app/notebooks/:id/lessons/:lessonId → LessonPage (page navigation shell)
```

**Feature scope:** `LessonsPage`, `LessonPage`, router update

---

### PAGE-01 — Add Page

Users can add a new page to a lesson. A soft warning toast appears when a lesson reaches 10 pages. The page count increments in the lesson list.

**Acceptance:**
- `POST /lessons/{id}/pages` is called when the user clicks "Add page"
- The new page appears immediately; the user is navigated to the new page
- The page counter in the lesson list row increments (TanStack Query invalidates `['lessons', notebookId]`)
- When a lesson reaches exactly 10 pages, a Sonner warning toast is shown: something like "This lesson has 10 pages — consider splitting it into multiple lessons"
- The "Add page" button remains enabled above 10 pages (warning is soft, not blocking)
- Add page button is visually associated with the lesson page navigation view

**Feature scope:** Add page button in `LessonPage`, `lessonPagesApi.addPage`

---

### PAGE-02 — Delete Page

Users cannot delete the last remaining page of a lesson. Global page numbers display correctly across multiple lessons.

**Acceptance:**
- `DELETE /lessons/{lessonId}/pages/{pageId}` is called when the user confirms page deletion
- The "Delete page" button is disabled (or hidden) when `pageCount === 1`
- If the backend returns a 4xx on last-page delete, a Sonner error toast is shown as fallback
- After deletion, the user is navigated to the previous page (or page 1 if on page 1)
- Global page numbers are recalculated and displayed correctly after page deletion
- The page counter in the lesson list decrements immediately (cache invalidated)

**Feature scope:** Delete page action in `LessonPage`, `lessonPagesApi.deletePage`

---

## Success Criteria

1. User can create a lesson within a notebook and see it appear in the lesson list ordered by creation date; the first page is auto-created
2. User can rename a lesson and see the title update in the lesson list immediately
3. User can delete a lesson with confirmation; the lesson and all its pages disappear from the list
4. User can add a second page to a lesson; a soft warning toast appears at 10 pages; the page counter increments
5. User cannot delete the last remaining page of a lesson (delete button disabled); global page numbers display correctly across multiple lessons

---

## Open Questions

| # | Question | Impact | Resolution |
|---|----------|--------|------------|
| Q1 | Does `POST /notebooks/{id}/lessons` auto-create the first page, or does the frontend need to call `POST /lessons/{id}/pages` immediately after? | LES-01 implementation | Verify against backend or source; default assumption: backend auto-creates |
| Q2 | Does `Lesson` response include `globalPageStart`? Or is global page computed client-side? | PAGE-02, LES-04 display | Verify response shape; fall back to client-side formula if absent |
| Q3 | Does `LessonPage` response include `globalPageNumber`? | LES-04, PAGE-02 | As above |
| Q4 | What HTTP status does the backend return when attempting to delete the last page? (400/422/409?) | PAGE-02 error handling | Determines whether frontend gate or backend error drives the UX |

---

## Assumptions

- Lessons are returned by `GET /notebooks/{id}/lessons` in `createdAt` ascending order (no client-side sort needed)
- The backend cascades deletes: `DELETE /lessons/{id}` removes all child pages and modules
- `POST /lessons/{id}/pages` requires no request body (blank page, no content)
- Global page formula: cover=1, index=2, lessons start at 3 and increment by `pageCount`
- The disabled "Lessons" tab in `NotebookPage.tsx` is the correct entry point; no routing restructure needed

---

_Created 2026-05-17 for v0.5 Phase 5 planning_
