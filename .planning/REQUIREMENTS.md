# Staccato Frontend — REQUIREMENTS.md

*Last updated: 2026-04-28 after initialization*

> **REQ-ID format:** `[CATEGORY]-[NUMBER]`. Each requirement maps to exactly one phase in `ROADMAP.md`. Speckit feature numbers (F1–F17) are noted in parentheses for cross-reference.

## v1 Requirements

### Validated (already shipped)

#### Infrastructure

- [x] **INFRA-01** — *(F1)* Vite 8 + React 19 + TS strict + ESLint flat config + Vitest scaffold; path alias `@/* → src/*`; Tailwind v4 CSS-first config; shadcn/ui set up (style: radix-nova, baseColor: neutral); pnpm workflow; `index.html` SPA shell.

#### Authentication

- [x] **AUTH-01** — *(F2)* User can register with email/password and log in via email/password.
- [x] **AUTH-02** — *(F2)* User can sign in with Google OAuth (`@react-oauth/google`).
- [x] **AUTH-03** — *(F2)* Access token kept in Zustand memory; refresh token in backend-managed httpOnly cookie. `withCredentials: true` on the Axios instance.
- [x] **AUTH-04** — *(F2)* On 401, response interceptor calls `silentRefresh()` (single-flight) via `raw-client`, retries the original request, and clears auth on terminal failure. Concurrent 401s share one refresh promise.
- [x] **AUTH-05** — *(F2)* `ProtectedRoute` guards `/app/*`, attempts silent refresh on cold mount, shows a loader during refresh, redirects to `/login` on refresh failure (no full-page reload).
- [x] **AUTH-06** — *(F2)* Proactive refresh timer (`useProactiveRefresh`) refreshes ahead of `expiresAt`.

#### Profile

- [x] **PROFILE-01** — *(F3)* User can view and edit profile (name, email, language). Updates flow through TanStack Query mutations.
- [x] **PROFILE-02** — *(F3)* Language switch updates i18next locale, Axios `Accept-Language` header, and the user's profile language preference (`PUT /users/me`).

#### Notebook Dashboard

- [x] **NOTEBOOK-01** — *(F4)* User can list, create, and delete notebooks from the dashboard.
- [x] **NOTEBOOK-02** — *(F4)* Create-notebook dialog uses RHF + Zod and respects the user's default instrument & page size.

#### Notebook Shell & Navigation

- [x] **NAV-01** — *(F5)* Notebook shell with cover page, index page, and per-page lesson view.
- [x] **NAV-02** — *(F5)* Prev/next page navigation (buttons + keyboard) within and across lessons.
- [x] **NAV-03** — *(F5)* Global page-number badge in the toolbar reflects current position.

#### App Navigation Sidebar

- [x] **SIDEBAR-01** — *(F6)* App sidebar with notebooks list, profile menu, exports, chords entry points.

#### Styling System

- [x] **STYLE-01** — *(F7)* Per-notebook module style records persisted server-side; user-editable via `StyleEditorDrawer`.
- [x] **STYLE-02** — *(F7)* User-savable presets in the styling system.

#### Grid Canvas & Module Placement

- [x] **CANVAS-01** — *(F8)* Modules can be placed, dragged, resized, and snapped on the grid canvas using `@dnd-kit/core`.
- [x] **CANVAS-02** — *(F8)* Grid constants centralized in `src/lib/constants/grid.ts`; module constants in `modules.ts`.

#### Stabilization

- [x] **STAB-01** — All 15 items in `issues/bug-audit-2026-04.md` resolved.

### Active (pending — mapped to phases)

#### Module Content Editor (Core)

- [x] **EDIT-01** — *(F9)* Inline rich-text/structured editor mounted inside a placed module, with save/cancel, autosave, undo/redo, and dirty-state guards. Uses RHF for the form layer, integrates with the existing module styling system. ✓ **Shipped 2026-04-30 in Phase 1.**
  - Mapped to: **Phase 1**

#### Building Blocks (Phase A)

- [ ] **BLOCK-01** — *(F10)* Text and list building blocks (paragraph, ordered list, unordered list, headings) renderable inside a module. Server-persisted block tree.
  - Mapped to: **Phase 2**
- [ ] **BLOCK-02** — *(F11)* Table building block (rows × columns, cell editing, header row toggle, alignment).
  - Mapped to: **Phase 3**

#### Building Blocks (Phase B — Music)

- [ ] **BLOCK-03** — *(F12)* Musical notes building block: note + rest input, durations, accidentals, time-signature/staff context, basic engraving.
  - Mapped to: **Phase 4**

#### Chord System

- [ ] **CHORD-01** — *(F13)* Chord library browser route + fretboard renderer component (configurable instrument tuning, fret count, chord shape display).
  - Mapped to: **Phase 5**
- [ ] **CHORD-02** — *(F14)* Chord progression building block (chord-symbol sequence with optional bar/measure grouping, transposition).
  - Mapped to: **Phase 6**
- [ ] **CHORD-03** — *(F15)* Chord tablature group building block (multiple chord shapes shown as fretboard tabs side-by-side).
  - Mapped to: **Phase 7**

#### Misc Blocks

- [ ] **BLOCK-04** — *(F16)* Breadcrumb module: lightweight nav-style module showing notebook → lesson → page context inside the canvas.
  - Mapped to: **Phase 8**

#### Output

- [ ] **EXPORT-01** — *(F17)* PDF export of a notebook/lesson with backend-driven render; UI shows progress via SignalR (`@microsoft/signalr`); export history visible at `/app/exports`.
  - Mapped to: **Phase 9**

#### Continuous Stabilization Track

- [ ] **STAB-02** — Stabilization track folded into phases as warranted: add `eslint-plugin-jsx-a11y`, set Vitest coverage threshold (≥ 60% lines), wire MSW handlers + `setupServer()` in `src/test-setup.ts`, route-level code splitting via `React.lazy()`, dynamic-import the SignalR client only on authenticated routes, audit `@microsoft/signalr` bundle size with `rollup-plugin-visualizer`.
  - Mapped to: **Continuous** (touched during phases as opportune; verified at end of milestone)

## v2 Requirements (deferred)

- **TEACHER-01** — Multi-author notebook authoring + permissions for instructors.
- **PRACTICE-01** — Practice timers, streaks, repetition logs.
- **SHARE-01** — Public link sharing of read-only notebooks.
- **PWA-01** — Mobile-first / PWA polish (offline cache, installable, responsive canvas).
- **REALTIME-01** — Realtime multi-user collaborative editing (separate from F17's export-progress SignalR usage).

## Out of Scope (explicit exclusions)

- **Native mobile apps** — web only. PWA polish (v2) is the path.
- **Backend implementation** — separate repo. Backend coordination items raised as issues, not implemented here.
- **Built-in chord/scale stock content** — engine is present (`presets.ts`); mass-authored content is not v1.
- **Music-theory tutoring layer** — Staccato hosts user-authored content; it does not author content for the user.
- **Audio playback / DAW features** — beyond scope of a notebook app.
- **Score engraving export** (MusicXML, MIDI, MEI) — PDF only in v1.
- **AI-assisted content** — out of scope for v1.

## Traceability

| REQ-ID       | Speckit Feature                                            | Status     | Phase  |
|--------------|------------------------------------------------------------|------------|--------|
| INFRA-01     | F1 — Project Infrastructure                                | ✓ Validated | —     |
| AUTH-01..06  | F2 — Authentication & Token Management                     | ✓ Validated | —     |
| PROFILE-01..02 | F3 — User Profile & Settings                             | ✓ Validated | —     |
| NOTEBOOK-01..02 | F4 — Notebook Dashboard                                 | ✓ Validated | —     |
| NAV-01..03   | F5 — Notebook Shell & Navigation                           | ✓ Validated | —     |
| SIDEBAR-01   | F6 — App Navigation Sidebar                                | ✓ Validated | —     |
| STYLE-01..02 | F7 — Styling System                                        | ✓ Validated | —     |
| CANVAS-01..02 | F8 — Grid Canvas & Module Placement                       | ✓ Validated | —     |
| STAB-01      | (none — internal stabilization)                            | ✓ Validated | —     |
| EDIT-01      | F9 — Module Content Editor (Core)                          | ✓ Validated | 1      |
| BLOCK-01     | F10 — Text & List Building Blocks                          | Active     | 2      |
| BLOCK-02     | F11 — Table Building Block                                 | Active     | 3      |
| BLOCK-03     | F12 — Musical Notes Building Block                         | Active     | 4      |
| CHORD-01     | F13 — Chord Library & Fretboard Renderer                   | Active     | 5      |
| CHORD-02     | F14 — Chord Progression Building Block                     | Active     | 6      |
| CHORD-03     | F15 — Chord Tablature Group Building Block                 | Active     | 7      |
| BLOCK-04     | F16 — Breadcrumb Module                                    | Active     | 8      |
| EXPORT-01    | F17 — PDF Export & SignalR                                 | Active     | 9      |
| STAB-02      | (continuous — see CONCERNS.md)                             | Active     | cont.  |

**Coverage:** 100% of active v1 requirements mapped to phases. Continuous track has no fixed phase but is required to ship before the milestone is marked complete.

