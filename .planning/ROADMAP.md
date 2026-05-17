# Staccato — Roadmap

**Project:** Staccato Frontend SPA
**Granularity:** Fine (12 phases)
**Structure:** Vertical MVP — each phase delivers working user capability
**Total Requirements:** 57 v1 requirements
**Generated:** 2026-05-15

---

## Milestones

- ✅ **v0.1 Foundation** — Phase 1 (shipped 2026-05-16)
- ✅ **v0.2 Authentication** — Phase 2 (shipped 2026-05-16)
- ✅ **v0.3 User Profile & Account** — Phase 3 (shipped 2026-05-16)
- ✅ **v0.4 Notebook Management** — Phase 4 (shipped 2026-05-17)
- ✅ **v0.5 Lessons & Pages** — Phase 5 (shipped 2026-05-17)
- ⬜ **v0.6 TBD** — Phases 6+ (run `/gsd:new-milestone` to define)

---

## Phases

<details>
<summary>✅ v0.1 Foundation (Phase 1) — SHIPPED 2026-05-16</summary>

- [x] Phase 1: Foundation (5/5 plans) — completed 2026-05-16

See archive: `.planning/milestones/v0.1-ROADMAP.md`

</details>

<details>
<summary>✅ v0.2 Authentication (Phase 2) — SHIPPED 2026-05-16</summary>

- [x] Phase 2: Authentication (4/4 plans) — completed 2026-05-16
- Shipped directly to main (branching_strategy: none) — commits b9d80f2–14a9b41
- VERIFICATION.md: status:passed, 5/5 must-haves ✓, 10/10 UAT passed

See archive: `.planning/milestones/v0.2-ROADMAP.md`

</details>

<details>
<summary>✅ v0.3 User Profile & Account (Phase 3) — SHIPPED 2026-05-16</summary>

- [x] Phase 3: User Profile & Account (4/4 plans) — completed 2026-05-16
- Shipped directly to main (branching_strategy: none) — commits cd9f394–6180072
- VERIFICATION.md: status:passed, 5/5 success criteria ✓, 13/13 UAT passed

See archive: `.planning/milestones/v0.3-ROADMAP.md`

</details>

<details>
<summary>✅ v0.4 Notebook Management (Phase 4) — SHIPPED 2026-05-17</summary>

- [x] Phase 4: Notebook Management (4/4 plans) — completed 2026-05-17
- Shipped directly to main (branching_strategy: none) — commits 812acd6–c093bf1
- VERIFICATION.md: status:passed, 5/5 success criteria ✓, 26/26 tests passed, 7/7 requirements satisfied

See archive: `.planning/milestones/v0.4-ROADMAP.md`

</details>

<details>
<summary>✅ v0.5 Lessons & Pages (Phase 5) — SHIPPED 2026-05-17</summary>

- [x] Phase 5: Lessons & Pages (4/4 plans) — completed 2026-05-17
- Shipped directly to main (branching_strategy: none) — commits 033f8f3–aafb584
- VERIFICATION.md: status:passed, 5/5 success criteria ✓, 10/10 UAT passed, 6/6 requirements satisfied (LES-01–04, PAGE-01–02)

See archive: `.planning/milestones/v0.5-ROADMAP.md`

</details>

### ⬜ v0.6 TBD — Phases 6+ (Unassigned)

> Run `/gsd:new-milestone` to define the next milestone scope and requirements.

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 6 | Canvas & Module Placement | Dotted-grid canvas; place/drag/resize all 12 module types | CANVAS-01–06, MOD-01–05 | TBD |
| 7 | Text Building Blocks | All text/structured block editors, undo/redo, dirty guard | BB-01–06, BB-10–11 | TBD |
| 8 | Chord Library | Browse chords, fretboard diagrams, reusable chord selector | CHORD-01–03 | TBD |
| 9 | Rich Building Blocks | MusicalNotes, ChordProgression, ChordTablatureGroup editors | BB-07–09 | TBD |
| 10 | Styling System | Per-type module styles, system presets, user presets, StyleEditorDrawer | STYLE-01–06 | TBD |
| 11 | Notebook Index & PDF Export | Index page, nav drawer, async export pipeline, SignalR | IDX-01–02, PDF-01–05 | TBD |
| 12 | Localization & Polish | Full i18n coverage (en + hu), locale dates, language sync | I18N-01–02 | TBD |

---

## Phase Details (Phases 4–12)

### Phase 4: Notebook Management
**Goal:** Users can create, browse, configure, and delete notebooks; open a notebook and navigate it as a book (cover → index → lessons)
**Mode:** mvp
**Requirements:** NB-01, NB-02, NB-03, NB-04, NB-05, ERR-01, ERR-02
**Plans:** 4 plans

**Success Criteria:**
1. User can create a notebook (title, instrument, page size, cover color) and see it appear on the dashboard with the correct cover color and metadata
2. User can open a notebook and see the cover page first, followed by the (empty) index page
3. User can rename a notebook and change its cover color from notebook settings; changes reflect immediately in the dashboard
4. User can delete a notebook and see it removed from the dashboard; deletion is permanent (no undo prompt)
5. Sonner toast notifications appear correctly for mutation errors (not double-toasted); `PageErrorBoundary` catches page-level crashes without a white screen

---

### Phase 5: Lessons & Pages
**Goal:** Users can create and manage lessons within a notebook; add and delete pages; see correct global page numbers across the notebook
**Mode:** mvp
**Requirements:** LES-01, LES-02, LES-03, LES-04, PAGE-01, PAGE-02

**Success Criteria:**
1. User can create a lesson within a notebook and see it appear in the lesson list ordered by creation date; the first page is auto-created
2. User can rename a lesson and see the title update in the lesson list
3. User can delete a lesson; the lesson and all its pages and modules are removed
4. User can add a second page to a lesson; a soft warning toast appears when a lesson reaches 10 pages; the page counter increments
5. User cannot delete the last remaining page of a lesson (delete button disabled or shows an error); global page numbers display correctly across multiple lessons

---

### Phase 6: Canvas & Module Placement
**Goal:** The dotted-grid canvas renders; users can place, move, resize, and z-order all 12 module types on a lesson page
**Mode:** mvp
**Requirements:** CANVAS-01, CANVAS-02, CANVAS-03, CANVAS-04, CANVAS-05, CANVAS-06, MOD-01, MOD-02, MOD-03, MOD-04, MOD-05

---

### Phase 7: Text Building Blocks
**Goal:** All text and structured content building block editors are functional with undo/redo and dirty-state guard
**Mode:** mvp
**Requirements:** BB-01, BB-02, BB-03, BB-04, BB-05, BB-06, BB-10, BB-11

---

### Phase 8: Chord Library
**Goal:** Users can browse the chord library and select chords for use in chord building blocks
**Mode:** mvp
**Requirements:** CHORD-01, CHORD-02, CHORD-03

---

### Phase 9: Rich Building Blocks
**Goal:** MusicalNotes, ChordProgression, and ChordTablatureGroup editors are fully functional
**Mode:** mvp
**Requirements:** BB-07, BB-08, BB-09

---

### Phase 10: Styling System
**Goal:** Per-notebook, per-module-type visual styling with system presets, user presets, and StyleEditorDrawer
**Mode:** mvp
**Requirements:** STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05, STYLE-06

---

### Phase 11: Notebook Index & PDF Export
**Goal:** Notebook index page, navigation drawer, and async PDF export with SignalR progress
**Mode:** mvp
**Requirements:** IDX-01, IDX-02, PDF-01, PDF-02, PDF-03, PDF-04, PDF-05

---

### Phase 12: Localization & Polish
**Goal:** Full EN + HU i18n coverage; all HU stubs replaced; locale-aware date formatting; language preference synced from profile
**Mode:** mvp
**Requirements:** I18N-01, I18N-02
