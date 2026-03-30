<!--
  ============================================================================
  Sync Impact Report
  ============================================================================
  Version change: N/A (initial) -> 1.0.0
  Modified principles: N/A (initial creation)
  Added sections:
    - Core Principles (I through XII)
    - Technology Stack
    - Naming Conventions
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md — OK (no changes needed;
      Constitution Check section will be filled per-feature at plan time)
    - .specify/templates/spec-template.md — OK (structure compatible)
    - .specify/templates/tasks-template.md — OK (phase structure compatible;
      path conventions align with src/ single-project layout)
    - .specify/templates/checklist-template.md — OK (no constitution refs)
    - .specify/templates/agent-file-template.md — OK (no constitution refs)
  Follow-up TODOs: None
  ============================================================================
-->

# Staccato Frontend Constitution

## Core Principles

### I. Folder Structure & Module Boundaries (NON-NEGOTIABLE)

The project MUST follow this folder structure exactly:

```
src/
  api/          — Axios instance + per-domain API function modules
                  (auth.ts, notebooks.ts, lessons.ts, modules.ts,
                  chords.ts, instruments.ts, exports.ts, presets.ts,
                  users.ts). Each file exports typed async functions.
                  No business logic.
  components/   — Shared, reusable UI components (not feature-specific).
                  Organized by category: ui/ (shadcn/ui primitives),
                  layout/ (shells, wrappers), common/ (app-wide
                  components like ProtectedRoute, DeletionBanner).
  features/     — Feature-specific components grouped by domain folder:
                  auth/, notebooks/, lessons/, editor/, chords/,
                  exports/, profile/, styling/. Each feature folder is
                  self-contained: components, hooks, and utils specific
                  to that feature live here.
  hooks/        — Shared custom React hooks (useDebounce,
                  useGridCalculations, etc.). Feature-specific hooks
                  live in features/{domain}/hooks/.
  stores/       — Zustand stores only (authStore.ts, uiStore.ts).
  lib/          — Utilities, constants, type definitions.
                  types/ subfolder with per-domain type files mirroring
                  backend DTOs. constants/ subfolder with grid
                  dimensions, module constraints, chromatic scale.
                  utils/ subfolder with pure utility functions.
  i18n/         — react-i18next config + locale JSON files
                  (en.json, hu.json).
  routes/       — Route definitions, layout components, route guards.
```

**Import rules:**

- Components MUST NOT import from other feature folders.
  Cross-feature communication goes through shared hooks, stores,
  or prop drilling.
- The api/ layer MUST NOT contain UI logic.
- The stores/ layer MUST NOT import from api/ or features/.

**Rationale:** Strict boundaries prevent circular imports, keep
features independently refactorable, and make the codebase navigable.
The separation between api/, stores/, and features/ mirrors the
backend's layered architecture.

### II. State Management — Zustand for Client, TanStack Query for Server (NON-NEGOTIABLE)

ALL server state (data fetched from the API) MUST be managed
exclusively through TanStack Query. This includes notebooks, lessons,
pages, modules, chords, instruments, presets, exports, and user
profile. Zustand MUST NOT duplicate server state.

Zustand MUST be used only for client-only state: auth tokens
(accessToken in memory), UI state (sidebar open/closed, selected
module ID, zoom level, theme preference).

TanStack Query cache MUST be the single source of truth for server
data. Optimistic updates MUST use the onMutate/onError/onSettled
pattern.

**Query key convention (hierarchical):**

- `["notebooks"]`, `["notebooks", id]`,
  `["notebooks", id, "lessons"]`, `["notebooks", id, "styles"]`
- `["pages", pageId, "modules"]`
- `["chords", filters]`
- `["user", "profile"]`, `["user", "presets"]`
- `["exports"]`, `["instruments"]`, `["presets"]`

Direct fetch calls outside of TanStack Query hooks are prohibited
except for the initial silent auth refresh on app mount.

**Rationale:** A single source of truth for server data eliminates
sync bugs. TanStack Query provides caching, background refetching,
and optimistic update patterns that would otherwise be hand-rolled.
Zustand stays lightweight by managing only ephemeral client state.

### III. API Integration Discipline (NON-NEGOTIABLE)

ALL API calls MUST go through the centralized Axios instance
configured in src/api/. The Axios instance MUST:

- Read base URL from `VITE_API_BASE_URL` environment variable.
- Include credentials (`withCredentials: true`) for HttpOnly cookie
  transport.
- Inject `Authorization: Bearer {token}` from the Zustand auth store
  on every request.
- Inject `Accept-Language` header from the user's language preference
  on every request.
- Handle 401 responses with silent refresh: call `POST /auth/refresh`,
  retry the original request; if refresh also fails, clear auth state
  and redirect to `/login`.
- Handle concurrent 401s with a promise queue (only one refresh at a
  time).

The access token MUST be stored in Zustand memory ONLY — never in
localStorage or sessionStorage. API function modules (src/api/*.ts)
MUST return typed responses matching the backend DTOs. Raw Axios calls
outside src/api/ are prohibited.

**Rationale:** Centralized HTTP handling ensures consistent auth,
language, and error behavior. The token-in-memory rule prevents XSS
token theft. Typed API functions catch contract mismatches at compile
time.

### IV. Component Architecture

Components MUST follow these patterns:

- **Presentational components:** receive data via props, emit events
  via callbacks. No direct API calls or store access.
- **Container components:** compose presentational components with
  data from TanStack Query hooks and Zustand stores.
- **Feature components:** live in src/features/{domain}/, compose
  containers and presentational components for a specific feature.
- **Page components:** live in src/routes/ or
  src/features/{domain}/, represent a full route and handle layout.

ALL components MUST be function components with hooks. Class
components are prohibited.

React.memo SHOULD be applied to components that receive stable props
but live inside frequently re-rendering parents (e.g., individual
modules on the grid canvas).

Components MUST NOT exceed 250 lines. If a component grows beyond
this, extract sub-components or custom hooks.

**Rationale:** Separating data concerns from presentation makes
components testable, reusable, and easier to reason about. Size limits
prevent monolithic components that are hard to modify.

### V. Design System — Two Visual Zones (NON-NEGOTIABLE)

The application has exactly two visual zones, and every component
MUST belong to one:

**Zone 1 — App Shell:** dashboard, auth pages, profile, toolbar,
sidebar, modals, dialogs, chord library page, export page. MUST use
the earthy-modern design system: warm browns, terracotta, olive/sage
green, muted gold, charcoal, warm grays, cream/off-white backgrounds.
shadcn/ui components themed with earthy CSS variables. Clean lines,
generous whitespace, subtle shadows, smooth transitions, refined
sans-serif typography. Professional and sleek.

**Zone 2 — Notebook Canvas:** the dotted-paper editor area where
modules are placed. Physical notebook metaphor: warm off-white dotted
paper background, book-like rendering. Module visual styles are
user-configurable (per-notebook style system with presets). The canvas
sits inside the app shell but has its own visual identity.

The Tailwind theme MUST define the earthy palette as CSS variables
mapped to shadcn/ui's variable system (`--primary`, `--secondary`,
`--accent`, `--muted`, `--destructive`, `--background`,
`--foreground`, etc.). Default shadcn/ui zinc/slate colors MUST be
overridden. A separate set of CSS variables MUST be defined for the
notebook canvas (paper color, dot color, selection color).

**Rationale:** Consistent visual language builds trust and usability.
The two-zone separation acknowledges that the app chrome and the
notebook content serve different purposes and need different
aesthetics.

### VI. No Emojis — Icons Only (NON-NEGOTIABLE)

Zero emojis anywhere in the UI. Not in buttons, toasts, badges, empty
states, labels, status indicators, placeholder text, i18n translation
strings, or any other user-facing element. No exceptions.

ALL visual indicators MUST use Lucide React icons (bundled with
shadcn/ui). Examples: success = CheckCircle icon (not checkmark
emoji), warning = AlertTriangle icon, delete = Trash2 icon,
save = Check icon.

This rule applies to all source code, translation files, and
generated content.

**Rationale:** Emojis break the professional, sleek aesthetic and
render inconsistently across platforms. Lucide icons provide a
consistent, refined icon language that matches the earthy design
system.

### VII. Form Handling & Validation

ALL forms MUST use React Hook Form with Zod schema validation. Zod
schemas MUST mirror the backend's FluentValidation rules (field
requirements, length limits, regex patterns, enum constraints).
Schemas MUST be defined in the feature folder or in
src/lib/schemas/ if shared across features.

Validation MUST run client-side before submission. Server-side
validation errors (400 with field-level errors) MUST be mapped back
to the form fields using React Hook Form's `setError` method.

Business rule errors (422/409 with code/message) MUST be displayed as
toast notifications or inline error banners — not as form field
errors. Exception: A business error that is directly attributable to
a single form field (e.g., 409 duplicate email targeting the email
field) MAY be displayed as a form field error via `setError` when
(a) the error is immediately actionable by editing that specific
field, and (b) showing it elsewhere would reduce discoverability.

**Rationale:** Matching client and server validation rules provides
immediate feedback and reduces round-trips. Separating validation
errors from business errors prevents confusing UX.

### VIII. Routing & Navigation

React Router v7 MUST be used with layout-based routing.

**Route structure:**

```
/ -> redirect based on auth state
/login, /register -> public routes (redirect to /app if authenticated)
/app/* -> protected layout (ProtectedRoute wrapper)
  /app/notebooks — dashboard
  /app/notebooks/new — create notebook
  /app/notebooks/:notebookId — notebook view (cover, default)
  /app/notebooks/:notebookId/index — notebook index page
  /app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId — editor
  /app/profile — user settings
  /app/exports — export history
  /app/chords — chord library browser
```

The ProtectedRoute MUST attempt a silent token refresh on mount if no
access token exists in Zustand (handles page reload). It MUST show a
loading state during refresh, not flash the login page.

Nested layouts MUST be used: AppLayout (top nav, sidebar slot) wraps
all /app/* routes; NotebookLayout wraps all notebook sub-routes and
provides notebook context (detail, styles, lessons).

**Rationale:** Layout-based routing with contextual wrappers
eliminates prop drilling for shared data (current notebook, auth
state) and provides natural loading/error boundaries.

### IX. Internationalization

react-i18next MUST be used for all user-facing strings. Translation
files: src/i18n/en.json and src/i18n/hu.json. No hardcoded
user-facing strings in components.

Translation keys MUST be namespaced by feature:
`auth.login.title`, `notebooks.create.title`,
`editor.blocks.addBlock`, etc.

Date formatting MUST use `Intl.DateTimeFormat` with the user's locale.

Language detection on first load: browser language, fallback to "en".
After login: user's language preference from `GET /users/me`
overrides.

Language changes MUST update:
1. i18next locale
2. Axios `Accept-Language` header
3. User profile via `PUT /users/me`

**Rationale:** Full i18n from day one prevents costly retrofitting.
Namespace-scoped keys stay organized as the translation files grow.
Syncing language to the backend ensures localized error messages.

### X. Type Safety

TypeScript strict mode MUST be enabled (`strict: true` in
tsconfig.json).

ALL backend DTOs and enums MUST have corresponding TypeScript types
in src/lib/types/. Type files MUST be organized per domain: auth.ts,
notebooks.ts, modules.ts, chords.ts, exports.ts, common.ts (shared
enums).

The `any` type is prohibited. Use `unknown` with type guards when
handling dynamic data (e.g., building block content JSON).

API response types MUST match backend contracts exactly — field
names, nullability, and enum string values.

Discriminated unions MUST be used for building block types (`type`
field as discriminator).

**Rationale:** Strict typing catches API contract drift at compile
time, enables IDE autocompletion, and serves as living documentation
of the data model.

### XI. Performance Patterns

React.memo MUST be applied to module components rendered on the grid
canvas (each module is a separately memoized component). Drag
operations MUST NOT re-render non-dragged modules.

**TanStack Query staleTime (MUST match backend cache durations):**

- Chords and instruments: 5 minutes (300000ms)
- User profile: 30 seconds
- Notebooks/lessons/modules: 0 (always refetch on window focus)

**Debounce timings:**

- Module content auto-save: 1000ms
- Module layout PATCH: 500ms
- Chord search filter changes: 300ms

Large lists (chord search results with 100+ items) SHOULD use
virtualization (`@tanstack/react-virtual`).

**Rationale:** The grid canvas with 10-20 modules is the performance
bottleneck. Memoization and debouncing prevent unnecessary renders
and API calls during drag/edit operations.

### XII. Testing

Unit tests MUST use Vitest (Vite-native). Component tests MUST use
React Testing Library. Test files MUST be colocated with their source:
`Component.test.tsx` next to `Component.tsx`.

**Priority testing targets (MUST have tests):**

- Zod validation schemas (unit tests with valid and invalid inputs)
- Utility functions: grid calculations, interval calculations,
  overlap detection (unit)
- Zustand stores: state transitions (unit)
- API function modules: request shaping and response typing
  (unit with MSW mocks)
- Critical user flows: auth, notebook CRUD, module placement
  (integration with React Testing Library)

Pure logic (utils, schemas, stores) MUST have 100% branch coverage.
UI components SHOULD be tested for critical interactions but not for
pixel-level rendering.

**Rationale:** Colocated tests reduce friction. Prioritizing logic
and schemas over visual rendering gives the highest
confidence-to-effort ratio. Vitest provides fast feedback loops with
Vite's transform pipeline.

## Technology Stack

| Category | Technology |
|---|---|
| Runtime | Node.js LTS, modern browsers (Chrome/Firefox/Safari/Edge latest 2) |
| Language | TypeScript 5+ with strict mode |
| Framework | React 19 |
| Build tool | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| State (client) | Zustand |
| State (server) | TanStack Query (React Query) v5 |
| Routing | React Router v7 |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| i18n | react-i18next |
| Icons | Lucide React (bundled with shadcn/ui) — no emojis |
| Drag and drop | dnd-kit |
| Real-time | @microsoft/signalr |
| Testing | Vitest + React Testing Library + MSW (Mock Service Worker) |
| Google OAuth | @react-oauth/google |

No library outside this list may be introduced without a constitution
amendment.

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Component files & exports | PascalCase | `NotebookCard.tsx`, `GridCanvas.tsx` |
| Hooks | camelCase with `use` prefix | `useCurrentUser.ts`, `useGridCalculations.ts` |
| Stores | camelCase with `Store` suffix | `authStore.ts`, `uiStore.ts` |
| API modules | camelCase domain name | `notebooks.ts`, `chords.ts` |
| Types | PascalCase, matching backend DTOs | `NotebookSummary`, `ModuleResponse` |
| Constants | UPPER_SNAKE_CASE | `PAGE_SIZE_DIMENSIONS`, `MODULE_MIN_SIZES` |
| Translation keys | dot-separated lowercase | `auth.login.title`, `editor.blocks.text` |
| CSS | Tailwind utility classes only | Custom CSS classes ONLY when Tailwind cannot express the style |
| Non-component files | kebab-case | `grid-utils.ts`, `use-debounce.ts` |

BEM and CSS modules are prohibited.

## Governance

This constitution supersedes all other frontend conventions.
Amendments require a pull request modifying this file with a version
bump and rationale. No new major library may be introduced without
updating the Technology Stack section. All PRs MUST verify compliance
with these principles before merge.

**Version**: 1.0.0 | **Ratified**: 2026-03-30 | **Last Amended**: 2026-03-30
