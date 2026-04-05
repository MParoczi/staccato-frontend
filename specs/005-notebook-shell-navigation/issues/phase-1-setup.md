# Phase 1: Setup — GitHub Issues

> Types, API module, and validation schemas needed by multiple stories.
>
> **Status:** COMPLETED

---

## Issue: T001 — Add `LessonPageWithWarning` interface

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-1`

**Status:** Done

### Description

Add `LessonPageWithWarning` interface to `src/lib/types/lessons.ts` and re-export from `src/lib/types/index.ts`.

```typescript
export interface LessonPageWithWarning {
  page: LessonPage;
  warning?: string;
}
```

Source: POST /lessons/{id}/pages response. Returns 201 normally, or 200 with `warning` field when 10+ pages.

### Acceptance Criteria

- [x] Interface exists in `src/lib/types/lessons.ts`
- [x] Re-exported from `src/lib/types/index.ts`
- [x] `warning` field is optional string

### Dependencies

None — first task.

### Parallel

Yes — no dependencies.

---

## Issue: T002 — Create page API module

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-1`

**Status:** Done

### Description

Create `src/api/pages.ts` with two functions per contracts/api-endpoints.md:

- `createPage(lessonId: string): Promise<LessonPageWithWarning>` — POST /lessons/{id}/pages
- `deletePage(lessonId: string, pageId: string): Promise<void>` — DELETE /lessons/{lessonId}/pages/{pageId}

Follow the same pattern as `src/api/lessons.ts` (import `apiClient` from `./client`, typed responses).

### Acceptance Criteria

- [x] File exists at `src/api/pages.ts`
- [x] `createPage` sends POST and returns `LessonPageWithWarning`
- [x] `deletePage` sends DELETE and returns void
- [x] Uses `apiClient` from `./client`

### Dependencies

- T001 (`LessonPageWithWarning` type must exist)

### Parallel

Yes — can be implemented in parallel with T003, T004.

---

## Issue: T003 — Create edit-notebook Zod schema

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-1`

**Status:** Done

### Description

Create Zod validation schema in `src/features/notebooks/schemas/edit-notebook-schema.ts`.

| Field | Type | Validation |
|-------|------|------------|
| `title` | `string` | min 1, max 200, trimmed, refine to reject whitespace-only |
| `coverColor` | `string` | regex for valid 6-digit hex with `#` prefix (`/^#[0-9a-fA-F]{6}$/`) |

Export the schema and the inferred TypeScript type (`EditNotebookFormData`).

### Acceptance Criteria

- [x] Schema exists at `src/features/notebooks/schemas/edit-notebook-schema.ts`
- [x] Title: required, 1-200 chars, trimmed, whitespace-only rejected
- [x] CoverColor: requires `#` prefix + 6-digit hex
- [x] Inferred type exported

### Dependencies

None.

### Parallel

Yes — can be implemented in parallel with T002, T004.

---

## Issue: T004 — Create lesson-title Zod schema

**Labels:** `feature`, `005-notebook-shell-navigation`, `phase-1`

**Status:** Done

### Description

Create Zod validation schema in `src/features/notebooks/schemas/lesson-title-schema.ts`.

| Field | Type | Validation |
|-------|------|------------|
| `title` | `string` | min 1, max 200, trimmed, refine to reject whitespace-only |

Reusable for both create lesson dialog and inline edit. Export schema and inferred type (`LessonTitleFormData`).

### Acceptance Criteria

- [x] Schema exists at `src/features/notebooks/schemas/lesson-title-schema.ts`
- [x] Title: required, 1-200 chars, trimmed, whitespace-only rejected
- [x] Inferred type exported

### Dependencies

None.

### Parallel

Yes — can be implemented in parallel with T002, T003.

---

## Issue: T004a — Unit tests for Zod schemas

**Labels:** `test`, `005-notebook-shell-navigation`, `phase-1`

**Status:** Done

### Description

Write unit tests with 100% branch coverage per Constitution XII.

**`src/features/notebooks/schemas/edit-notebook-schema.test.ts`** (12 tests):

- [x] Valid input passes
- [x] Trims whitespace from title
- [x] Empty title rejected
- [x] Whitespace-only title rejected
- [x] Title at 200 chars accepted
- [x] Title exceeding 200 chars rejected
- [x] Valid 6-digit hex with `#` accepted
- [x] Hex without `#` prefix rejected
- [x] 3-digit hex shorthand rejected
- [x] Non-hex string rejected
- [x] Empty coverColor rejected
- [x] 8-digit hex (with alpha) rejected

**`src/features/notebooks/schemas/lesson-title-schema.test.ts`** (8 tests):

- [x] Valid input passes
- [x] Trims whitespace from title
- [x] Empty title rejected
- [x] Whitespace-only title rejected
- [x] Title at 200 chars accepted
- [x] Title exceeding 200 chars rejected
- [x] Single character title accepted
- [x] Missing title field rejected

### Acceptance Criteria

- [x] Both test files exist
- [x] All 20 tests pass
- [x] 100% branch coverage on both schemas

### Dependencies

- T003, T004 (schemas must exist)

### Parallel

Yes — can run after schemas are created.
