# Staccato

## What This Is

Staccato is a web application for musicians to create and manage digital learning notebooks — tracking their progress in instrument learning through a structured, free-form 2D canvas that mirrors the feel of a physical dotted-paper notebook. Users organize lessons inside notebooks, place content modules on a grid canvas, use a chord library for fretboard diagrams, and export notebooks to PDF.

The frontend is a React 19 + TypeScript SPA consuming an ASP.NET Core 10 WebAPI backend (separate repository). All architecture and technology decisions are pre-determined and documented in the v2.1 specification.

## Core Value

A musician can open a notebook, navigate to any lesson, add and arrange content on the dotted-paper canvas, and find exactly what they practiced — organized the way they think, not the way software thinks.

## Current State

**Shipped:** v0.1 Foundation (2026-05-16)
**Next milestone:** v0.2 (Authentication + Profile, Phases 2–3) — requirements to be defined via `/gsd:new-milestone`

The technical platform is in place. The application boots, routes, and validates the environment. The auth infrastructure (store, Axios client, ProtectedRoute) is wired but the actual login/register UI and API calls are stubs. No user-facing feature has shipped yet.

**Tech stack as shipped:**
- Vite 8.0.13 + React 19.2.6 + TypeScript 5.9.3
- Tailwind v4 CSS-first (no tailwind.config.js)
- shadcn radix-nova (17 UI components)
- Zustand 5.0.13, TanStack Query 5.100.10, Axios 1.16.1
- React Router 7.15.1, i18next 26.2.0 (http-backend, 8 namespaces)
- Vitest + Testing Library (19 tests)

## Requirements

### Validated

- ✓ Infrastructure platform (Vite, TypeScript strict, Tailwind v4, shadcn) — v0.1
- ✓ authStore in-memory only (no persist, no localStorage) — v0.1, confirmed by tests
- ✓ Single Axios instance with single-flight 401 refresh — v0.1
- ✓ i18n bootstrap with Accept-Language header on every request — v0.1, confirmed by tests
- ✓ ProtectedRoute with loading spinner (no flash-of-login) — v0.1, confirmed by tests
- ✓ pnpm-only package management enforced — v0.1

### Active

- [ ] Authentication: local email/password registration and login with JWT + HttpOnly refresh cookie strategy
- [ ] Google OAuth login via `@react-oauth/google`
- [ ] Silent token refresh on page load and proactive refresh before expiry
- [ ] Notebook CRUD: create with instrument, page size, cover color, and style preset
- [ ] Notebook dashboard listing all user notebooks
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
- [ ] User profile management: name, language, default page size, default instrument, avatar
- [ ] Account deletion with 30-day grace period and cancellation
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

**Codebase as of v0.1:** ~450 files (including node_modules), ~2,500 LOC of hand-written source (TypeScript + JSON locales).

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
| TanStack Query for all server state | Avoids duplicating server collections in Zustand | — Pending (Phase 4+) |
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

---
*Last updated: 2026-05-16 after v0.1 Foundation milestone*

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
