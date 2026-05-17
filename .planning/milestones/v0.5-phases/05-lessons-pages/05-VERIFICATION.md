---
phase: "05"
phase-name: "Lessons & Pages"
status: pass
verified-by: human
verified-at: 2026-05-17
total-tests: 10
passed: 10
failed: 0
requirements-covered: [LES-01, LES-02, LES-03, LES-04, PAGE-01, PAGE-02]
---

# Phase 5 — Lessons & Pages: Verification

**Goal:** Users can create and manage lessons within a notebook, navigate between lesson pages using a page-flip shell, add/delete pages with a soft 10-page warning, and see correct global page numbers.

**Result:** ✅ PASS — 10/10 UAT tests passed, all 6 requirements covered, 4 bugs found and fixed during testing.

---

## UAT Results

| Test | Requirement | Description | Status |
|------|-------------|-------------|--------|
| T-01 | LES-04 | Lessons tab navigation — tab visible, loads `/lessons` route without crash | ✅ Passed |
| T-02 | LES-01 | Empty state — icon, heading, and "New Lesson" CTA shown when no lessons exist | ✅ Passed |
| T-03 | LES-01 | Create lesson and auto-navigate — dialog → submit → routed to new lesson | ✅ Passed |
| T-04 | LES-04 | Lesson page shell and controls bar — back link, title, page counter, global page number, prev/next, add/delete | ✅ Passed |
| T-05 | LES-02 | Rename lesson — ⋮ menu → pre-filled dialog → updated title appears immediately in list and lesson | ✅ Passed |
| T-06 | LES-03 | Delete lesson with confirmation — dialog shows name + "can't be undone" → lesson removed from list | ✅ Passed |
| T-07 | PAGE-01 | Add page and navigate to new page — count increments, view navigates to new last page | ✅ Passed |
| T-08 | PAGE-02 | Delete page disabled on last page; 2+ pages delete navigates to adjacent page | ✅ Passed |
| T-09 | PAGE-01 | 10-page soft warning toast — toast appears when adding 11th page; page still added | ✅ Passed |
| T-10 | LES-04 | 3-level Navbar breadcrumb — Notebooks › [Notebook] › [Lesson]; both links navigate correctly | ✅ Passed |

---

## Bugs Found and Fixed During UAT

| # | Test | Issue | Fix Applied |
|---|------|-------|-------------|
| 1 | T-04 | "Notebook p. 0" — global page number showed 0 | Backend uses 0-indexed `globalPageStart`; added `+1` to computed value in `LessonPage.tsx` |
| 2 | T-04 | Dotted-grid canvas not rendering | `hsl(var(--muted-foreground) / 0.25)` invalid in Tailwind v4 (oklch tokens); switched to `color-mix(in oklch, var(--muted-foreground) 25%, transparent)` |
| 3 | T-07 | Adding a page caused NaN in URL and broke navigation | `newPage.pageNumber` undefined (backend field mismatch); switched to `totalPages + 1` computed client-side |
| 4 | T-05 | After rename, old title showed on LessonPage without refresh | `RenameLessonDialog` only invalidated `['lessons', notebookId]`; added `['lesson', lessonId]` invalidation |

---

## Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| LES-01 | Create lesson with title; auto-navigate to lesson | ✅ Covered (T-02, T-03) |
| LES-02 | Rename lesson; updated title reflected immediately | ✅ Covered (T-05) |
| LES-03 | Delete lesson with confirmation dialog | ✅ Covered (T-06) |
| LES-04 | Lessons tab, lesson page shell, breadcrumb navigation | ✅ Covered (T-01, T-04, T-10) |
| PAGE-01 | Add page with auto-navigate; soft 10-page warning toast | ✅ Covered (T-07, T-09) |
| PAGE-02 | Delete page disabled on last page; navigate to adjacent page | ✅ Covered (T-08) |

---

## Backend Discoveries

- `globalPageStart` is 0-indexed (value 0 = first lesson, no preceding pages)
- `POST /lessons/{id}/pages` response does not include a `pageNumber` field matching the frontend's `LessonPage` type

---

## Known Stubs / Deferred Items

- `public/locales/hu/lessons.json`: All string values are `__HU_TODO__` — intentional, deferred to Phase 12
- Lesson canvas area (`LessonPage.tsx`) is a CSS-only dotted-grid placeholder — content modules are deferred to Phase 6+
