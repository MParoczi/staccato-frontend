# Requirements: Staccato

**Defined:** 2026-05-15
**Core Value:** A musician can open a notebook, navigate to any lesson, add and arrange content on the dotted-paper canvas, and find exactly what they practiced — organized the way they think.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can register with email, displayName, and password; account created immediately with no email verification
- [ ] **AUTH-02**: User can log in with email and password, with optional Remember Me for 30-day session
- [ ] **AUTH-03**: User can sign in with Google OAuth; backend validates ID token and creates/finds account
- [ ] **AUTH-04**: On page load, frontend silently refreshes the access token from the HttpOnly cookie without user interaction
- [ ] **AUTH-05**: Access token is refreshed proactively before it expires via `useProactiveRefresh` hook
- [ ] **AUTH-06**: User can log out; refresh token is revoked; no page reload; React Router handles redirect

### User Profile & Account

- [ ] **USER-01**: User can update their profile (first name, last name, language, default page size, default instrument)
- [ ] **USER-02**: User can upload a custom avatar (JPG/PNG/WebP, max 2 MB); Google users default to Google photo; local users default to initials avatar
- [ ] **USER-03**: User can delete their account with a 30-day grace period; account remains usable; deletion-pending banner shown on profile
- [ ] **USER-04**: User can cancel a scheduled account deletion during the 30-day grace period

### Notebooks

- [ ] **NB-01**: User can create a notebook with title, instrument, page size, cover color, and initial style configuration (or default Colorful preset)
- [ ] **NB-02**: User can view a dashboard listing all their notebooks with cover color, title, instrument, lesson count
- [ ] **NB-03**: User can rename a notebook and change its cover color
- [ ] **NB-04**: User can delete a notebook (hard delete with all associated data)
- [ ] **NB-05**: User can navigate the notebook as a book: cover page → index page → lessons, with page-forward/backward navigation

### Lessons

- [ ] **LES-01**: User can create a lesson within a notebook; a first page is auto-created; lesson gets a title and creation timestamp
- [ ] **LES-02**: User can rename a lesson
- [ ] **LES-03**: User can delete a lesson (hard delete with all pages and modules)
- [ ] **LES-04**: Lessons are displayed in creation-date ascending order; no manual reordering

### Lesson Pages

- [ ] **PAGE-01**: User can add a new page to a lesson; soft warning shown at 10 pages (no hard block)
- [ ] **PAGE-02**: User can delete a page, provided it is not the last remaining page of the lesson

### Grid Canvas & Module Placement

- [ ] **CANVAS-01**: Each lesson page renders as a dotted-paper grid canvas (5mm dot spacing, dimensions per page size)
- [ ] **CANVAS-02**: User can place a new module on the canvas at a chosen grid position
- [ ] **CANVAS-03**: User can drag a module to a new position; layout saved via debounced PATCH (500ms minimum); 422 reverts optimistically
- [ ] **CANVAS-04**: User can resize a module; minimum dimensions enforced per module type; boundary and overlap validation
- [ ] **CANVAS-05**: User can change module z-order (bring forward / send back)
- [ ] **CANVAS-06**: Frontend validates overlap and boundary locally before sending layout PATCH, for immediate feedback

### Modules

- [ ] **MOD-01**: User can create any of the 12 module types on a page (Title, Breadcrumb, Subtitle, Theory, Practice, Example, Important, Tip, Homework, Question, ChordTablature, FreeText)
- [ ] **MOD-02**: User can delete a module
- [ ] **MOD-03**: Title module enforced as unique per lesson; placement on first page first position is a frontend convention
- [ ] **MOD-04**: Breadcrumb module auto-derives its content from all Subtitle modules in the same lesson; no user-editable content
- [ ] **MOD-05**: Module editor is opened by clicking/double-clicking a module; editor is lazy-loaded with a loading shell

### Building Blocks — Text & Structured Content

- [ ] **BB-01**: User can add, remove, and reorder building blocks within a module (drag-and-drop via `@dnd-kit/sortable`); only allowed block types shown per module type
- [ ] **BB-02**: `SectionHeading` and `Text` blocks: rich text editing with bold toggling via `TextSpanEditor` (contentEditable, no innerHTML, paste text/plain only)
- [ ] **BB-03**: `BulletList` and `NumberedList` blocks: item list editing with bold spans per item; rendered with bullet/number markers
- [ ] **BB-04**: `CheckboxList` block: list items with functional checkboxes; checked state persisted to backend
- [ ] **BB-05**: `Table` block: user-defined column headers and rows; cell content with bold spans
- [ ] **BB-06**: `Date` block: ISO 8601 date picker; rendered as locale-formatted date string; always plain (no bold)

### Building Blocks — Rich Content

- [ ] **BB-07**: `MusicalNotes` block: select note sequence from 12-note chromatic scale; interval type between consecutive notes auto-derived and rendered
- [ ] **BB-08**: `ChordProgression` block: time signature, sections with labels and repeat markers, measures with chord beats; beat sum validated against time signature numerator
- [ ] **BB-09**: `ChordTablatureGroup` block: ordered list of fretboard diagrams; user can reorder diagrams within the group
- [ ] **BB-10**: Module content undo/redo: 50-step history, 150ms typing-burst coalescing; whole-module granularity
- [ ] **BB-11**: Dirty-state navigation guard: on leaving unsaved module, attempts one save flush then prompts user; `beforeunload` registered

### Chord Library

- [ ] **CHORD-01**: User can browse the chord library filtered by root note and quality (6-string guitar)
- [ ] **CHORD-02**: Fretboard diagrams rendered correctly: open/muted/fretted strings, barre, 5-fret window, baseFret label, optional finger numbers
- [ ] **CHORD-03**: Chord selector component: instrument → root → quality → results grid of diagram thumbnails; reused by ChordProgression and ChordTablatureGroup block editors

### Styling System

- [ ] **STYLE-01**: Each notebook has 12 module type styles (background, border style/color/width/radius, header bg/text color, body text color, font family)
- [ ] **STYLE-02**: Changing a module type style applies immediately to all instances of that type across the entire notebook
- [ ] **STYLE-03**: 5 system presets (Classic, Colorful, Dark, Minimal, Pastel); applying one replaces all 12 styles simultaneously
- [ ] **STYLE-04**: User can save a notebook's current style configuration as a named user preset (stored at account level)
- [ ] **STYLE-05**: User can apply any system or user-saved preset to any of their notebooks
- [ ] **STYLE-06**: `StyleEditorDrawer` allows in-app style configuration per notebook at any time

### Notebook Index

- [ ] **IDX-01**: Physical index page rendered as dotted paper with a table of contents: lesson titles and their global start page numbers; read-only in web UI
- [ ] **IDX-02**: Sidebar navigation drawer listing all lessons; clicking a lesson jumps directly to its first page; excluded from PDF export

### PDF Export

- [ ] **PDF-01**: User can trigger export for whole notebook, a single lesson, or a selection of lessons
- [ ] **PDF-02**: Export is asynchronous; SignalR pushes `PdfReady`/`PdfFailed` events; 3-second polling fallback when SignalR unavailable
- [ ] **PDF-03**: User can download the completed PDF via an authenticated endpoint (Bearer token, never URL query string)
- [ ] **PDF-04**: Only one active export allowed per notebook (409 returned for concurrent attempts)
- [ ] **PDF-05**: Exported PDF content: cover page (cover color, title, instrument, owner, date), index page (for multi-lesson), all lesson pages at exact grid positions with styles

### Localization

- [ ] **I18N-01**: All visible UI strings via `t(key)` (i18next); no hardcoded text; English and Hungarian maintained in parallel (`en.json` + `hu.json`)
- [ ] **I18N-02**: Language preference is synced with the backend via `PUT /users/me`; date formatting respects locale
- [ ] **I18N-03**: `Accept-Language` header injected automatically by Axios interceptor from `i18next.language`

### Error Handling & Infrastructure

- [ ] **ERR-01**: Business rule errors surfaced as sonner toast notifications; no double-toast (hook OR component, not both)
- [ ] **ERR-02**: Page-level errors handled by `PageErrorBoundary`
- [ ] **ERR-03**: Auth refresh failures call `clearAuth()` and let `ProtectedRoute` handle redirect — never `window.location.href`
- [ ] **ERR-04**: Retry logic retries 5xx/network errors up to 3×; never retries 4xx responses

## v2 Requirements

### Notifications
- **NOTIF-01**: In-app and email notifications for user events (follows, comments)
- **NOTIF-02**: User-configurable notification preferences

### Moderation
- **MODR-01**: Content reporting and admin moderation tools

### Mobile / PWA
- **PWA-01**: Progressive Web App polish and offline support

### Collaboration
- **COLLAB-01**: Real-time multi-user collaborative editing
- **COLLAB-02**: Public link sharing and permissions system

### Extended Chord Library
- **CHORD-V2-01**: Chord data for instruments beyond 6-string guitar (7-string, bass, ukulele, banjo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Realtime multi-user collaboration | Requires separate backend design; not in v1 scope |
| Public link sharing / permissions | Not in v1 target user story |
| Native mobile apps | Web-first; PWA polish deferred to v2 |
| Backend implementation | Separate repository; already defined |
| Built-in chord/scale stock content library | Chord library is guitar-only, read-only |
| Music-theory tutoring / AI-assisted content | Out of scope for all versions |
| Audio playback / DAW features | Out of scope |
| Score engraving export (MusicXML, MIDI) | Out of scope |
| Multi-user / teacher features | Primary user is individual learner |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 — Authentication | Pending |
| AUTH-02 | Phase 2 — Authentication | Pending |
| AUTH-03 | Phase 2 — Authentication | Pending |
| AUTH-04 | Phase 2 — Authentication | Pending |
| AUTH-05 | Phase 2 — Authentication | Pending |
| AUTH-06 | Phase 2 — Authentication | Pending |
| USER-01 | Phase 3 — User Profile & Account | Pending |
| USER-02 | Phase 3 — User Profile & Account | Pending |
| USER-03 | Phase 3 — User Profile & Account | Pending |
| USER-04 | Phase 3 — User Profile & Account | Pending |
| NB-01 | Phase 4 — Notebook Management | Pending |
| NB-02 | Phase 4 — Notebook Management | Pending |
| NB-03 | Phase 4 — Notebook Management | Pending |
| NB-04 | Phase 4 — Notebook Management | Pending |
| NB-05 | Phase 4 — Notebook Management | Pending |
| LES-01 | Phase 5 — Lessons & Pages | Pending |
| LES-02 | Phase 5 — Lessons & Pages | Pending |
| LES-03 | Phase 5 — Lessons & Pages | Pending |
| LES-04 | Phase 5 — Lessons & Pages | Pending |
| PAGE-01 | Phase 5 — Lessons & Pages | Pending |
| PAGE-02 | Phase 5 — Lessons & Pages | Pending |
| CANVAS-01 | Phase 6 — Canvas & Module Placement | Pending |
| CANVAS-02 | Phase 6 — Canvas & Module Placement | Pending |
| CANVAS-03 | Phase 6 — Canvas & Module Placement | Pending |
| CANVAS-04 | Phase 6 — Canvas & Module Placement | Pending |
| CANVAS-05 | Phase 6 — Canvas & Module Placement | Pending |
| CANVAS-06 | Phase 6 — Canvas & Module Placement | Pending |
| MOD-01 | Phase 6 — Canvas & Module Placement | Pending |
| MOD-02 | Phase 6 — Canvas & Module Placement | Pending |
| MOD-03 | Phase 6 — Canvas & Module Placement | Pending |
| MOD-04 | Phase 6 — Canvas & Module Placement | Pending |
| MOD-05 | Phase 6 — Canvas & Module Placement | Pending |
| BB-01 | Phase 7 — Text Building Blocks | Pending |
| BB-02 | Phase 7 — Text Building Blocks | Pending |
| BB-03 | Phase 7 — Text Building Blocks | Pending |
| BB-04 | Phase 7 — Text Building Blocks | Pending |
| BB-05 | Phase 7 — Text Building Blocks | Pending |
| BB-06 | Phase 7 — Text Building Blocks | Pending |
| BB-10 | Phase 7 — Text Building Blocks | Pending |
| BB-11 | Phase 7 — Text Building Blocks | Pending |
| CHORD-01 | Phase 8 — Chord Library | Pending |
| CHORD-02 | Phase 8 — Chord Library | Pending |
| CHORD-03 | Phase 8 — Chord Library | Pending |
| BB-07 | Phase 9 — Rich Building Blocks | Pending |
| BB-08 | Phase 9 — Rich Building Blocks | Pending |
| BB-09 | Phase 9 — Rich Building Blocks | Pending |
| STYLE-01 | Phase 10 — Styling System | Pending |
| STYLE-02 | Phase 10 — Styling System | Pending |
| STYLE-03 | Phase 10 — Styling System | Pending |
| STYLE-04 | Phase 10 — Styling System | Pending |
| STYLE-05 | Phase 10 — Styling System | Pending |
| STYLE-06 | Phase 10 — Styling System | Pending |
| IDX-01 | Phase 11 — Index & PDF Export | Pending |
| IDX-02 | Phase 11 — Index & PDF Export | Pending |
| PDF-01 | Phase 11 — Index & PDF Export | Pending |
| PDF-02 | Phase 11 — Index & PDF Export | Pending |
| PDF-03 | Phase 11 — Index & PDF Export | Pending |
| PDF-04 | Phase 11 — Index & PDF Export | Pending |
| PDF-05 | Phase 11 — Index & PDF Export | Pending |
| I18N-01 | Phase 12 — Localization & Polish | Pending |
| I18N-02 | Phase 12 — Localization & Polish | Pending |
| I18N-03 | Phase 2 — Authentication | Pending |
| ERR-01 | Phase 4 — Notebook Management | Pending |
| ERR-02 | Phase 4 — Notebook Management | Pending |
| ERR-03 | Phase 2 — Authentication | Pending |
| ERR-04 | Phase 2 — Authentication | Pending |

**Coverage:**
- v1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after initial definition*
