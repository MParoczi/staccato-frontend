---
gsd_state_version: 1.0
milestone: v0.6
milestone_name: Canvas & Module Placement
status: planning
last_updated: "2026-05-17T19:17:55.762Z"
last_activity: 2026-05-17 — Roadmap defined; 4-plan structure set (Foundation → Shell → Interactions → Integration); success criteria written; REQUIREMENTS.md traceability updated
progress:
  total_phases: 9
  completed_phases: 0
  total_plans: 0
  completed_plans: 4
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17 after v0.5 milestone archive)

**Core value:** A musician can open a notebook, navigate to any lesson, add and arrange content on the dotted-paper canvas, and find exactly what they practiced.
**Current focus:** v0.6 Canvas & Module Placement — Phase 6 roadmap defined, ready for plan-phase

## Current Position

Phase: 6 — Canvas & Module Placement (roadmap defined)
Plan: —
Status: Ready to plan Phase 6
Last activity: 2026-05-17 — Roadmap defined; 4-plan structure set (Foundation → Shell → Interactions → Integration); success criteria written; REQUIREMENTS.md traceability updated

## Phase Progress

| Phase | Name | Milestone | Status |
|-------|------|-----------|--------|
| 1 | Foundation | v0.1 | ✅ Shipped |
| 2 | Authentication | v0.2 | ✅ Shipped |
| 3 | User Profile & Account | v0.3 | ✅ Shipped |
| 4 | Notebook Management | v0.4 | ✅ Shipped |
| 5 | Lessons & Pages | v0.5 | ✅ Shipped |
| 6 | Canvas & Module Placement | v0.6 | ○ Pending |
| 7 | Text Building Blocks | v0.6+ | ○ Pending |
| 8 | Chord Library | v0.6+ | ○ Pending |
| 9 | Rich Building Blocks | v0.6+ | ○ Pending |
| 10 | Styling System | v0.6+ | ○ Pending |
| 11 | Notebook Index & PDF Export | v0.6+ | ○ Pending |
| 12 | Localization & Polish | v0.6+ | ○ Pending |

## Key Decisions Carried Forward

- AppLayout wraps all /app/* routes — foundational for all phases; never remove or restructure without updating all child routes
- authStore.updateUser is the pattern for syncing profile mutations; TanStack Query for all server state
- Feature-scoped API modules: `src/features/{feature}/api/{feature}Api.ts` — all calls via shared `src/api/client.ts`
- HU translation stubs deferred to Phase 12 — add HU stub keys for new strings but do not block on translations
- COVER_COLORS / NOTEBOOK_STYLE_PRESETS / NOTEBOOK_PAGE_SIZES exported as as-const arrays (erasableSyntaxOnly — no enum)
- Instrument hardcoded as "Guitar" in all Phase 4 UI (backend only supports 6-string guitar)
- extractErrorMessage inline per component — consistent with plan spec, prevents double-toast
- TanStack Query cache invalidation on mutation success is the established pattern for all list/detail data

## Decisions from v0.5 (Carried Forward)

- Lessons feature lives at `src/features/lessons/` — follows same feature-scoped structure as notebooks
- LessonPages feature shares `src/features/lessons/` (not a separate feature) — pages are subordinate to lessons
- API spec is authoritative at `.planning/swagger.json` — consult before every plan to avoid endpoint mismatches
- Global page formula: cover=1, index=2, lessons start at 3 (cumulative by pageCount)
- URL-based page navigation: `useSearchParams` with `?page=N` (1-based) — page position survives refresh
- LessonsPage as tab child of NotebookPage (inherits tab chrome); LessonPage as AppLayout sibling (full-screen, no tab bar)
- Backend `globalPageStart` is 0-indexed — frontend always adds +1 for display
- `POST /lessons/{id}/pages` response does not include `pageNumber` — compute client-side as `totalPages + 1`

## Decisions from v0.6 Research

- Canvas lives at `src/features/lessons/canvas/` — inside lessons feature to avoid cross-feature import violations
- New stack: `@dnd-kit/core ^6.3.1`, `@dnd-kit/utilities ^3.2.2` (dynamically imported if needed)
- Grid cell: 32 px; canvas root must be `position: relative` only — no `transform` (breaks Radix portal z-index)
- Use `CSS.Transform.toString(t)` from @dnd-kit/utilities for style-prop transforms — never Tailwind dynamic classes (purged at build)
- AbortController per module for PATCH layout race condition prevention
- Single `snapToGrid(px)` utility at all write paths to prevent coordinate drift
- TanStack Query for module list persistence; local component state for transient drag/resize in-flight state
- 12 module type shells in Phase 6; content editing deferred to Phases 7–9

## Notes

- swagger.json at `.planning/swagger.json` is the authoritative API contract; consult before every plan-phase
- Phase 5 open questions (Q1–Q4) all resolved — see `.planning/milestones/v0.5-REQUIREMENTS.md`
- Phase 6 plan structure: Plan 1 Foundation, Plan 2 Shell, Plan 3 Interactions, Plan 4 Integration
