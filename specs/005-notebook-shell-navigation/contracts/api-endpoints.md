# API Endpoint Contracts: Notebook Shell & Navigation

**Feature**: 005-notebook-shell-navigation  
**Date**: 2026-04-05

## Existing Endpoints (already implemented in src/api/)

### GET /notebooks/{id} → NotebookDetail
- **API module**: `src/api/notebooks.ts` → `getNotebook(id)`
- **Response**: `NotebookDetail`
- **Errors**: 404 (not found), 401 (unauthorized)

### GET /notebooks/{id}/index → NotebookIndex
- **API module**: `src/api/notebooks.ts` → `getNotebookIndex(notebookId)`
- **Response**: `{ entries: NotebookIndexEntry[] }`
- **Notes**: Returns empty `entries` array when notebook has no lessons

### PATCH /notebooks/{id} → NotebookDetail
- **API module**: `src/api/notebooks.ts` → `updateNotebook(id, data)`
- **Request body**: `{ title?: string, coverColor?: string }`
- **Response**: `NotebookDetail`
- **Errors**: 400 (validation), 404

### DELETE /notebooks/{id} → 204
- **API module**: `src/api/notebooks.ts` → `deleteNotebook(id)`
- **Response**: 204 No Content

### GET /notebooks/{id}/lessons → LessonSummary[]
- **API module**: `src/api/lessons.ts` → `getLessons(notebookId)`
- **Response**: `LessonSummary[]` (ordered by createdAt ascending)

### GET /lessons/{id} → LessonDetail
- **API module**: `src/api/lessons.ts` → `getLesson(notebookId, lessonId)`
- **Response**: `LessonDetail` (includes `pages: LessonPage[]`)
- **Notes**: Current implementation passes `notebookId` in URL path as `/notebooks/{notebookId}/lessons/{lessonId}`. The spec says `GET /lessons/{id}` — verify actual endpoint path.

### POST /notebooks/{id}/lessons → LessonDetail (201)
- **API module**: `src/api/lessons.ts` → `createLesson(notebookId, { title })`
- **Response**: `LessonDetail` with auto-created page 1

### PATCH /notebooks/{id}/lessons/{id} → LessonDetail
- **API module**: `src/api/lessons.ts` → `updateLesson(notebookId, lessonId, { title })`
- **Response**: `LessonDetail`

### DELETE /notebooks/{id}/lessons/{id} → 204
- **API module**: `src/api/lessons.ts` → `deleteLesson(notebookId, lessonId)`
- **Response**: 204 No Content

## New Endpoints (need implementation in src/api/pages.ts)

### POST /lessons/{id}/pages → LessonPageWithWarning (201 or 200)
- **API module**: `src/api/pages.ts` → `createPage(lessonId)` — NEW
- **Response 201**: `{ page: LessonPage }` (normal creation)
- **Response 200**: `{ page: LessonPage, warning: string }` (10+ pages warning)
- **Notes**: The backend auto-assigns the next sequential page number

### DELETE /lessons/{lessonId}/pages/{pageId} → 204
- **API module**: `src/api/pages.ts` → `deletePage(lessonId, pageId)` — NEW
- **Response**: 204 No Content
- **Error 422**: `{ code: "LAST_PAGE_DELETION", message: string }` — cannot delete the last page in a lesson

## Error Handling Patterns

| Error Code | Scenario | UI Behavior |
|------------|----------|-------------|
| 404 | Notebook/lesson/page not found | "Not found" message in notebook shell with link to dashboard |
| 401 | Unauthorized | Handled by Axios interceptor (silent refresh → retry) |
| 400 | Validation error (title) | Map to form field errors via `setError` |
| 422 LAST_PAGE_DELETION | Delete last page | Toast error: "Cannot delete the last page in a lesson" |
| 5xx | Server error | Toast error with generic message |
