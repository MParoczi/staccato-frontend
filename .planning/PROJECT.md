# Staccato

## What This Is

Staccato is a web application for musicians to create and manage digital learning notebooks — tracking their progress in instrument learning through a structured, free-form 2D canvas that mirrors the feel of a physical dotted-paper notebook. Users organize lessons inside notebooks, place content modules on a grid canvas, use a chord library for fretboard diagrams, and export notebooks to PDF.

The frontend is a React 19 + TypeScript SPA consuming an ASP.NET Core 10 WebAPI backend (separate repository). All architecture and technology decisions are pre-determined and documented in the v2.1 specification.

## Core Value

A musician can open a notebook, navigate to any lesson, add and arrange content on the dotted-paper canvas, and find exactly what they practiced — organized the way they think, not the way software thinks.

## Current State

**Active:** v0.5 Lessons & Pages (started 2026-05-17)

Phase 5 requirements defined (LES-01–04, PAGE-01–02). API swagger.json saved to `.planning/swagger.json` as the authoritative contract for all remaining phases. Ready for `/gsd:plan-phase 5`.

**Last shipped:** v0.4 Notebook Management (2026-05-17)

Users can create and manage notebooks from a responsive dashboard, configure notebooks (title, cover color, style preset), open any notebook to see its cover page and empty index, and delete notebooks with an irreversible confirmation. The `PageErrorBoundary` protects all page routes from crashes. TanStack Query is established as the server-state pattern for all future phases.

**Tech stack as of Phase 4:**
- Vite 8.0.13 + React 19.2.6 + TypeScript 5.9.3
- Tailwind v4 CSS-first (no tailwind.config.js)
- shadcn radix-nova (17 UI components)
- Zustand 5.0.13, TanStack Query 5.100.10, Axios 1.16.1
- React Router 7.15.1, i18next 26.2.0 (http-backend, 8 namespaces, notebook keys added)
- @react-oauth/google, @hookform/resolvers 3.10.0, zod 3.24.4
- Vitest + Testing Library (26 tests)
- react-hook-form 7.75.0

## Next Milestone

**v0.5 — Lessons & Pages** *(active)*

Goal: Users can create and manage lessons within a notebook; add and delete pages; see correct global page numbers.

Scope: Phase 5 (Lessons & Pages) — requirements defined; plan via `/gsd:plan-phase 5`
Requirements: LES-01–04, PAGE-01–02 (see `.planning/REQUIREMENTS.md`)

## Requirements

### Validated

- ✓ Infrastructure platform (Vite, TypeScript strict, Tailwind v4, shadcn) — v0.1
- ✓ authStore in-memory only (no persist, no localStorage) — v0.1, confirmed by tests
- ✓ Single Axios instance with single-flight 401 refresh — v0.1, confirmed by tests
- ✓ i18n bootstrap with Accept-Language header on every request — v0.1, confirmed by tests
- ✓ ProtectedRoute with loading spinner (no flash-of-login) — v0.1, confirmed by tests
- ✓ pnpm-only package management enforced — v0.1
- ✓ Authentication: local email/password registration and login with JWT + HttpOnly refresh cookie strategy — Phase 2
- ✓ Google OAuth login via `@react-oauth/google` — Phase 2
- ✓ Silent token refresh on page load and proactive refresh before expiry — Phase 2
- ✓ Persistent AppLayout + Navbar on all `/app/*` routes with avatar dropdown — Phase 3 (NAV-01)
- ✓ User profile edit: firstName, lastName, language, defaultPageSize, defaultInstrumentId — Phase 3 (USER-01)
- ✓ Avatar upload (JPG/PNG/WebP ≤ 2 MB) with initials fallback — Phase 3 (USER-02)
- ✓ Account deletion request with 30-day grace period and banner — Phase 3 (USER-03)
- ✓ Cancel scheduled account deletion from banner — Phase 3 (USER-04)
- ✓ Notebook dashboard with grid, empty state, skeleton loading — Phase 4 (NB-01)
- ✓ Create notebook (title, instrument, page size, cover color, style preset) — Phase 4 (NB-02)
- ✓ Rename notebook and change cover color; dashboard reflects immediately — Phase 4 (NB-03)
- ✓ Delete notebook with irreversible confirmation dialog — Phase 4 (NB-04)
- ✓ Notebook book view (cover page, empty index page, tab navigation, Navbar breadcrumb) — Phase 4 (NB-05)
- ✓ Mutation errors surface as exactly one Sonner toast per failure — Phase 4 (ERR-01)
- ✓ `PageErrorBoundary` catches page crashes without white screen — Phase 4 (ERR-02)

### Active

- [ ] Lesson CRUD within a notebook, ordered by creation date
- [ ] Multi-page lessons: add/delete pages with soft 10-page warning
- [ ] 2D dotted-grid canvas: place, drag, resize, and z-order modules
- [ ] 12 module types with per-type minimum dimensions and building block allow-lists
- [ ] 10 building block types with full editor UI (text, lists, tables, chord diagrams, progressions, musical notes, checkboxes)
- [ ] Breadcrumb module auto-generation from subtitle modules
- [ ] Title module uniqueness constraint and lesson-first-page placement
- [ ] Module content undo/redo (50-step history, 150ms burst coalescing)
- [ ] Dirty-state navigation guard with save-flush attempt before prompt
- [ ] NotebookModuleStyle system: per-notebook, per-module-type visual configuration
- [ ] 5 system style presets (Classic, Colorful, Dark, Minimal, Pastel)
- [ ] User-saved style presets (account-level, apply to any notebook)
- [ ] StyleEditorDrawer for in-app style configuration
- [ ] Chord library: browse by instrument, root, quality; fretboard diagram rendering
- [ ] Chord selector UI reused by ChordProgression and ChordTablatureGroup editors
- [ ] Notebook index: physical index page + sidebar navigation drawer
- [ ] Global page numbering formula across the notebook
- [ ] PDF export: async pipeline, SignalR progress push, polling fallback
- [ ] Export scoping: whole notebook / single lesson / selected lessons
- [ ] English and Hungarian localization (all strings via i18next, HU stubs in place)
- [ ] Error handling: RFC 7807 infrastructure errors + business rule error codes

### Out of Scope

- Realtime multi-user collaborative editing — requires separate backend design
- Public link sharing / permissions system — not in v1 scope
- Native mobile apps (PWA polish deferred to v2)
- Backend implementation — separate repository, already exists
- Built-in chord/scale stock content library — chord library covers guitar only for now
- Music-theory tutoring or AI-assisted content — out of scope
- Audio playback / DAW features — out of scope
- Score engraving export (MusicXML, MIDI) — out of scope
- Music teachers, gigging musicians, multi-user collaboration — out of scope for target user

## Context

The backend (ASP.NET Core 10 WebAPI) is a separate repository and already defined. The frontend consumes it via a fully documented REST API. No backend changes are in scope — all decisions must adapt to the existing API contracts.

The specification (v2.1, 2026-05-15) is the authoritative source. It covers every API endpoint, request/response shape, enum value, business rule, error code, and architectural decision in detail. GSD agents treat it as ground truth.

**Codebase as of v0.3:** ~27 hand-written source files, ~5 900 LOC (TypeScript + JSON locales). Core patterns established: feature-scoped API modules, authStore-driven user state, TanStack Query for server state, Zod + react-hook-form for validated forms.

**Open backend gaps:**
- HttpOnly refresh cookie not invalidated on logout (backend fix pending in separate repo)
- `GET /instruments` endpoint shape assumed; update `InstrumentOption` interface if it changes

## Constraints

- **Package manager**: pnpm only — do not use npm or yarn
- **TypeScript**: `erasableSyntaxOnly: true` — no `enum`, no namespaces, no parameter properties; use `as const` unions instead
- **TypeScript**: `verbatimModuleSyntax: true` — `import type { … }` required for type-only imports
- **Auth token storage**: Access token in Zustand memory only — never `localStorage`, never `sessionStorage`, no `persist` middleware on `authStore`
- **HTTP client**: Single shared Axios instance (`src/api/client.ts`) — never `axios.create` ad-hoc in features
- **Navigation**: Never `window.location.href` — always React Router programmatic navigation
- **XSS**: Never `dangerouslySetInnerHTML`, never `execCommand`, paste reads `text/plain` only
- **Icons**: Lucide React only — no other icon sets
- **Tailwind**: v4 CSS-first — all tokens in `src/index.css`, no `tailwind.config.js`
- **Cross-feature imports**: Not allowed between `src/features/*` siblings
- **SignalR bundle**: Must be dynamically imported — never eagerly bundled
- **Instrument**: Backend currently has chord data for 6-string guitar only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Token in Zustand memory, no persist | XSS posture — token not accessible via script injection | ✓ Good — confirmed by authStore.test.ts |
| HttpOnly cookie for refresh token | Cookie not accessible to JS; SameSite=Strict prevents CSRF | ✓ Good — architecture in place |
| Single-flight refresh pattern | Concurrent 401s share one refresh request — no stampede | ✓ Good — module-level Promise in client.ts |
| rawClient for auth/refresh | Prevents circular refresh loop in response interceptor | ✓ Good — implemented + tested |
| AppLayout as pathless nested layout | All /app/* routes get navbar; ProtectedRoute unchanged | ✓ Good — established pattern for all future phases |
| authStore.updateUser for profile mutations | Syncs in-memory user state without triggering re-auth | ✓ Good — used by ProfilePage on save + avatar upload |
| Feature-scoped API modules (profileApi.ts) | Profile API isolated to features/profile/api/; no cross-feature coupling | ✓ Good — established for Phase 4+ |
| Zod + react-hook-form for ProfilePage | Consistent with auth forms; zodResolver wires validation | ✓ Good — pattern confirmed |
| Language change via i18next.changeLanguage() on save | No page reload; immediate UI update | ✓ Good — UAT test 9 confirmed |
| TanStack Query for all server state | Avoids duplicating server collections in Zustand | ✓ Good — confirmed in Phase 4 (notebooks CRUD, dashboard, book view) |
| dnd-kit for canvas drag/drop | Required for free-form 2D module placement and block reorder | — Pending (Phase 6+) |
| ModuleEditor lazy-loaded via React.lazy | Editor chunk ~30 kB; silences rolldown INEFFECTIVE_DYNAMIC_IMPORT | — Pending (Phase 6+) |
| Content save debounced 1000ms | Reduces API calls during active editing | — Pending (Phase 7+) |
| Undo/redo at whole-module granularity | Simpler than per-block; 50-step cap, 150ms coalescing | — Pending (Phase 7+) |
| TextSpanEditor: contentEditable, no innerHTML | XSS prevention; paste text/plain only | — Pending (Phase 7+) |
| No barrel files except curated type/constant barrels | Prevents accidental coupling; keeps tree-shaking clean | ✓ Good — established in Phase 1 |
| shadcn radix-nova style + neutral base | Matches design system; cssVariables: true for theming | ✓ Good — 17 components installed |
| erasableSyntaxOnly: true | Ensures TypeScript compiles to clean ESM without runtime enum objects | ✓ Good — enforced |
| shadcn@4.6.0 for init (not latest) | Latest version had workspace config bug | ✓ Good — workaround documented |
| TypeScript pinned to 5.9.3 | Vite scaffold installs 6.0.3 by default; 5.9.3 is stable | ✓ Good — no compatibility issues |
| vitest.config.ts separate from vite.config.ts | @tailwindcss/vite plugin incompatible with jsdom | ✓ Good — test isolation |
| i18n translation files via http-backend | NOT bundled inline — loaded on demand from public/locales/ | ✓ Good — tree-shaking friendly |
| Boot refresh before ReactDOM.render | Prevents login-page flash; authStore drives initial render | ✓ Good — confirmed by ProtectedRoute tests |
| @hookform/resolvers pinned to 3.10.0 | v5.2.2 imports zod/v4/core which is incompatible with installed zod 3.24.4 | ✓ Good — server starts clean |
| logout: navigate('/login', { replace: true }) | Replaces history entry so back button can't re-enter protected route | ✓ Good — confirmed by UAT test 10 |
| Backend refresh cookie not invalidated on logout (acknowledged gap) | Backend is a separate repository; frontend-only fix covers the reported UX issue | Tracked — backend fix deferred to backend team |

---
*Last updated: 2026-05-17 after v0.4 Notebook Management milestone*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
