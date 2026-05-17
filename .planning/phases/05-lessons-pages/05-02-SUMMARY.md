---
phase: 05-lessons-pages
plan: 02
subsystem: lessons-ui
tags: [lessons, dialogs, list-page, crud, react-query, react-hook-form]
dependency_graph:
  requires: [05-PLAN-01]
  provides: [CreateLessonDialog, RenameLessonDialog, DeleteLessonDialog, LessonsPage]
  affects: [src/features/lessons, src/pages]
tech_stack:
  added: []
  patterns: [react-hook-form+zod dialogs, useMutation+invalidateQueries, DropdownMenu for row actions]
key_files:
  created:
    - src/features/lessons/components/CreateLessonDialog.tsx
    - src/features/lessons/components/RenameLessonDialog.tsx
    - src/features/lessons/components/DeleteLessonDialog.tsx
    - src/pages/LessonsPage.tsx
  modified: []
decisions:
  - "extractErrorMessage defined inline in each dialog (not imported cross-feature) to satisfy cross-feature import rule"
  - "LessonsPage uses useParams<{ id: string }>() to extract notebookId from the route"
  - "Dashed first-slot row implemented as <button> element with border-dashed styling"
metrics:
  duration: ~12 minutes
  completed: 2026-05-17
---

# Phase 5 Plan 02: Lesson List UI Summary

Lesson list view and all three CRUD dialogs — fully matching the Phase 4 dialog/form patterns established in the notebooks feature.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | CreateLessonDialog | a5e4e6a | src/features/lessons/components/CreateLessonDialog.tsx |
| 2 | RenameLessonDialog | 58f98b1 | src/features/lessons/components/RenameLessonDialog.tsx |
| 3 | DeleteLessonDialog | e11bd25 | src/features/lessons/components/DeleteLessonDialog.tsx |
| 4 | LessonsPage | 510184f | src/pages/LessonsPage.tsx |

## What Was Built

**CreateLessonDialog** — title form with required validation, calls `createLesson`, invalidates `['lessons', notebookId]` cache, auto-navigates to the new lesson route via `useNavigate`. Shows `Loader2` spinner and disables buttons while mutation is pending.

**RenameLessonDialog** — same form pattern but pre-filled with `lesson.title` via `useEffect` reset on open. Calls `updateLesson`, invalidates lessons cache. No navigation — stays on lesson list.

**DeleteLessonDialog** — confirmation-only dialog modeled directly on `DeleteNotebookDialog`. Shows lesson title in heading and "This can't be undone" copy from locale. Destructive variant confirm button with spinner.

**LessonsPage** — lesson list page rendering:
- Header with page title and "New Lesson" button
- Dashed first-slot `<button>` row for zero-friction creation
- 3-row skeleton while `useQuery` is loading
- Empty state with `BookOpen` icon when `lessons.length === 0`
- Lesson rows with title (bold, truncated) and page count (muted), each with a `MoreHorizontal` dropdown (Open / Rename / Delete)
- All three CRUD dialogs wired with proper `useState` state

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundary changes introduced. All surfaces were accounted for in the plan's threat model:
- T-05-02-01: Lesson titles rendered via React JSX (escaped, no `dangerouslySetInnerHTML`)
- T-05-02-03: `enabled: !!notebookId` guard prevents query firing without a valid route param

## Self-Check: PASSED

- [x] `src/features/lessons/components/CreateLessonDialog.tsx` — exists
- [x] `src/features/lessons/components/RenameLessonDialog.tsx` — exists
- [x] `src/features/lessons/components/DeleteLessonDialog.tsx` — exists
- [x] `src/pages/LessonsPage.tsx` — exists
- [x] Commits a5e4e6a, 58f98b1, e11bd25, 510184f — all present
- [x] `pnpm tsc --noEmit` — exits 0
