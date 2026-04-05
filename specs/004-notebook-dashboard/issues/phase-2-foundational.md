# Phase 2: Foundational — GitHub Issues

> Shared hooks and schemas that **must** be complete before any user story work can begin.

---

## Issue: T005 — Create `useNotebooks` hook

**Labels:** `feature`, `004-notebook-dashboard`, `phase-2`, `US1-dependency`

### Description

Create the `useNotebooks` query hook in `src/features/notebooks/hooks/useNotebooks.ts`.

- Wrap `useQuery` with query key `["notebooks"]`
- Fetcher: `getNotebooks()` from `src/api/notebooks.ts`
- `staleTime: 0` (refetch on window focus per constitution XI)
- Return the full query result

### Acceptance Criteria

- [ ] Hook exists at `src/features/notebooks/hooks/useNotebooks.ts`
- [ ] Uses query key `["notebooks"]` and `staleTime: 0`
- [ ] Returns `useQuery` result (data, isLoading, isError, etc.)

### Dependencies

- Phase 1 complete (types, API, constants, i18n)

### Parallel

Yes — can be implemented in parallel with T006 and T006b.

---

## Issue: T006 — Create Zod schema for notebook creation

**Labels:** `feature`, `004-notebook-dashboard`, `phase-2`, `US2-dependency`

### Description

Create the Zod validation schema in `src/features/notebooks/schemas/create-notebook-schema.ts`.

**Fields:**

| Field          | Type     | Validation                                                                                          |
| -------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `title`        | `string` | min 1, max 200, trimmed, refine to reject whitespace-only                                           |
| `instrumentId` | `string` | min 1                                                                                               |
| `pageSize`     | `enum`   | `z.enum` for A4 / A5 / A6 / B5 / B6                                                                |
| `coverColor`   | `string` | regex for valid 6-digit hex with or without `#`, transform to always include `#` prefix for the API |

Export the schema **and** the inferred TypeScript type.

### Acceptance Criteria

- [ ] Schema exists at `src/features/notebooks/schemas/create-notebook-schema.ts`
- [ ] All field validations match the specification above
- [ ] `coverColor` transform normalizes to `#RRGGBB` format
- [ ] Inferred type is exported

### Dependencies

- Phase 1 complete

### Parallel

Yes — can be implemented in parallel with T005 and T006b.

---

## Issue: T006b — Unit tests for Zod schema (100% branch coverage)

**Labels:** `test`, `004-notebook-dashboard`, `phase-2`

### Description

Write unit tests in `src/features/notebooks/schemas/create-notebook-schema.test.ts` with 100% branch coverage per constitution XII.

**Required test cases:**

- [ ] Valid input passes
- [ ] Empty title rejected
- [ ] Whitespace-only title rejected
- [ ] Title exceeding 200 chars rejected
- [ ] Missing `instrumentId` rejected
- [ ] Invalid `pageSize` rejected
- [ ] Valid 6-digit hex **with** `#` accepted
- [ ] Valid 6-digit hex **without** `#` accepted and normalized
- [ ] 3-digit hex shorthand rejected
- [ ] Non-hex string rejected
- [ ] Empty `coverColor` rejected

### Acceptance Criteria

- [ ] Test file exists at `src/features/notebooks/schemas/create-notebook-schema.test.ts`
- [ ] All 11 test cases pass
- [ ] 100% branch coverage on the schema

### Dependencies

- T006 (schema must exist first)

### Parallel

Yes — can be implemented in parallel with T005 (different files).
