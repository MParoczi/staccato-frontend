# Quickstart: Notebook Shell & Navigation

**Feature**: 005-notebook-shell-navigation  
**Date**: 2026-04-05

## Prerequisites

- Feature 002 (Auth) and Feature 004 (Notebook Dashboard) are complete
- Backend API endpoints for notebooks, lessons, and pages are available
- Node.js LTS + pnpm installed

## Development Setup

```bash
cd Frontend
pnpm install
pnpm dev
```

## Key Files to Modify/Create

### Routes (modify existing)
- `src/routes/index.tsx` — Restructure notebook routes under NotebookLayout
- `src/routes/notebook-layout.tsx` — NEW layout component

### API Layer (add new)
- `src/api/pages.ts` — createPage, deletePage

### Types (modify existing)
- `src/lib/types/lessons.ts` — Add `LessonPageWithWarning` interface

### Feature Components (all new, in `src/features/notebooks/`)
- `components/CoverPage.tsx`
- `components/IndexPage.tsx`
- `components/LessonPage.tsx`
- `components/NotebookToolbar.tsx`
- `components/NotebookSidebar.tsx`
- `components/PageNavigationArrows.tsx`
- `components/EditNotebookDialog.tsx`
- `components/CreateLessonDialog.tsx`
- `components/DeleteLessonDialog.tsx`
- `components/LessonSidebarEntry.tsx`
- `components/DeletePageButton.tsx`

### Hooks (all new, in `src/features/notebooks/hooks/`)
- `useNotebook.ts`, `useNotebookIndex.ts`, `useLessons.ts`, `useLesson.ts`
- `useCreateLesson.ts`, `useUpdateLesson.ts`, `useDeleteLesson.ts`
- `useCreatePage.ts`, `useDeletePage.ts`, `useUpdateNotebook.ts`
- `usePageNavigation.ts`, `useKeyboardNavigation.ts`

### Utils (new)
- `src/features/notebooks/utils/page-sequence.ts` — page navigation state machine

### Shared Components (new)
- `src/components/common/DottedPaper.tsx` — reusable dotted paper background

### Schemas (new)
- `src/features/notebooks/schemas/edit-notebook-schema.ts`
- `src/features/notebooks/schemas/lesson-title-schema.ts`

### i18n (modify existing)
- `src/i18n/en.json` — Add `notebooks.shell.*`, `notebooks.sidebar.*`, etc.
- `src/i18n/hu.json` — Hungarian translations

## Recommended Implementation Order

1. Types + API layer (pages.ts, LessonPageWithWarning)
2. Page sequence utility + unit tests
3. NotebookLayout + route restructuring
4. DottedPaper shared component
5. CoverPage + EditNotebookDialog
6. IndexPage
7. LessonPage (placeholder canvas)
8. Page navigation arrows + keyboard nav
9. Sidebar + lesson CRUD
10. Page CRUD (add/delete page)
11. Toolbar (breadcrumb, zoom, action buttons)
12. i18n translations
13. Integration tests

## Testing

```bash
pnpm test                    # Run all tests
pnpm test page-sequence      # Run navigation utility tests
pnpm test --watch            # Watch mode during development
```

## Key Architecture Decisions

- **No React context for notebook data** — TanStack Query cache deduplication handles it
- **Page sequence is a pure utility** — easily testable, derived from NotebookIndex + lessons
- **Sidebar stays open on navigation** — per clarification, user closes manually
- **Canvas renders at page aspect ratio** — per clarification, centered in viewport
- **Zoom via CSS transform** — performant, doesn't re-layout child elements
- **Owner name from useCurrentUser()** — avoids backend change, correct for single-user scope
