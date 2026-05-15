# Staccato

## What This Is

Staccato is a web application for musicians to create and manage digital learning notebooks — tracking their progress in instrument learning through a structured, free-form 2D canvas that mirrors the feel of a physical dotted-paper notebook. Users organize lessons inside notebooks, place content modules on a grid canvas, use a chord library for fretboard diagrams, and export notebooks to PDF.

The frontend is a React 19 + TypeScript SPA consuming an ASP.NET Core 10 WebAPI backend (separate repository). All architecture and technology decisions are pre-determined and documented in the v2.1 specification.

## Core Value

A musician can open a notebook, navigate to any lesson, add and arrange content on the dotted-paper canvas, and find exactly what they practiced — organized the way they think, not the way software thinks.

## Requirements

### Validated

(None yet — ship to validate)

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
- [ ] English and Hungarian localization (all strings via i18next)
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

The specification (v2.1, 2026-05-15) is the authoritative source. It covers every API endpoint, request/response shape, enum value, business rule, error code, and architectural decision in detail. The GSD agents should treat it as ground truth.

Tech environment: React 19 + TypeScript 5.9 (strict + erasableSyntaxOnly), Vite 8, pnpm only, Tailwind v4 CSS-first (no `tailwind.config.js`), shadcn radix-nova style, TanStack Query v5, Zustand 5, React Router v7, Axios, dnd-kit, SignalR, i18next.

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
| Token in Zustand memory, no persist | XSS posture — token not accessible via script injection | — Pending |
| HttpOnly cookie for refresh token | Cookie not accessible to JS; SameSite=Strict prevents CSRF | — Pending |
| Single-flight refresh pattern | Concurrent 401s share one refresh request — no stampede | — Pending |
| rawClient for auth/refresh | Prevents circular refresh loop in response interceptor | — Pending |
| TanStack Query for all server state | Avoids duplicating server collections in Zustand | — Pending |
| dnd-kit for canvas drag/drop | Required for free-form 2D module placement and block reorder | — Pending |
| ModuleEditor lazy-loaded via React.lazy | Editor chunk ~30 kB; silences rolldown INEFFECTIVE_DYNAMIC_IMPORT | — Pending |
| Content save debounced 1000ms | Reduces API calls during active editing | — Pending |
| Undo/redo at whole-module granularity | Simpler than per-block; 50-step cap, 150ms coalescing | — Pending |
| TextSpanEditor: contentEditable, no innerHTML | XSS prevention; paste text/plain only | — Pending |
| No barrel files except curated type/constant barrels | Prevents accidental coupling; keeps tree-shaking clean | — Pending |
| shadcn radix-nova style + neutral base | Matches design system; cssVariables: true for theming | — Pending |
| erasableSyntaxOnly: true | Ensures TypeScript compiles to clean ESM without runtime enum objects | — Pending |

---
*Last updated: 2026-05-15 after initialization*

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
