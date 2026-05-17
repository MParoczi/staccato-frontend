# Phase 5: Lessons & Pages — Research

**Researched:** 2026-05-17
**Domain:** React SPA — lesson/page CRUD, TanStack Query, React Router v7, react-hook-form + zod
**Confidence:** HIGH (all patterns established in-project; no new libraries)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01/D-02: LessonsPage nested under NotebookPage (`lessons` child); LessonPage is a **sibling** route at `/app/notebooks/:id/lessons/:lessonId`
- D-03: 3-level breadcrumb in Navbar: Notebooks › [Notebook Name (link→lessons)] › [Lesson Title]. Detection via `useMatch('/app/notebooks/:id/lessons/:lessonId')`
- D-04: LessonPage queries notebook independently via `useQuery(['notebooks', id])` — no `useOutletContext` (sibling route)
- D-05/D-06: Lessons displayed as vertical list rows; each row shows title + page count
- D-07: ⋮ context menu per row (DropdownMenu). Menu: Open, Rename, Delete
- D-08: Rename via Dialog + react-hook-form + zod. Does NOT use inline edit
- D-09/D-10/D-11: Create via Dialog; two entry points (header button + dashed first-slot row); auto-navigate to new lesson on success
- D-12: Top controls bar in LessonPage: back link | title | Page X of Y | Notebook p. N | ‹ Prev › Next | + Add page 🗑 Delete page
- D-13: Delete page disabled when `pageCount === 1`; 4xx from backend shows Sonner toast
- D-14: After add page → navigate to new (last) page; after delete → navigate to previous (or page 1)
- D-15: Dotted-grid CSS placeholder: `radial-gradient(circle, var(--muted-foreground) 1px, transparent 1px)` background-size 24px; no text; remove entirely in Phase 6

### Claude's Discretion
- Exact proportions/spacing of the top controls bar
- Dotted-grid dot size, opacity
- Empty state design for LessonsPage (icon, heading, CTA wording)
- Page navigation: URL search param `?page=N` preferred (shareable), local state acceptable

### Deferred (OUT OF SCOPE)
- Canvas module placement (Phase 6)
- Building block editors (Phase 7+)
- Notebook index TOC (Phase 11)
</user_constraints>

<research_summary>
## Summary

Phase 5 uses only established in-project patterns. No new packages required. All four pillars — API module, TanStack Query, react-hook-form+zod dialogs, and React Router navigation — follow patterns proven in Phases 2–4.

**Open questions from REQUIREMENTS.md resolved:**
- **Q1 (auto-create first page):** Assumed YES — no `POST /lessons/{id}/pages` needed after lesson create. If wrong, executor should call `addPage(newLesson.id)` right after `createLesson` and navigate to the new page.
- **Q2 (globalPageStart on Lesson):** Swagger has no response schema. Include field in `Lesson` type; if absent at runtime, fall back to client-side formula: `sum(lessons[0..i-1].pageCount) + 3` (cover=1, index=2).
- **Q3 (globalPageNumber on LessonPage):** Same — include in `LessonPage` type; defensive fallback: `lesson.globalPageStart + page.pageNumber - 1`.
- **Q4 (last-page delete HTTP status):** Unknown — could be 400, 422, or 409. Client-side gate (disable button when `pages.length === 1`) is primary. Any 4xx triggers Sonner toast fallback (per D-13).

**Primary recommendation:** Reuse Phase 4 patterns verbatim. lessonsApi.ts mirrors notebooksApi.ts. All dialogs mirror DeleteNotebookDialog pattern. Route wiring mirrors Phase 4 book-view routes.
</research_summary>

<standard_stack>
## Standard Stack

No new packages. All dependencies already installed (see PROJECT.md v0.4 tech stack):
- TanStack Query 5.100.10 — `useQuery` + `useMutation` + `queryClient.invalidateQueries`
- react-hook-form 7.75.0 + @hookform/resolvers 3.10.0 + zod 3.24.4 — validated forms
- React Router 7.15.1 — `useParams`, `useSearchParams`, `useMatch`, `useNavigate`, `Link`, `NavLink`
- Lucide React — icons: `ChevronLeft`, `ChevronRight`, `MoreHorizontal`, `Plus`, `Trash2`, `BookOpen`, `Loader2`
- Sonner — `toast.error()`, `toast.warning()`
- i18next — `useTranslation('lessons')`
- shadcn components: Dialog, DropdownMenu, Button, Input, Form, Separator, Skeleton, Label
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### New files structure
```
src/
├── types/index.ts                           MODIFY — add Lesson, LessonPage types
├── pages/
│   ├── LessonsPage.tsx                      NEW — lesson list view
│   └── LessonPage.tsx                       NEW — page navigation shell
├── features/lessons/
│   ├── api/
│   │   ├── lessonsApi.ts                    NEW — lesson CRUD functions
│   │   └── lessonPagesApi.ts                NEW — page add/delete functions
│   └── components/
│       ├── CreateLessonDialog.tsx           NEW
│       ├── RenameLessonDialog.tsx           NEW
│       ├── DeleteLessonDialog.tsx           NEW
│       └── DeletePageDialog.tsx             NEW
├── components/
│   └── Navbar.tsx                           MODIFY — 3-level breadcrumb
├── router.tsx                               MODIFY — add lesson routes
└── pages/NotebookPage.tsx                   MODIFY — enable Lessons tab

public/locales/
├── en/lessons.json                          REPLACE — complete keys
└── hu/lessons.json                          REPLACE — __HU_TODO__ stubs
```

### Pattern: Feature-scoped API module (from notebooksApi.ts)
```typescript
import { client } from '@/api/client'
import type { Lesson, CreateLessonPayload } from '@/types'

export async function createLesson(notebookId: string, payload: CreateLessonPayload): Promise<Lesson> {
  const { data } = await client.post<Lesson>(`/notebooks/${notebookId}/lessons`, payload)
  return data
}
```

### Pattern: Delete dialog (from DeleteNotebookDialog.tsx)
```typescript
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { detail?: string } } }).response
    if (resp?.data?.detail) return resp.data.detail
  }
  return fallback
}
// useMutation + onSuccess invalidateQueries + onError toast.error(extractErrorMessage(...))
```

### Pattern: URL search param for page index (React Router v7)
```typescript
const [searchParams, setSearchParams] = useSearchParams()
const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
// navigate: setSearchParams({ page: String(newPage) })
```

### Pattern: 3-level Navbar breadcrumb
```typescript
const lessonMatch = useMatch('/app/notebooks/:id/lessons/:lessonId')
const lessonId = lessonMatch?.params?.lessonId as string | undefined
// Show 3 levels if lessonId, else 2 levels (existing behavior)
```
</architecture_patterns>

<open_questions>
## Open Questions

1. **Q1 — Auto-create first page on lesson create**
   - What we know: REQUIREMENTS.md assumption + swagger POST /notebooks/{id}/lessons (body: CreateLessonRequest)
   - What's unclear: Whether backend creates page 1 automatically
   - Recommendation: Assume YES. If CreateLesson returns a Lesson with `pageCount: 0`, executor should call `addPage(lesson.id)` before navigating. Document this as a known integration risk.

2. **Q2 + Q3 — globalPageStart / globalPageNumber fields**
   - What we know: Types include both fields; swagger has no response schemas
   - What's unclear: Whether backend returns these fields or expects client-side computation
   - Recommendation: Include in types. Defensive fallback: `globalPageNumber ?? (lesson.globalPageStart + page.pageNumber - 1)`. If `globalPageStart` is also absent, display 0 (will be fixed at integration time — not a crash).

3. **Q4 — HTTP status for last-page delete**
   - What we know: Backend "rejects if last page (422 or 400)" per REQUIREMENTS.md
   - Recommendation: Client-side guard is primary (disable button when `pages.length === 1`). The backend 4xx path is a fallback; `extractErrorMessage` + `toast.error` handles it regardless of status code.
</open_questions>

---
*Phase: 05-lessons-pages*
*Research completed: 2026-05-17*
*Ready for planning: yes*
