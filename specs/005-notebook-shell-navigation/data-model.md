# Data Model: Notebook Shell & Navigation

**Feature**: 005-notebook-shell-navigation  
**Date**: 2026-04-05

## Existing Types (no changes needed)

### NotebookDetail (`src/lib/types/notebooks.ts`)

```typescript
interface NotebookDetail {
  id: string;
  title: string;
  instrumentId: string;
  instrumentName: string;
  pageSize: PageSize;        // 'A4' | 'A5' | 'A6' | 'B5' | 'B6'
  coverColor: string;        // hex e.g. '#8B4513'
  lessonCount: number;
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
  styles: NotebookModuleStyle[];
}
```

### NotebookIndex (`src/lib/types/notebooks.ts`)

```typescript
interface NotebookIndex {
  entries: NotebookIndexEntry[];
}

interface NotebookIndexEntry {
  lessonId: string;
  title: string;
  createdAt: string;
  startPageNumber: number;   // global page number where this lesson starts
}
```

### LessonSummary (`src/lib/types/lessons.ts`)

```typescript
interface LessonSummary {
  id: string;
  title: string;
  createdAt: string;
  pageCount: number;
}
```

### LessonDetail (`src/lib/types/lessons.ts`)

```typescript
interface LessonDetail {
  id: string;
  notebookId: string;
  title: string;
  createdAt: string;
  pages: LessonPage[];
}
```

### LessonPage (`src/lib/types/lessons.ts`)

```typescript
interface LessonPage {
  id: string;
  lessonId: string;
  pageNumber: number;        // 1-based within lesson
  moduleCount: number;
}
```

## New Types

### LessonPageWithWarning (`src/lib/types/lessons.ts` — ADD)

```typescript
interface LessonPageWithWarning {
  page: LessonPage;
  warning?: string;           // present when lesson has 10+ pages
}
```

**Source**: POST /lessons/{id}/pages response. Returns 201 normally, or 200 with warning field when 10+ pages.

## Derived Types (client-side only, in `src/features/notebooks/utils/page-sequence.ts`)

### PageSequenceEntry

```typescript
type PageType = 'cover' | 'index' | 'lesson';

interface PageSequenceEntry {
  globalPageNumber: number;   // 0 for cover (not displayed), 1 for index, 2+ for lessons
  url: string;                // full route path
  type: PageType;
  lessonId?: string;          // present for type 'lesson'
  pageId?: string;            // present for type 'lesson'
  lessonTitle?: string;       // present for type 'lesson'
  pageNumberInLesson?: number; // present for type 'lesson' (1-based)
  totalPagesInLesson?: number; // present for type 'lesson'
}
```

**Source**: Computed client-side from `NotebookIndex` + `LessonSummary[]` (for pageCount) + `LessonDetail` (for page IDs when navigating to specific pages).

**Note on page ID resolution**: The full `PageSequenceEntry` array with `pageId` values requires lesson detail fetches. For the navigation arrows, a two-tier approach is used:
1. **Index-level sequence** (from NotebookIndex + lessons list): knows global page numbers and lesson boundaries, but not individual page IDs. Sufficient for "is there a next page?" logic.
2. **Full sequence** (with page IDs): built lazily as lesson details are fetched. The hook resolves page IDs for the current lesson and adjacent lessons.

## Entity Relationships

```
NotebookDetail ──1:N── LessonSummary/LessonDetail
NotebookDetail ──1:1── NotebookIndex
LessonDetail   ──1:N── LessonPage
NotebookIndex  ──1:N── NotebookIndexEntry (each maps to a LessonSummary)
```

## Validation Rules

### Notebook Edit (edit-notebook-schema.ts)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| title | string | yes | 1-200 chars, no whitespace-only |
| coverColor | string | yes | Valid 6-digit hex (`/^#[0-9A-Fa-f]{6}$/`) |

### Lesson Title (lesson-title-schema.ts)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| title | string | yes | 1-200 chars, no whitespace-only |

## Query Key Structure

Following Constitution Principle II query key convention:

| Query | Key | Endpoint |
|-------|-----|----------|
| Notebook detail | `["notebooks", notebookId]` | GET /notebooks/{id} |
| Notebook index | `["notebooks", notebookId, "index"]` | GET /notebooks/{id}/index |
| Lessons list | `["notebooks", notebookId, "lessons"]` | GET /notebooks/{id}/lessons |
| Lesson detail | `["notebooks", notebookId, "lessons", lessonId]` | GET /lessons/{id} |
| Lesson pages | `["notebooks", notebookId, "lessons", lessonId, "pages"]` | GET /lessons/{id}/pages |

### Cache Invalidation Map

| Mutation | Invalidates |
|----------|-------------|
| Create lesson | `["notebooks", nId, "lessons"]`, `["notebooks", nId, "index"]` |
| Update lesson title | `["notebooks", nId, "lessons"]`, `["notebooks", nId, "index"]`, `["notebooks", nId, "lessons", lId]` |
| Delete lesson | `["notebooks", nId, "lessons"]`, `["notebooks", nId, "index"]`, `["notebooks", nId]` |
| Create page | `["notebooks", nId, "lessons", lId]`, `["notebooks", nId, "lessons", lId, "pages"]`, `["notebooks", nId, "index"]` |
| Delete page | `["notebooks", nId, "lessons", lId]`, `["notebooks", nId, "lessons", lId, "pages"]`, `["notebooks", nId, "index"]` |
| Update notebook (title/color) | `["notebooks", nId]`, `["notebooks"]` (dashboard list) |
| Delete notebook | `["notebooks"]` (dashboard list) |
