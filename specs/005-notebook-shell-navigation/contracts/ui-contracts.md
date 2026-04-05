# UI Contracts: Notebook Shell & Navigation

**Feature**: 005-notebook-shell-navigation  
**Date**: 2026-04-05

## Component Interface Contracts

### NotebookLayout (route layout)
```typescript
// No props — reads notebookId from route params
// Renders: NotebookToolbar + NotebookSidebar + <Outlet />
// Provides notebook data to children via TanStack Query cache
// Handles loading/error states for NotebookDetail
```

### DottedPaper (shared component)
```typescript
interface DottedPaperProps {
  pageSize: PageSize;         // determines aspect ratio
  zoom: number;               // current zoom level (0.25-3.0)
  className?: string;         // additional CSS classes
  children?: React.ReactNode; // content rendered on top of paper
}
```

### CoverPage
```typescript
// No props — reads notebookId from route params
// Uses useNotebook(notebookId) for notebook data
// Uses useCurrentUser() for owner display name
```

### IndexPage
```typescript
// No props — reads notebookId from route params
// Uses useNotebookIndex(notebookId) for TOC data
```

### LessonPage
```typescript
// No props — reads notebookId, lessonId, pageId from route params
// Uses useLesson(lessonId) for lesson data + pages
```

### NotebookToolbar
```typescript
interface NotebookToolbarProps {
  notebook: NotebookDetail;
  globalPageNumber: number | null;  // null for cover (not displayed)
}
```

### NotebookSidebar
```typescript
interface NotebookSidebarProps {
  notebook: NotebookDetail;
  lessons: LessonSummary[];
  isLoading: boolean;
}
```

### PageNavigationArrows
```typescript
interface PageNavigationArrowsProps {
  prevUrl: string | null;     // null = hidden/disabled
  nextUrl: string | null;     // null = hidden/disabled
}
```

### EditNotebookDialog
```typescript
interface EditNotebookDialogProps {
  notebook: NotebookDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### CreateLessonDialog
```typescript
interface CreateLessonDialogProps {
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (lesson: LessonDetail) => void;
}
```

### DeleteLessonDialog
```typescript
interface DeleteLessonDialogProps {
  lesson: LessonSummary;
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}
```

### LessonSidebarEntry
```typescript
interface LessonSidebarEntryProps {
  lesson: LessonSummary;
  notebookId: string;
  isActive: boolean;          // highlights when viewing this lesson's pages
  onNavigate: (lessonId: string) => void;
  onDeleted?: () => void;
}
```

### DeletePageButton
```typescript
interface DeletePageButtonProps {
  lessonId: string;
  pageId: string;
  isLastPage: boolean;        // when true, show error instead of confirm
  onDeleted?: () => void;
}
```

## Hook Contracts

### useNotebook
```typescript
function useNotebook(notebookId: string): UseQueryResult<NotebookDetail>
// Query key: ["notebooks", notebookId]
```

### useNotebookIndex
```typescript
function useNotebookIndex(notebookId: string): UseQueryResult<NotebookIndex>
// Query key: ["notebooks", notebookId, "index"]
```

### useLessons
```typescript
function useLessons(notebookId: string): UseQueryResult<LessonSummary[]>
// Query key: ["notebooks", notebookId, "lessons"]
```

### useLesson
```typescript
function useLesson(notebookId: string, lessonId: string): UseQueryResult<LessonDetail>
// Query key: ["notebooks", notebookId, "lessons", lessonId]
```

### usePageNavigation
```typescript
interface PageNavigationResult {
  prevUrl: string | null;
  nextUrl: string | null;
  globalPageNumber: number | null;  // null for cover
  currentPageType: 'cover' | 'index' | 'lesson';
  pageNumberInLesson?: number;      // only for lesson pages
  totalPagesInLesson?: number;      // only for lesson pages
}

function usePageNavigation(notebookId: string): PageNavigationResult
// Reads current route params to determine position
// Computes prev/next from NotebookIndex + lessons list
```

### useKeyboardNavigation
```typescript
function useKeyboardNavigation(prevUrl: string | null, nextUrl: string | null): void
// Side-effect hook: attaches/detaches keydown listener
// Left arrow → navigate to prevUrl, Right arrow → navigate to nextUrl
// Suppressed when focus is on input/textarea/contenteditable
```

### Mutation Hooks
```typescript
function useCreateLesson(notebookId: string): UseMutationResult<LessonDetail, Error, { title: string }>
function useUpdateLesson(notebookId: string): UseMutationResult<LessonDetail, Error, { lessonId: string; title: string }>
function useDeleteLesson(notebookId: string): UseMutationResult<void, Error, string>  // lessonId
function useUpdateNotebook(notebookId: string): UseMutationResult<NotebookDetail, Error, { title?: string; coverColor?: string }>
function useCreatePage(notebookId: string, lessonId: string): UseMutationResult<LessonPageWithWarning, Error, void>
function useDeletePage(notebookId: string, lessonId: string): UseMutationResult<void, Error, string>  // pageId
```
