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
- 🚧 **v0.3 User Profile & Account** — Phase 3 (in progress)
- 📋 **v0.4+** — Phases 4–12 (to be planned via `/gsd:new-milestone`)

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

</details>

### 🚧 v0.3 — User Profile & Account (Phase 3)

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 3 | User Profile & Account | AppLayout navbar, profile edit, avatar upload, account deletion | USER-01–04, NAV-01 | TBD |

### 📋 v0.4+ — Phases 4–12 (To be planned)

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 4 | Notebook Management | Notebook CRUD, dashboard, book navigation | NB-01–05, ERR-01–02 | TBD |
| 5 | Lessons & Pages | Lesson CRUD, multi-page lessons, page numbering | LES-01–04, PAGE-01–02 | TBD |
| 6 | Canvas & Module Placement | Dotted-grid canvas; place/drag/resize all 12 module types | CANVAS-01–06, MOD-01–05 | TBD |
| 7 | Text Building Blocks | All text/structured block editors, undo/redo, dirty guard | BB-01–06, BB-10–11 | TBD |
| 8 | Chord Library | Browse chords, fretboard diagrams, reusable chord selector | CHORD-01–03 | TBD |
| 9 | Rich Building Blocks | MusicalNotes, ChordProgression, ChordTablatureGroup editors | BB-07–09 | TBD |
| 10 | Styling System | Per-type module styles, system presets, user presets, StyleEditorDrawer | STYLE-01–06 | TBD |
| 11 | Notebook Index & PDF Export | Index page, nav drawer, async export pipeline, SignalR | IDX-01–02, PDF-01–05 | TBD |
| 12 | Localization & Polish | Full i18n coverage (en + hu), locale dates, language sync | I18N-01–02 | TBD |

---

## Phase Details (Phases 2–12)

### Phase 2: Authentication
**Goal:** Users can register, log in (email/password + Google), and the app silently restores auth state on page reload using the HttpOnly refresh cookie
**Mode:** mvp
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, ERR-03, ERR-04, I18N-03

**Success Criteria:**
1. User can register with email/displayName/password and lands on the notebooks dashboard immediately; no email verification step
2. User can log in with email/password (with and without Remember Me) and land on the dashboard; selecting Remember Me results in a 30-day session
3. User can click "Sign in with Google" and land on the dashboard after Google OAuth resolves
4. After a hard page reload, the app silently restores the authenticated session via `POST /auth/refresh` without showing the login screen
5. User can log out and is redirected to `/login` by `ProtectedRoute` without any `window.location` call; the auth store clears; concurrent 401s during a session share a single refresh request

---

### Phase 3: User Profile & Account
**Goal:** Persistent AppLayout with navbar; users can manage their profile, upload an avatar, and exercise the 30-day account deletion grace period
**Mode:** mvp
**Requirements:** USER-01, USER-02, USER-03, USER-04, NAV-01

**Success Criteria:**
1. Navbar renders with avatar button (image or initials fallback); dropdown shows "My Profile" and "Sign out"
2. User can view and update their profile (firstName, lastName, language, defaultPageSize, defaultInstrumentId) and the updated values persist after page reload; language change updates UI locale immediately
3. User can upload a custom avatar (JPG/PNG/WebP ≤ 2 MB) and see it reflected immediately in the navbar; Google users see their Google photo by default; local users see initials
4. User can request account deletion from the profile page; a deletion-pending warning banner appears showing the scheduled deletion date
5. User can cancel the scheduled account deletion; the warning banner disappears and a success toast confirms

---

### Phase 4: Notebook Management
**Goal:** Users can create, browse, configure, and delete notebooks; open a notebook and navigate it as a book (cover → index → lessons)
**Mode:** mvp
**Requirements:** NB-01, NB-02, NB-03, NB-04, NB-05, ERR-01, ERR-02

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
**Goal:** Each lesson page renders as a dotted-paper grid canvas; users can place, drag, resize, and layer all 12 module types
**Mode:** mvp
**Requirements:** CANVAS-01, CANVAS-02, CANVAS-03, CANVAS-04, CANVAS-05, CANVAS-06, MOD-01, MOD-02, MOD-03, MOD-04, MOD-05

**Success Criteria:**
1. Lesson page renders as a dotted-paper canvas at the correct grid dimensions for the notebook's page size (e.g. 42×59 for A4); dots are spaced at the correct 5mm equivalent in screen pixels
2. User can place a module of each of the 12 types on the canvas at a chosen grid position; modules render at their correct minimum size
3. User can drag a module to a new position and the position persists after the debounced PATCH completes; drag is smooth with optimistic UI
4. User can resize a module; the resize is blocked by the module type's minimum dimensions and the page boundary; a 422 response reverts the module to its previous position
5. Placing a module that overlaps an existing module is rejected immediately; Title module can only be created once per lesson (second attempt shows an error); Breadcrumb module content is always empty and cannot be edited

---

### Phase 7: Text Building Blocks
**Goal:** Full editors for all text-based and structured building block types; undo/redo; dirty-state navigation guard
**Mode:** mvp
**Requirements:** BB-01, BB-02, BB-03, BB-04, BB-05, BB-06, BB-10, BB-11

**Success Criteria:**
1. User can add and remove building blocks of all text-based types (SectionHeading, Text, BulletList, NumberedList, CheckboxList, Table, Date) and reorder them via drag-and-drop within the module editor
2. User can toggle bold on any text span in a Text, BulletList, NumberedList, or SectionHeading block; the cursor position is preserved; pasting text strips formatting (plain text only)
3. User can check and uncheck items in a CheckboxList block; the checked state persists after page reload
4. User can define columns and add rows in a Table block; column headers and cell content with bold spans save correctly
5. User can undo and redo content edits up to 50 steps; rapid typing is coalesced (150ms window); navigating away from a module with unsaved changes prompts the user and attempts a save flush first

---

### Phase 8: Chord Library
**Goal:** Users can browse the chord library, see fretboard diagrams, and use the chord selector from block editors
**Mode:** mvp
**Requirements:** CHORD-01, CHORD-02, CHORD-03

**Success Criteria:**
1. User can open the chord library page, filter by root note (12 notes) and quality, and see a grid of chord diagram thumbnails for 6-string guitar
2. Fretboard diagrams render correctly for all string states: open circle above nut, muted X above nut, filled dot at correct fret position, barre as a bar across the specified strings, baseFret label when above fret 1, optional finger numbers inside dots
3. Chord selector component can be opened from within a block editor (from ChordProgression or ChordTablatureGroup); user can search by root/quality and confirm a chord selection that populates the block

---

### Phase 9: Rich Building Blocks
**Goal:** MusicalNotes, ChordProgression, and ChordTablatureGroup block editors are fully functional
**Mode:** mvp
**Requirements:** BB-07, BB-08, BB-09

**Success Criteria:**
1. User can add a MusicalNotes block, select any sequence of notes from the 12-note chromatic scale, and see interval labels (S/W/number) auto-derived between consecutive notes
2. User can add a ChordProgression block with a time signature, sections with labels and repeat markers, and measures with chords and beat counts; an invalid beat sum (not matching numerator) is rejected with an inline error
3. User can add a ChordTablatureGroup block, add chords from the chord selector, and reorder diagrams by dragging within the group; fretboard diagrams render inside the module on the canvas

---

### Phase 10: Styling System
**Goal:** Per-type module styles per notebook, system presets, user-saved presets, and StyleEditorDrawer
**Mode:** mvp
**Requirements:** STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05, STYLE-06

**Success Criteria:**
1. Changing a module type style property (e.g. Theory background color) applies immediately and visibly to all Theory modules across the current notebook
2. Applying any of the 5 system presets (Classic, Colorful, Dark, Minimal, Pastel) replaces all 12 module type styles simultaneously and all modules on screen update
3. User can save the current notebook's styles as a named user preset and see it appear in the presets list
4. User can apply a user-saved preset to a different notebook; applying it replaces all 12 styles
5. `StyleEditorDrawer` opens from notebook settings, displays all 12 module types with their current styles, and persists changes correctly

---

### Phase 11: Notebook Index & PDF Export
**Goal:** Physical index page with global page numbers; sidebar navigation drawer; full async PDF export pipeline with SignalR
**Mode:** mvp
**Requirements:** IDX-01, IDX-02, PDF-01, PDF-02, PDF-03, PDF-04, PDF-05

**Success Criteria:**
1. Notebook index page renders on dotted paper with a table of contents showing lesson titles and their correct global start page numbers
2. Sidebar navigation drawer opens, lists all lessons with titles, and clicking a lesson navigates directly to its first page
3. User can trigger a whole-notebook PDF export; SignalR delivers a "Ready" notification and a download button appears without page refresh
4. User can trigger a single-lesson PDF export and download the PDF via the authenticated download endpoint (Bearer token in header)
5. Attempting to start a second export while one is Pending or Processing shows an error message; the polling fallback activates when SignalR is unavailable and polls every 3 seconds until Ready or Failed

---

### Phase 12: Localization & Polish
**Goal:** Full English + Hungarian localization; locale-aware dates; language preference synced to backend; no hardcoded strings
**Mode:** mvp
**Requirements:** I18N-01, I18N-02

**Success Criteria:**
1. User can switch the UI language to Hungarian from their profile; all visible UI strings update to Hungarian without page reload
2. Dates are formatted as `2025. február 23.` in Hungarian mode and `February 23, 2025` in English mode throughout the app
3. Language preference persists across sessions — the backend `language` field is updated on language change and restored from the user profile on next login
4. All toast notifications, error messages, and validation messages are available in both languages
5. No hardcoded visible strings remain in JSX (grep for common English UI phrases returns no source matches outside of i18n files)

---

## Progress

| Phase | Name | Milestone | Plans | Status | Completed |
|-------|------|-----------|-------|--------|-----------|
| 1 | Foundation | v0.1 | 5/5 | ✅ Complete | 2026-05-16 |
| 2 | Authentication | v0.2 | 4/4 | ✅ Shipped | 2026-05-16 |
| 3 | User Profile & Account | v0.3 | TBD | 🚧 Active | — |
| 4 | Notebook Management | v0.2+ | TBD | ○ Pending | — |
| 5 | Lessons & Pages | v0.2+ | TBD | ○ Pending | — |
| 6 | Canvas & Module Placement | v0.2+ | TBD | ○ Pending | — |
| 7 | Text Building Blocks | v0.2+ | TBD | ○ Pending | — |
| 8 | Chord Library | v0.2+ | TBD | ○ Pending | — |
| 9 | Rich Building Blocks | v0.2+ | TBD | ○ Pending | — |
| 10 | Styling System | v0.2+ | TBD | ○ Pending | — |
| 11 | Notebook Index & PDF Export | v0.2+ | TBD | ○ Pending | — |
| 12 | Localization & Polish | v0.2+ | TBD | ○ Pending | — |

## Requirement → Phase Index

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 2 |
| AUTH-02 | Phase 2 |
| AUTH-03 | Phase 2 |
| AUTH-04 | Phase 2 |
| AUTH-05 | Phase 2 |
| AUTH-06 | Phase 2 |
| USER-01 | Phase 3 |
| USER-02 | Phase 3 |
| USER-03 | Phase 3 |
| USER-04 | Phase 3 |
| NB-01 | Phase 4 |
| NB-02 | Phase 4 |
| NB-03 | Phase 4 |
| NB-04 | Phase 4 |
| NB-05 | Phase 4 |
| LES-01 | Phase 5 |
| LES-02 | Phase 5 |
| LES-03 | Phase 5 |
| LES-04 | Phase 5 |
| PAGE-01 | Phase 5 |
| PAGE-02 | Phase 5 |
| CANVAS-01 | Phase 6 |
| CANVAS-02 | Phase 6 |
| CANVAS-03 | Phase 6 |
| CANVAS-04 | Phase 6 |
| CANVAS-05 | Phase 6 |
| CANVAS-06 | Phase 6 |
| MOD-01 | Phase 6 |
| MOD-02 | Phase 6 |
| MOD-03 | Phase 6 |
| MOD-04 | Phase 6 |
| MOD-05 | Phase 6 |
| BB-01 | Phase 7 |
| BB-02 | Phase 7 |
| BB-03 | Phase 7 |
| BB-04 | Phase 7 |
| BB-05 | Phase 7 |
| BB-06 | Phase 7 |
| BB-10 | Phase 7 |
| BB-11 | Phase 7 |
| CHORD-01 | Phase 8 |
| CHORD-02 | Phase 8 |
| CHORD-03 | Phase 8 |
| BB-07 | Phase 9 |
| BB-08 | Phase 9 |
| BB-09 | Phase 9 |
| STYLE-01 | Phase 10 |
| STYLE-02 | Phase 10 |
| STYLE-03 | Phase 10 |
| STYLE-04 | Phase 10 |
| STYLE-05 | Phase 10 |
| STYLE-06 | Phase 10 |
| IDX-01 | Phase 11 |
| IDX-02 | Phase 11 |
| PDF-01 | Phase 11 |
| PDF-02 | Phase 11 |
| PDF-03 | Phase 11 |
| PDF-04 | Phase 11 |
| PDF-05 | Phase 11 |
| I18N-01 | Phase 12 |
| I18N-02 | Phase 12 |
| I18N-03 | Phase 2 |
| ERR-01 | Phase 4 |
| ERR-02 | Phase 4 |
| ERR-03 | Phase 2 |
| ERR-04 | Phase 2 |

**Coverage:** 57 v1 requirements mapped across 12 phases. Unmapped: 0 ✓
