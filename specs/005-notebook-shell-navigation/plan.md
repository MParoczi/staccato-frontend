# Implementation Plan: Notebook Shell & Navigation

**Branch**: `005-notebook-shell-navigation` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-notebook-shell-navigation/spec.md`

## Summary

Build the notebook view — a "book" metaphor container housing cover page, index page, and lesson pages. The notebook shell is a layout component wrapping all `/app/notebooks/:notebookId/*` routes, providing shared notebook data via TanStack Query cache and a toolbar/sidebar chrome around a fixed-aspect-ratio canvas area. Key subsystems: page navigation state machine (linear traversal across lesson boundaries), dotted paper canvas component, sidebar lesson management (CRUD), and keyboard shortcuts.

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode  
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React  
**Storage**: N/A (frontend-only; server state via TanStack Query cache, zoom in Zustand)  
**Testing**: Vitest + React Testing Library + MSW  
**Target Platform**: Modern browsers (Chrome/Firefox/Safari/Edge latest 2)  
**Project Type**: Web application (SPA)  
**Performance Goals**: Page navigation transitions < 100ms perceived, canvas renders at 60fps during zoom  
**Constraints**: Canvas must render at fixed aspect ratio of notebook's page size; all strings localized (en/hu)  
**Scale/Scope**: Up to 50 lessons per notebook, up to ~10 pages per lesson (soft limit with warning at 10+)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Folder Structure & Module Boundaries | PASS | New code goes in `src/features/notebooks/` (existing), new shared components in `src/components/`, new route layouts in `src/routes/` |
| II. State Management — Zustand for Client, TanStack Query for Server | PASS | Notebook/lesson/page data via TanStack Query; zoom + sidebar open/closed in existing Zustand `uiStore` |
| III. API Integration Discipline | PASS | All API calls through `src/api/notebooks.ts`, `src/api/lessons.ts`, and new `src/api/pages.ts` |
| IV. Component Architecture | PASS | Layout components in `src/routes/`, feature components in `src/features/notebooks/`, presentational components receive data via props |
| V. Design System — Two Visual Zones | PASS | Toolbar/sidebar = Zone 1 (earthy shell), canvas area = Zone 2 (notebook paper metaphor with existing CSS vars) |
| VI. No Emojis — Icons Only | PASS | All indicators use Lucide React icons |
| VII. Form Handling & Validation | PASS | Lesson title and notebook edit forms use React Hook Form + Zod |
| VIII. Routing & Navigation | PASS | NotebookLayout wraps all `/app/notebooks/:notebookId/*` sub-routes as specified in constitution |
| IX. Internationalization | PASS | All strings via react-i18next with `notebooks.*` namespace; dates via `Intl.DateTimeFormat` |
| X. Type Safety | PASS | Types for notebook, lesson, page entities already exist in `src/lib/types/`; new types added for page creation response |
| XI. Performance Patterns | PASS | TanStack Query staleTime: 0 for notebooks/lessons (constitution XI); React.memo on canvas components for zoom performance |
| XII. Testing | PASS | Unit tests for navigation utility, Zod schemas; integration tests for sidebar CRUD, page navigation |

All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-notebook-shell-navigation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── notebooks.ts          # Existing — already has getNotebook, getNotebookIndex, updateNotebook, deleteNotebook
│   ├── lessons.ts             # Existing — already has getLessons, getLesson, createLesson, updateLesson, deleteLesson
│   └── pages.ts               # NEW — createPage, deletePage
├── components/
│   ├── common/
│   │   └── DottedPaper.tsx    # NEW — reusable dotted paper background (Zone 2)
│   └── ui/
│       └── sheet.tsx          # Existing shadcn/ui Sheet
├── features/
│   └── notebooks/
│       ├── components/
│       │   ├── NotebooksDashboardPage.tsx   # Existing (Feature 004)
│       │   ├── CoverPage.tsx                # NEW — notebook cover rendering
│       │   ├── IndexPage.tsx                # NEW — table of contents
│       │   ├── LessonPage.tsx               # NEW — lesson page with canvas placeholder
│       │   ├── NotebookToolbar.tsx           # NEW — toolbar with breadcrumb, zoom, actions
│       │   ├── NotebookSidebar.tsx           # NEW — lesson list sidebar (Sheet)
│       │   ├── PageNavigationArrows.tsx      # NEW — prev/next arrows
│       │   ├── EditNotebookDialog.tsx        # NEW — edit title + cover color
│       │   ├── CreateLessonDialog.tsx         # NEW — lesson title input dialog
│       │   ├── DeleteLessonDialog.tsx         # NEW — lesson deletion confirmation
│       │   ├── DeleteNotebookDialog.tsx       # Existing (reuse from Feature 004)
│       │   ├── DeletePageButton.tsx           # NEW — page deletion with confirmation
│       │   ├── LessonSidebarEntry.tsx         # NEW — single lesson row with inline edit + delete
│       │   └── CoverColorPicker.tsx           # Existing (reuse from Feature 004)
│       ├── hooks/
│       │   ├── useNotebook.ts                # NEW — TanStack Query for single notebook detail
│       │   ├── useNotebookIndex.ts           # NEW — TanStack Query for notebook index
│       │   ├── useLessons.ts                 # NEW — TanStack Query for lessons list
│       │   ├── useLesson.ts                  # NEW — TanStack Query for single lesson detail
│       │   ├── useCreateLesson.ts            # NEW — mutation hook
│       │   ├── useUpdateLesson.ts            # NEW — mutation hook
│       │   ├── useDeleteLesson.ts            # NEW — mutation hook
│       │   ├── useCreatePage.ts              # NEW — mutation hook
│       │   ├── useDeletePage.ts              # NEW — mutation hook
│       │   ├── useUpdateNotebook.ts          # NEW — mutation hook for title/coverColor
│       │   ├── usePageNavigation.ts          # NEW — computes prev/next URLs from index
│       │   └── useKeyboardNavigation.ts      # NEW — arrow key listener
│       ├── schemas/
│       │   ├── edit-notebook-schema.ts       # NEW — Zod schema for notebook edit form
│       │   └── lesson-title-schema.ts        # NEW — Zod schema for lesson title (create + edit)
│       └── utils/
│           └── page-sequence.ts              # NEW — pure function: builds linear page sequence from NotebookIndex
├── lib/
│   ├── types/
│   │   ├── notebooks.ts       # Existing — may need ownerDisplayName on NotebookDetail
│   │   └── lessons.ts         # Existing — add LessonPageWithWarning type
│   └── constants/
│       └── grid.ts            # Existing — PAGE_SIZE_DIMENSIONS (used for canvas aspect ratio)
├── routes/
│   ├── index.tsx              # MODIFY — restructure notebook routes under NotebookLayout
│   ├── notebook-layout.tsx    # NEW — layout component wrapping notebook sub-routes
│   └── app-layout.tsx         # Existing — no changes needed
├── stores/
│   └── uiStore.ts             # Existing — already has zoom (0.25-3.0) and sidebarOpen
└── i18n/
    ├── en.json                # MODIFY — add notebook shell translation keys
    └── hu.json                # MODIFY — add notebook shell translation keys
```

**Structure Decision**: All new notebook shell components live in `src/features/notebooks/` (existing feature folder from Feature 004). The NotebookLayout is a route-level layout in `src/routes/`. The DottedPaper component is shared (used by this feature and future Feature 7) so it goes in `src/components/common/`. This follows Constitution Principle I exactly.

## Complexity Tracking

No violations to justify. All complexity is within the constitution's guidelines.
