---
gsd_state_version: 1.0
milestone: v0.5
milestone_name: Lessons & Pages
status: "◑ Planned — Phase 5 has 4 plans; next: `/gsd:execute-phase 5`"
last_updated: "2026-05-17T14:30:00.000Z"
last_activity: 2026-05-17 — Phase 5 planned; 4 plans created (01 foundation, 02 lessons list, 03 lesson page + navbar, 04 router integration)
progress:
  total_phases: 9
  completed_phases: 0
  total_plans: 4
  completed_plans: 4
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17 for v0.5)

**Core value:** A musician can open a notebook, navigate to any lesson, add and arrange content on the dotted-paper canvas, and find exactly what they practiced.
**Current focus:** v0.5 Phase 5 — Lessons & Pages — 4 plans ready; next: `/gsd:execute-phase 5`

## Current Position

Phase: 5 — Lessons & Pages
Status: ◑ Planned — 4 plans created; next: `/gsd:execute-phase 5`
Last activity: 2026-05-17 — Phase 5 planned; RESEARCH.md + 4 PLAN.md files created; plan checker passed (0 blockers)

## Phase Progress

| Phase | Name | Milestone | Status |
|-------|------|-----------|--------|
| 1 | Foundation | v0.1 | ✅ Shipped |
| 2 | Authentication | v0.2 | ✅ Shipped |
| 3 | User Profile & Account | v0.3 | ✅ Shipped |
| 4 | Notebook Management | v0.4 | ✅ Shipped |
| 5 | Lessons & Pages | v0.5 | ◑ Planned (4 plans) |
| 6 | Canvas & Module Placement | v0.5 | ○ Pending |
| 7 | Text Building Blocks | v0.5 | ○ Pending |
| 8 | Chord Library | v0.5 | ○ Pending |
| 9 | Rich Building Blocks | v0.5 | ○ Pending |
| 10 | Styling System | v0.5 | ○ Pending |
| 11 | Notebook Index & PDF Export | v0.5 | ○ Pending |
| 12 | Localization & Polish | v0.5 | ○ Pending |

## Key Decisions Carried Forward

- AppLayout wraps all /app/* routes — foundational for all phases; never remove or restructure without updating all child routes
- authStore.updateUser is the pattern for syncing profile mutations; TanStack Query for all server state
- Feature-scoped API modules: `src/features/{feature}/api/{feature}Api.ts` — all calls via shared `src/api/client.ts`
- HU translation stubs deferred to Phase 12 — add HU stub keys for new strings but do not block on translations
- COVER_COLORS / NOTEBOOK_STYLE_PRESETS / NOTEBOOK_PAGE_SIZES exported as as-const arrays (erasableSyntaxOnly — no enum)
- Instrument hardcoded as "Guitar" in all Phase 4 UI (backend only supports 6-string guitar)
- extractErrorMessage inline per component — consistent with plan spec, prevents double-toast
- TanStack Query cache invalidation on mutation success is the established pattern for all list/detail data

## New Decisions for v0.5

- Lessons feature lives at `src/features/lessons/` — follows same feature-scoped structure as notebooks
- LessonPages feature shares `src/features/lessons/` (not a separate feature) — pages are subordinate to lessons
- API spec is now authoritative at `.planning/swagger.json` — consult before every plan to avoid endpoint mismatches
- Global page formula: cover=1, index=2, lessons start at 3 (cumulative by pageCount)

## Notes

- REQUIREMENTS.md covers Phase 5 only (LES-01–04, PAGE-01–02); Phase 6+ requirements written at next /gsd:new-milestone
- swagger.json saved at .planning/swagger.json — full API contract; must be consulted during plan-phase research to prevent v0.3-style 405 errors
- 4 open questions flagged in REQUIREMENTS.md (Q1–Q4) — resolve during /gsd:plan-phase 5 research
- Phase 4 left "Lessons" tab in NotebookPage.tsx as disabled — Phase 5 enables it
