---
name: Frontend Speckit Prompt Pairs
description: Constitution prompt + all 16 specify/plan prompt pairs for the Staccato React TypeScript frontend, ordered by dependency
type: reference
---

# Staccato Frontend — Speckit Prompt Pairs

## Constitution Prompt (run FIRST, before any feature specs)

Use with `/speckit.constitution`:

```
Project: Staccato Frontend
Description: React TypeScript SPA for an instrument learning notebook application.
Users create digital dotted-paper notebooks, place structured content modules on a
2D grid, and export lessons to PDF. The frontend communicates with an ASP.NET Core 10
WebAPI backend.

Principles:

I. Folder Structure & Module Boundaries (NON-NEGOTIABLE)
The project MUST follow this folder structure exactly:
  src/
    api/          — Axios instance + per-domain API function modules (auth.ts, notebooks.ts,
                    lessons.ts, modules.ts, chords.ts, instruments.ts, exports.ts, presets.ts, users.ts).
                    Each file exports typed async functions. No business logic.
    components/   — Shared, reusable UI components (not feature-specific).
                    Organized by category: ui/ (shadcn/ui primitives), layout/ (shells, wrappers),
                    common/ (app-wide components like ProtectedRoute, DeletionBanner).
    features/     — Feature-specific components grouped by domain folder:
                    auth/, notebooks/, lessons/, editor/, chords/, exports/, profile/, styling/.
                    Each feature folder is self-contained: components, hooks, and utils specific
                    to that feature live here.
    hooks/        — Shared custom React hooks (useDebounce, useGridCalculations, etc.).
                    Feature-specific hooks live in features/{domain}/hooks/.
    stores/       — Zustand stores only (authStore.ts, uiStore.ts).
    lib/          — Utilities, constants, type definitions.
                    types/ subfolder with per-domain type files mirroring backend DTOs.
                    constants/ subfolder with grid dimensions, module constraints, chromatic scale.
                    utils/ subfolder with pure utility functions.
    i18n/         — react-i18next config + locale JSON files (en.json, hu.json).
    routes/       — Route definitions, layout components, route guards.
Components MUST NOT import from other feature folders. Cross-feature communication
goes through shared hooks, stores, or prop drilling. The api/ layer MUST NOT contain
UI logic. The stores/ layer MUST NOT import from api/ or features/.

Rationale: Strict boundaries prevent circular imports, keep features independently
refactorable, and make the codebase navigable. The separation between api/, stores/,
and features/ mirrors the backend's layered architecture.

II. State Management — Zustand for Client, TanStack Query for Server (NON-NEGOTIABLE)
ALL server state (data fetched from the API) MUST be managed exclusively through
TanStack Query. This includes notebooks, lessons, pages, modules, chords, instruments,
presets, exports, and user profile. Zustand MUST NOT duplicate server state.
Zustand MUST be used only for client-only state: auth tokens (accessToken in memory),
UI state (sidebar open/closed, selected module ID, zoom level, theme preference).
TanStack Query cache MUST be the single source of truth for server data. Optimistic
updates MUST use the onMutate/onError/onSettled pattern. Query keys MUST follow a
hierarchical convention: ["notebooks"], ["notebooks", id], ["notebooks", id, "lessons"],
["notebooks", id, "styles"], ["pages", pageId, "modules"], ["chords", filters],
["user", "profile"], ["user", "presets"], ["exports"], ["instruments"], ["presets"].
Direct fetch calls outside of TanStack Query hooks are prohibited except for the
initial silent auth refresh on app mount.

Rationale: A single source of truth for server data eliminates sync bugs. TanStack
Query provides caching, background refetching, and optimistic update patterns that
would otherwise be hand-rolled. Zustand stays lightweight by managing only ephemeral
client state.

III. API Integration Discipline (NON-NEGOTIABLE)
ALL API calls MUST go through the centralized Axios instance configured in src/api/.
The Axios instance MUST:
  - Read base URL from VITE_API_BASE_URL environment variable
  - Include credentials (withCredentials: true) for HttpOnly cookie transport
  - Inject Authorization: Bearer {token} from the Zustand auth store on every request
  - Inject Accept-Language header from the user's language preference on every request
  - Handle 401 responses with silent refresh: call POST /auth/refresh, retry the
    original request; if refresh also fails, clear auth state and redirect to /login
  - Handle concurrent 401s with a promise queue (only one refresh at a time)
The access token MUST be stored in Zustand memory ONLY — never in localStorage or
sessionStorage. API function modules (src/api/*.ts) MUST return typed responses
matching the backend DTOs. Raw Axios calls outside src/api/ are prohibited.

Rationale: Centralized HTTP handling ensures consistent auth, language, and error
behavior. The token-in-memory rule prevents XSS token theft. Typed API functions
catch contract mismatches at compile time.

IV. Component Architecture
Components MUST follow these patterns:
  - Presentational components: receive data via props, emit events via callbacks.
    No direct API calls or store access.
  - Container components: compose presentational components with data from TanStack
    Query hooks and Zustand stores.
  - Feature components: live in src/features/{domain}/, compose containers and
    presentational components for a specific feature.
  - Page components: live in src/routes/ or src/features/{domain}/, represent a
    full route and handle layout.
All components MUST be function components with hooks. Class components are prohibited.
React.memo SHOULD be applied to components that receive stable props but live inside
frequently re-rendering parents (e.g., individual modules on the grid canvas).
Components MUST NOT exceed 250 lines. If a component grows beyond this, extract
sub-components or custom hooks.

Rationale: Separating data concerns from presentation makes components testable,
reusable, and easier to reason about. Size limits prevent monolithic components that
are hard to modify.

V. Design System — Two Visual Zones (NON-NEGOTIABLE)
The application has exactly two visual zones, and every component MUST belong to one:

  Zone 1 — App Shell: dashboard, auth pages, profile, toolbar, sidebar, modals,
  dialogs, chord library page, export page. MUST use the earthy-modern design system:
  warm browns, terracotta, olive/sage green, muted gold, charcoal, warm grays,
  cream/off-white backgrounds. shadcn/ui components themed with earthy CSS variables.
  Clean lines, generous whitespace, subtle shadows, smooth transitions, refined
  sans-serif typography. Professional and sleek.

  Zone 2 — Notebook Canvas: the dotted-paper editor area where modules are placed.
  Physical notebook metaphor: warm off-white dotted paper background, book-like
  rendering. Module visual styles are user-configurable (per-notebook style system
  with presets). The canvas sits inside the app shell but has its own visual identity.

The Tailwind theme MUST define the earthy palette as CSS variables mapped to
shadcn/ui's variable system (--primary, --secondary, --accent, --muted, --destructive,
--background, --foreground, etc.). Default shadcn/ui zinc/slate colors MUST be
overridden. A separate set of CSS variables MUST be defined for the notebook canvas
(paper color, dot color, selection color).

Rationale: Consistent visual language builds trust and usability. The two-zone
separation acknowledges that the app chrome and the notebook content serve different
purposes and need different aesthetics.

VI. No Emojis — Icons Only (NON-NEGOTIABLE)
Zero emojis anywhere in the UI. Not in buttons, toasts, badges, empty states, labels,
status indicators, placeholder text, i18n translation strings, or any other
user-facing element. No exceptions.
ALL visual indicators MUST use Lucide React icons (bundled with shadcn/ui). Examples:
success = CheckCircle icon (not checkmark emoji), warning = AlertTriangle icon,
delete = Trash2 icon, save = Check icon.
This rule applies to all source code, translation files, and generated content.

Rationale: Emojis break the professional, sleek aesthetic and render inconsistently
across platforms. Lucide icons provide a consistent, refined icon language that
matches the earthy design system.

VII. Form Handling & Validation
ALL forms MUST use React Hook Form with Zod schema validation. Zod schemas MUST
mirror the backend's FluentValidation rules (field requirements, length limits,
regex patterns, enum constraints). Schemas MUST be defined in the feature folder
or in src/lib/schemas/ if shared across features.
Validation MUST run client-side before submission. Server-side validation errors
(400 with field-level errors) MUST be mapped back to the form fields using
React Hook Form's setError method.
Business rule errors (422/409 with code/message) MUST be displayed as toast
notifications or inline error banners — not as form field errors.

Rationale: Matching client and server validation rules provides immediate feedback
and reduces round-trips. Separating validation errors from business errors prevents
confusing UX.

VIII. Routing & Navigation
React Router v7 MUST be used with layout-based routing. Route structure:
  / → redirect based on auth state
  /login, /register → public routes (redirect to /app if authenticated)
  /app/* → protected layout (ProtectedRoute wrapper)
    /app/notebooks — dashboard
    /app/notebooks/new — create notebook
    /app/notebooks/:notebookId — notebook view (cover, default)
    /app/notebooks/:notebookId/index — notebook index page
    /app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId — lesson page editor
    /app/profile — user settings
    /app/exports — export history
    /app/chords — chord library browser
The ProtectedRoute MUST attempt a silent token refresh on mount if no access token
exists in Zustand (handles page reload). It MUST show a loading state during refresh,
not flash the login page. Nested layouts MUST be used: AppLayout (top nav, sidebar
slot) wraps all /app/* routes; NotebookLayout wraps all notebook sub-routes and
provides notebook context (detail, styles, lessons).

Rationale: Layout-based routing with contextual wrappers eliminates prop drilling
for shared data (current notebook, auth state) and provides natural loading/error
boundaries.

IX. Internationalization
react-i18next MUST be used for all user-facing strings. Translation files:
src/i18n/en.json and src/i18n/hu.json. No hardcoded user-facing strings in components.
Translation keys MUST be namespaced by feature: auth.login.title, notebooks.create.title,
editor.blocks.addBlock, etc.
Date formatting MUST use Intl.DateTimeFormat with the user's locale. Language
detection on first load: browser language → fallback to "en". After login: user's
language preference from GET /users/me overrides. Language changes MUST update:
(1) i18next locale, (2) Axios Accept-Language header, (3) user profile via PUT /users/me.

Rationale: Full i18n from day one prevents costly retrofitting. Namespace-scoped keys
stay organized as the translation files grow. Syncing language to the backend ensures
localized error messages.

X. Type Safety
TypeScript strict mode MUST be enabled (strict: true in tsconfig.json).
ALL backend DTOs and enums MUST have corresponding TypeScript types in src/lib/types/.
Type files MUST be organized per domain: auth.ts, notebooks.ts, modules.ts, chords.ts,
exports.ts, common.ts (shared enums).
The "any" type is prohibited. Use "unknown" with type guards when handling dynamic data
(e.g., building block content JSON). API response types MUST match backend contracts
exactly — field names, nullability, and enum string values.
Discriminated unions MUST be used for building block types (type field as discriminator).

Rationale: Strict typing catches API contract drift at compile time, enables IDE
autocompletion, and serves as living documentation of the data model.

XI. Performance Patterns
React.memo MUST be applied to module components rendered on the grid canvas (each
module is a separately memoized component). Drag operations MUST NOT re-render
non-dragged modules.
TanStack Query staleTime MUST match backend cache durations: chords and instruments
= 5 minutes (300000ms), user profile = 30 seconds, notebooks/lessons/modules = 0
(always refetch on window focus).
Debounce timings: module content auto-save = 1000ms, module layout PATCH = 500ms,
chord search filter changes = 300ms.
Large lists (chord search results with 100+ items) SHOULD use virtualization
(@tanstack/react-virtual).

Rationale: The grid canvas with 10-20 modules is the performance bottleneck. Memoization
and debouncing prevent unnecessary renders and API calls during drag/edit operations.

XII. Testing
Unit tests MUST use Vitest (Vite-native). Component tests MUST use React Testing Library.
Test files MUST be colocated with their source: Component.test.tsx next to Component.tsx.
Priority testing targets (MUST have tests):
  - Zod validation schemas (unit tests with valid and invalid inputs)
  - Utility functions: grid calculations, interval calculations, overlap detection (unit)
  - Zustand stores: state transitions (unit)
  - API function modules: request shaping and response typing (unit with MSW mocks)
  - Critical user flows: auth, notebook CRUD, module placement (integration with
    React Testing Library)
Pure logic (utils, schemas, stores) MUST have 100% branch coverage. UI components
SHOULD be tested for critical interactions but not for pixel-level rendering.

Rationale: Colocated tests reduce friction. Prioritizing logic and schemas over
visual rendering gives the highest confidence-to-effort ratio. Vitest provides
fast feedback loops with Vite's transform pipeline.

Technology Stack:
  Runtime: Node.js LTS, targeting modern browsers (Chrome/Firefox/Safari/Edge latest 2)
  Language: TypeScript 5+ with strict mode
  Framework: React 19
  Build tool: Vite
  Styling: Tailwind CSS v4 + shadcn/ui (Radix primitives)
  State (client): Zustand
  State (server): TanStack Query (React Query) v5
  Routing: React Router v7
  HTTP: Axios
  Forms: React Hook Form + Zod
  i18n: react-i18next
  Icons: Lucide React (bundled with shadcn/ui) — no emojis
  Drag and drop: dnd-kit
  Real-time: @microsoft/signalr
  Testing: Vitest + React Testing Library + MSW (Mock Service Worker)
  Google OAuth: @react-oauth/google
  No library outside this list may be introduced without a constitution amendment.

Naming Conventions:
  Components: PascalCase files and exports (NotebookCard.tsx, GridCanvas.tsx)
  Hooks: camelCase with "use" prefix (useCurrentUser.ts, useGridCalculations.ts)
  Stores: camelCase with "Store" suffix (authStore.ts, uiStore.ts)
  API modules: camelCase domain name (notebooks.ts, chords.ts)
  Types: PascalCase, matching backend DTO names (NotebookSummary, ModuleResponse)
  Constants: UPPER_SNAKE_CASE (PAGE_SIZE_DIMENSIONS, MODULE_MIN_SIZES)
  Translation keys: dot-separated lowercase (auth.login.title, editor.blocks.text)
  CSS: Tailwind utility classes. Custom CSS classes ONLY when Tailwind cannot express
  the style (e.g., complex SVG styling). BEM or CSS modules prohibited.
  File naming: kebab-case for non-component files (grid-utils.ts, use-debounce.ts),
  PascalCase for component files (GridCanvas.tsx, ChordSelector.tsx).

Governance:
  This constitution supersedes all other frontend conventions. Amendments require a
  pull request modifying this file with a version bump and rationale. No new major
  library may be introduced without updating the Technology Stack section. All PRs
  must verify compliance with these principles before merge.
```


16 features, ordered by dependency. Each has a `specify` prompt and a `plan` prompt
for use with `/speckit.specify` and `/speckit.plan`.

**Tech stack baseline (referenced by all prompts):**
Vite + React 19 + TypeScript, shadcn/ui (Radix primitives) + Tailwind CSS,
Zustand (client state), TanStack Query (server state), React Router v7,
Axios, React Hook Form + Zod, react-i18next (en/hu), @microsoft/signalr, dnd-kit.

**Backend reference:** `STACCATO_FRONTEND_DOCUMENTATION.md` in the backend repo
contains all API contracts, data models, enums, building block schemas, grid
dimensions, error codes, and rendering specs.

**Design direction (applies to ALL features with UI):**
The application has two distinct visual zones:

1. **App shell** (dashboard, auth pages, profile, toolbar, sidebar, modals, dialogs,
   export page, chord library browser): **Sleek, modern, and professional with an
   earthy color palette.** Warm browns, terracotta, olive/sage green, muted gold,
   charcoal, warm grays, cream/off-white backgrounds. Clean lines, generous whitespace,
   subtle shadows, smooth micro-animations, refined typography. No playful or cartoon
   elements. High contrast for readability. shadcn/ui components must be themed with
   this earthy palette — NOT the default zinc/slate.

2. **Notebook canvas** (the dotted-paper editor area inside a notebook): Physical
   notebook metaphor with dotted paper, warm off-white background, book-like feel.
   Module styles are user-configurable via presets. The canvas sits inside the app
   shell but has its own visual identity.

Every feature spec must respect this separation. UI components belonging to the app
shell follow the earthy-modern design system. Notebook content follows the notebook
metaphor.

**No emojis rule (applies to ALL features, NO exceptions):**
Zero emojis anywhere in the UI. Not in buttons, toasts, badges, empty states, labels,
status indicators, i18n strings, or any other user-facing element. Use Lucide React
icons (bundled with shadcn/ui) for all visual indicators, status symbols, and
decorative elements. This is a hard requirement — every spec must use "icon" where
it might otherwise say "emoji".

---

## Feature 1: Project Infrastructure

### Specify Prompt

```
Feature: Project Infrastructure Setup

Set up the foundational infrastructure for the Staccato frontend — a React TypeScript
SPA built with Vite. The bare Vite + React + TypeScript app is already scaffolded;
this feature covers everything else needed before feature work begins.

Stack decisions (all mandatory):
- UI primitives: shadcn/ui (Radix-based, copy-paste model) + Tailwind CSS for styling
- State: Zustand for client-only state, TanStack Query for all server state
- Routing: React Router v7 with a layout-based route structure
- HTTP: Axios with a pre-configured instance (base URL from env, JSON content type,
  credentials: "include" for HttpOnly cookies, Accept-Language header injection)
- Forms: React Hook Form + Zod for validation
- i18n: react-i18next with JSON resource files for English (en) and Hungarian (hu)
- SignalR: @microsoft/signalr (install only, connection setup is in Feature 17)

What must be set up:

1. Tailwind CSS configuration with a custom earthy design system theme. Install and
   initialize shadcn/ui with a CUSTOM theme — NOT the default zinc/slate.

   Earthy color palette to define in Tailwind config:
   - Primary: warm brown / terracotta range (buttons, links, active states)
   - Secondary: olive / sage green range (accents, badges, success states)
   - Accent: muted gold / amber (highlights, focus rings, premium feel)
   - Neutral: warm grays and charcoal (text, borders, backgrounds)
   - Background: cream / warm off-white (#FAF8F5 range) — NOT pure white
   - Surface: slightly warmer white for cards/panels (#FFFFFF with warm tint)
   - Destructive: muted terracotta-red (not harsh red)

   shadcn/ui CSS variables must map to this palette so all primitives (Button,
   Dialog, Card, etc.) use earthy tones by default. The overall feel must be
   sleek, modern, and professional — clean lines, generous whitespace, subtle
   shadows, smooth transitions, refined sans-serif typography.

   Additionally, define a "notebook" subset of the palette for the dotted-paper
   canvas area (warm paper-white, dot color, selection highlights).

2. Axios instance with:
   - Base URL from environment variable (VITE_API_BASE_URL)
   - Automatic Authorization header injection from Zustand auth store
   - Accept-Language header injection from user's language preference
   - Response interceptor for 401 → silent refresh (call POST /auth/refresh,
     retry original request; if refresh fails, redirect to login)
   - Credential inclusion for HttpOnly cookie transport

3. TanStack Query client with sensible defaults (staleTime, retry, error handling).

4. Zustand stores skeleton:
   - AuthStore: accessToken, setAccessToken, clearAuth
   - UIStore: sidebarOpen, selectedModuleId, zoom level, theme preference

5. React Router v7 route structure:
   - / → redirect to /app/notebooks or /login based on auth
   - /login, /register → public routes
   - /app/* → protected layout (requires auth)
     - /app/notebooks → dashboard
     - /app/notebooks/new → create notebook
     - /app/notebooks/:notebookId → notebook view (cover)
     - /app/notebooks/:notebookId/index → index page
     - /app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId → editor
     - /app/profile → user settings
     - /app/exports → export history
     - /app/chords → chord library browser
   - ProtectedRoute wrapper that checks auth state; redirects to /login if no token

6. i18n setup: react-i18next initialized with en.json and hu.json skeleton files,
   language detection from user profile (after login) or browser default.

7. Environment configuration: .env.example with VITE_API_BASE_URL,
   VITE_GOOGLE_CLIENT_ID.

8. Folder structure:
   - src/api/ — Axios instance, API function modules (auth.ts, notebooks.ts, etc.)
   - src/components/ — shared UI components
   - src/features/ — feature-specific components grouped by domain
   - src/hooks/ — custom React hooks
   - src/stores/ — Zustand stores
   - src/lib/ — utilities, constants, types
   - src/i18n/ — i18n config and locale JSON files
   - src/routes/ — route definitions and layout components

9. Shared TypeScript types mirroring all backend DTOs and enums from
   STACCATO_FRONTEND_DOCUMENTATION.md Section 7 (User, NotebookSummary,
   NotebookDetail, LessonSummary, LessonDetail, LessonPage, Module,
   NotebookModuleStyle, ChordSummary, ChordDetail, ChordPosition, ChordString,
   ChordBarre, PdfExport, SystemStylePreset, UserSavedPreset, StyleEntry,
   and all enum types: ModuleType, BuildingBlockType, BorderStyle, FontFamily,
   PageSize, InstrumentKey, Language).

10. Constants file mirroring backend constants:
    - PAGE_SIZE_DIMENSIONS: grid width/height per PageSize
    - MODULE_MIN_SIZES: min width/height per ModuleType
    - MODULE_ALLOWED_BLOCKS: allowed BuildingBlockType[] per ModuleType
    - CHROMATIC_SCALE: the 12 notes

No actual pages or features — just the wiring that all subsequent features depend on.
```

### Plan Prompt

```
Plan the implementation of Feature 1: Project Infrastructure Setup.

This is the foundation layer. Key architectural decisions to address:

1. How to structure the Axios interceptor chain so the silent refresh logic is clean
   and doesn't cause infinite retry loops (use a flag or separate Axios instance for
   the refresh call itself).

2. How to wire TanStack Query's global error handler to detect 401s that survive
   the Axios interceptor (edge case: refresh token also expired).

3. The ProtectedRoute component pattern — should it check for token existence in
   Zustand, or should it attempt a silent refresh on mount if no token exists?
   (Answer: attempt silent refresh first, since page reload clears the in-memory token.)

4. shadcn/ui initialization — which components to install upfront vs on-demand.
   Recommend installing the full set used across features: Button, Card, Dialog,
   DropdownMenu, Form, Input, Label, Popover, Select, Sheet, Tabs, Toast, Tooltip,
   Command, Separator, Badge, Checkbox, Table, ScrollArea.

5. Tailwind theme: The earthy design system is THE critical deliverable of this feature.
   Define CSS variables for:
   - App shell: primary (brown/terracotta), secondary (olive/sage), accent (muted gold),
     neutral (warm grays), background (cream), surface (warm white), destructive (muted red)
   - Notebook canvas: paper background, dot color, selection highlight
   shadcn/ui's CSS variable system (--primary, --secondary, --accent, etc.) must be
   overridden to use the earthy palette. This ensures every shadcn component renders
   with the correct design language out of the box. Consider defining both light and
   dark mode values (dark mode = deeper earthy tones, not cold blue-gray).

6. The TypeScript types file — should it be one large types.ts or split by domain?
   (Answer: split by domain in src/lib/types/ — auth.ts, notebooks.ts, modules.ts,
   chords.ts, exports.ts, common.ts for enums.)

Constitution compliance: This feature establishes patterns that all subsequent features
must follow. Ensure the Axios instance, query client, and store patterns are clean
enough to serve as templates.
```

---

## Feature 2: Authentication & Token Management

### Specify Prompt

```
Feature: Authentication & Token Management

Implement the complete authentication flow for Staccato: local registration, local
login, Google OAuth login, silent token refresh, and logout.

Backend API endpoints (see STACCATO_FRONTEND_DOCUMENTATION.md Section 8.1):
- POST /auth/register — { email, displayName, password } → { accessToken, expiresIn }
  + sets staccato_refresh HttpOnly cookie. Returns 201.
- POST /auth/login — { email, password, rememberMe } → { accessToken, expiresIn }
  + sets cookie. Returns 200.
- POST /auth/google — { idToken } → { accessToken, expiresIn } + sets cookie. Returns 200.
- POST /auth/refresh — no body, reads cookie → { accessToken, expiresIn } + rotates cookie.
  Returns 200. Returns 401 if expired/invalid.
- DELETE /auth/logout — reads cookie, revokes token, clears cookie. Returns 204.

Rate limiting: All /auth/* endpoints are rate-limited to 10 req/min/IP. The frontend
should handle 429 responses gracefully (show "Too many attempts, try again in X seconds"
using the Retry-After header).

Critical security rules:
- Access token stored in Zustand (memory ONLY) — never localStorage/sessionStorage
- Refresh token is HttpOnly cookie — frontend never reads it directly
- On page load/reload: access token is lost → call POST /auth/refresh silently
- On 401 from any API call: Axios interceptor retries with refreshed token
- On refresh failure: clear auth state, redirect to /login

Pages to build:

1. Login page (/login):
   - Email + password fields (React Hook Form + Zod validation)
   - "Remember me" checkbox (controls refresh token duration: 7d vs 30d)
   - "Sign in with Google" button (triggers Google OAuth flow)
   - Link to register page
   - Validation: email required + valid format, password required + min 8 chars
   - Error handling: 401 → "Invalid email or password", 429 → rate limit message
   - On success: store access token in Zustand, redirect to /app/notebooks

2. Register page (/register):
   - Email, display name, password, confirm password fields
   - Zod validation mirroring backend: email required/valid/max 256, displayName 2-100
     chars, password min 8 + uppercase + lowercase + digit
   - "Sign up with Google" button
   - Link to login page
   - Error handling: 409 → "Email already registered"
   - On success: store token, redirect to /app/notebooks

3. Google OAuth flow:
   - Use @react-oauth/google or the Google Identity Services library
   - Google Client ID from VITE_GOOGLE_CLIENT_ID env variable
   - On Google sign-in success: send idToken to POST /auth/google
   - Handle 400 → "Google authentication failed"
   - Works for both login and registration (backend auto-creates account)

4. Auth initialization (on app mount):
   - ProtectedRoute checks Zustand for token
   - If no token → attempt POST /auth/refresh (cookie may still be valid)
   - If refresh succeeds → store new token, allow navigation
   - If refresh fails (401) → redirect to /login
   - Show loading spinner during this check

5. Logout:
   - Call DELETE /auth/logout
   - Clear Zustand auth store
   - Redirect to /login

Localization: All UI strings in en.json/hu.json. Error messages from the backend
are already localized via Accept-Language header.

Design requirements:
- Auth pages are the user's first impression. They must feel premium and polished.
- Use the earthy palette: cream background, warm brown primary buttons, subtle shadows
- Clean card-centered layout with generous whitespace
- Smooth form transitions and micro-animations (focus states, error shake, loading spinner)
- The "Sign in with Google" button should follow Google's branding guidelines but
  harmonize with the earthy theme
- Consider a split layout: left side = branding/illustration (app name, tagline,
  musical motif), right side = form. Or a centered card on a warm textured background.
- Typography: refined sans-serif, clear hierarchy (heading, subtext, labels, inputs)
- Error states: warm red (not harsh), inline below fields, subtle animation
```

### Plan Prompt

```
Plan the implementation of Feature 2: Authentication & Token Management.

Key implementation concerns:

1. The Axios interceptor for 401 refresh must handle concurrent requests gracefully.
   If 3 API calls fail with 401 simultaneously, only ONE refresh request should be made,
   and the other 2 should queue and retry after the refresh completes. Use a promise-based
   queue pattern.

2. Google OAuth integration: Choose between @react-oauth/google (React wrapper) or
   raw Google Identity Services. The React wrapper is simpler. The flow is:
   Google popup → get credential (ID token) → POST /auth/google → done.

3. The ProtectedRoute component must handle three states: loading (checking refresh),
   authenticated (render children), unauthenticated (redirect to /login). During loading,
   show a full-screen spinner — not a flash of the login page.

4. Token expiry tracking: The backend returns expiresIn (seconds). The frontend could
   set a timer to proactively refresh before expiry (e.g., at 80% of lifetime = 12 min
   for a 15-min token). This avoids the user ever hitting a 401 during normal use.

5. Form validation with React Hook Form + Zod: Create Zod schemas that match the
   backend's FluentValidation rules exactly. The confirm password field is frontend-only.

6. Rate limit handling: Parse the Retry-After header from 429 responses. Show a
   countdown timer or disable the submit button until the window resets.

Testing considerations: Auth flows are hard to unit test. Focus on:
- Zod schema validation (unit tests)
- Interceptor retry logic (mock Axios)
- Auth store state transitions (Zustand testing)
```

---

## Feature 3: User Profile & Settings

### Specify Prompt

```
Feature: User Profile & Settings

Build the user profile and settings page where users manage their account, preferences,
and avatar.

Backend API endpoints (see STACCATO_FRONTEND_DOCUMENTATION.md Section 8.2):
- GET /users/me → UserResponse
- PUT /users/me → { firstName, lastName, language, defaultPageSize?, defaultInstrumentId? }
- PUT /users/me/avatar → multipart/form-data with File field (JPG/PNG/WebP, max 2MB)
- DELETE /users/me/avatar → 204
- DELETE /users/me → 204 (schedules deletion in 30 days)
- POST /users/me/cancel-deletion → 204

User profile data model:
{ id, email, firstName, lastName, language: "en"|"hu", defaultPageSize: PageSize|null,
  defaultInstrumentId: string|null, avatarUrl: string|null,
  scheduledDeletionAt: string|null }

Page: /app/profile

Sections:

1. Profile Information:
   - Avatar display (circular, with upload/delete controls)
   - Avatar upload: click to select file, preview before upload, max 2MB, JPG/PNG/WebP
   - Default avatar: auto-generated initials (first letter of first+last name)
   - First name, last name fields (editable)
   - Email (display only, not editable)
   - Save button for profile changes

2. Preferences:
   - Language selector: English / Hungarian (dropdown or toggle)
     Changing language immediately updates the UI locale AND calls PUT /users/me
   - Default page size: A4/A5/A6/B5/B6 or "None" (used to prefill notebook creation)
   - Default instrument: dropdown populated from GET /instruments (used to prefill
     notebook creation). Instruments are cached (5 min server-side, use TanStack Query
     staleTime to match).

3. Account Deletion:
   - If scheduledDeletionAt is null: show "Delete Account" danger button
     On click: confirmation dialog → DELETE /users/me → show success message
   - If scheduledDeletionAt is set: show warning banner:
     "Your account is scheduled for deletion on [formatted date]. All your data will
     be permanently removed."
     Show "Cancel Deletion" button → POST /users/me/cancel-deletion
   - The deletion banner should also appear as a persistent warning bar at the top of
     the app layout (not just the profile page) when scheduledDeletionAt is set.

4. User Saved Presets (display only — management is in the Styling feature):
   - List of user's saved style presets (GET /users/me/presets)
   - This is informational; full preset management is in Feature 7

Error handling:
- 409 ACCOUNT_DELETION_ALREADY_SCHEDULED → "Account is already scheduled for deletion"
- 400 ACCOUNT_DELETION_NOT_SCHEDULED → "No deletion is scheduled"
- 400 on avatar upload → "Invalid file type or file too large (max 2MB)"

The user profile should be fetched on login (GET /users/me) and cached in TanStack Query.
The language preference should be used to set the Accept-Language header on all API calls
and the i18n locale.

Design requirements:
- Clean settings page with clear section separation (cards or bordered sections)
- Earthy palette: warm background, brown section headers, sage/olive accent for toggles
- Avatar area: large circular avatar with a subtle hover overlay for upload action
- Account deletion section: visually separated (bottom of page), uses the destructive
  color (muted terracotta-red) for the danger zone — but still looks professional, not
  alarming
- Deletion warning banner (persistent across app): warm amber/gold background, clear
  but not aggressive — professional urgency, not panic
- Form inputs styled with the earthy theme (warm border focus rings, cream backgrounds)
```

### Plan Prompt

```
Plan the implementation of Feature 3: User Profile & Settings.

Key considerations:

1. The user profile query (GET /users/me) should be fetched immediately after successful
   auth and cached. It provides the language preference needed for i18n and
   Accept-Language headers. Consider a useCurrentUser() hook that wraps the TanStack
   Query call.

2. Avatar upload uses multipart/form-data, which is different from the JSON API calls.
   The Axios instance needs to handle this (set Content-Type to multipart/form-data
   for this specific call).

3. Language switching has a cascade effect:
   - Update i18next locale → UI re-renders in new language
   - Update Axios default Accept-Language header → future API errors come back localized
   - Call PUT /users/me to persist the preference

4. The account deletion warning banner should be in the app layout component, not the
   profile page, so it appears on every page. Use the cached user profile query to
   check scheduledDeletionAt.

5. The instruments dropdown data comes from GET /instruments (public, cached 5 min).
   This is the same endpoint used later in notebook creation. Use a shared
   useInstruments() hook.

6. Form validation with Zod: firstName and lastName are required strings.
   The language field must be "en" or "hu". defaultPageSize and defaultInstrumentId
   are optional.
```

---

## Feature 4: Notebook Dashboard

### Specify Prompt

```
Feature: Notebook Dashboard

Build the main dashboard page where users view, create, and delete their notebooks.

Backend API endpoints:
- GET /notebooks → NotebookSummary[]
- POST /notebooks → { title, instrumentId, pageSize, coverColor, styles? } → NotebookDetail (201)
- DELETE /notebooks/{id} → 204
- GET /instruments → Instrument[] (public, cached)
- GET /presets → SystemStylePreset[] (public, for notebook creation wizard)

Page: /app/notebooks (dashboard)

1. Notebook List:
   - Display notebooks as cards in a responsive grid
   - Each card shows: colored cover swatch (coverColor), title, instrument name,
     page size badge, lesson count, last updated date
   - Click a card → navigate to /app/notebooks/:id (notebook cover view)
   - Empty state: illustration/message "No notebooks yet. Create your first notebook!"
   - Sort by: last updated (default), created date, title alphabetical

2. Create Notebook (accessible via button or /app/notebooks/new):
   - Multi-step wizard or single form with sections:
     Step 1 — Basics: title (required, max 200 chars), instrument (required, dropdown
     from GET /instruments), page size (required, visual selector showing A4/A5/A6/B5/B6
     with physical dimension labels)
     Step 2 — Appearance: cover color picker (hex color), style preset selector
     (show 5 system presets from GET /presets as visual thumbnails; selecting one
     passes it as the initial styles). If no preset selected, "Colorful" is the default.
   - The instrument and page size are IMMUTABLE after creation — show a clear warning:
     "These cannot be changed later"
   - Pre-fill instrument and page size from user's defaults (defaultInstrumentId,
     defaultPageSize from user profile) if set
   - On submit: POST /notebooks → redirect to /app/notebooks/:id

3. Delete Notebook:
   - Context menu or delete button on each card
   - Confirmation dialog: "Delete [notebook title]? This will permanently delete all
     lessons and content. This action cannot be undone."
   - On confirm: DELETE /notebooks/{id} → remove from list with optimistic update

4. Notebook card design:
   - The card should evoke a physical notebook cover
   - The coverColor fills the card background or a prominent section
   - Show instrument icon/name and page size as subtle badges
   - "X lessons" count at the bottom
   - Hover effect for interactivity

Localization: All strings localized. Date formatting follows user locale
(English: "March 15, 2026", Hungarian: "2026. március 15.").

Design requirements:
- Dashboard is the app's home screen — must feel spacious, organized, and inviting
- Earthy palette: cream page background, warm white notebook cards with subtle shadow
- Notebook cards should evoke physical notebooks: the coverColor fills a prominent area
  (top stripe or full card background tint), with title and metadata on a warm surface
- Card hover: subtle lift shadow + slight scale, smooth transition
- "Create Notebook" CTA: prominent but not garish — primary brown button with gold accent
  or a dashed-border "add" card in the grid
- Empty state: elegant illustration (or icon) with warm tones, encouraging message,
  single CTA button
- Create wizard: clean multi-step or sectioned form in a Dialog. Page size selector
  should show paper icons at correct aspect ratios. Cover color picker: curated palette
  of earthy/rich book-cover colors (leather brown, navy, forest green, burgundy, etc.)
  plus custom hex input
- Top bar / navigation: sleek, minimal, earthy — app logo, user avatar, minimal nav items
- Sort controls: subtle dropdown or toggle, not visually dominant
```

### Plan Prompt

```
Plan the implementation of Feature 4: Notebook Dashboard.

Key considerations:

1. The notebook list should use TanStack Query with the key ["notebooks"]. On create
   or delete, invalidate this query. Use optimistic updates for delete (remove card
   immediately, revert on error).

2. The create notebook wizard needs data from two queries: GET /instruments and
   GET /presets. Both are public and cacheable. Fetch them when the wizard opens,
   not on dashboard load.

3. The page size selector should be visual — show rectangles at the correct aspect
   ratios (A4 is tall/narrow, A6 is small, etc.). Include the grid dimensions
   as a subtitle (e.g., "A4 — 42 x 59 grid").

4. The cover color picker: use a shadcn/ui Popover with a simple color input or a
   predefined palette of book-cover colors (leather browns, navy, forest green,
   burgundy, etc.) plus a custom hex input.

5. The preset selector in the creation wizard shows visual thumbnails of each preset.
   Each thumbnail could be a small rendering of differently-colored module blocks to
   give a sense of the color scheme. The GET /presets response includes all 12 style
   definitions per preset.

6. Card layout: Use CSS Grid with responsive breakpoints. 1 column on mobile,
   2 on tablet, 3-4 on desktop.

7. The empty state should be inviting — possibly with a notebook illustration and
   a prominent "Create Notebook" CTA.
```

---

## Feature 5: Notebook Shell & Navigation

### Specify Prompt

```
Feature: Notebook Shell & Navigation

Build the notebook view — the "book" metaphor container that houses the cover page,
index page, and lesson pages. This is the main workspace of the application.

Backend API endpoints:
- GET /notebooks/{id} → NotebookDetail (includes styles)
- GET /notebooks/{id}/index → NotebookIndex { entries: NotebookIndexEntry[] }
- GET /notebooks/{id}/lessons → LessonSummary[]
- POST /notebooks/{id}/lessons → { title } → LessonDetail (201, auto-creates page 1)
- GET /lessons/{id} → LessonDetail (with pages array)
- PUT /lessons/{id} → { title } → LessonDetail
- DELETE /lessons/{id} → 204
- GET /lessons/{id}/pages → LessonPage[]
- POST /lessons/{id}/pages → LessonPageWithWarning (201 or 200 with warning)
- DELETE /lessons/{lessonId}/pages/{pageId} → 204

Routes:
- /app/notebooks/:notebookId → cover page (default view)
- /app/notebooks/:notebookId/index → index page
- /app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId → lesson page

The Notebook as a Book:

1. Cover Page:
   - Full-page display with the notebook's coverColor as background
   - Centered content: notebook title (large), instrument name, owner's display name,
     creation date
   - "Open Notebook" button or click-to-enter → navigates to index page
   - Edit notebook button (title, cover color) — opens edit dialog
   - The cover should feel like a physical book cover

2. Index Page:
   - Rendered on dotted paper background (5mm grid dots)
   - "INDEX" heading at the top
   - Auto-generated table of contents from GET /notebooks/{id}/index
   - Each entry: sequential number, lesson title, dotted leader line, starting page number
   - Clicking an entry navigates to that lesson's first page
   - Read-only — no editing on this page
   - Global page number: 1 (displayed in corner)

3. Lesson Page View:
   - This is the canvas where modules are placed (canvas implementation is Feature 8)
   - For now: render the dotted paper background and show a placeholder for the canvas
   - Display: lesson title at top, page number indicator ("Page 2 / 4" within lesson)
   - Global page number displayed in corner

4. Page Navigation:
   - Previous/Next arrows at the bottom of the canvas area
   - Navigation flows: Cover → Index → Lesson 1 Page 1 → Lesson 1 Page 2 → ... →
     Lesson 2 Page 1 → ...
   - The arrows calculate the correct prev/next page across lesson boundaries
   - Keyboard shortcuts: left/right arrow keys for page navigation

5. Sidebar Navigation Drawer (Sheet):
   - Toggle button (bookmark icon) in the notebook toolbar
   - Shows: notebook title, list of all lessons with titles and creation dates
   - Clicking a lesson → navigates to its first page
   - "Add Lesson" button at the bottom of the sidebar
   - Each lesson entry has: edit title (inline), delete button
   - Lesson delete requires confirmation; cannot delete if it's the last lesson?
     (actually the backend allows deleting all lessons)

6. Lesson Management:
   - Create lesson: title input dialog → POST /notebooks/{id}/lessons
   - Edit lesson title: inline edit in sidebar or dialog → PUT /lessons/{id}
   - Delete lesson: confirmation dialog → DELETE /lessons/{id}
   - Lessons ordered by createdAt ascending (fixed order, no reordering)

7. Page Management (within a lesson):
   - "Add Page" button on the page canvas or in a toolbar
   - POST /lessons/{id}/pages → new page added
   - If 10+ pages: show the warning message from the response
   - Delete page: button on page → DELETE /lessons/{lessonId}/pages/{pageId}
   - Cannot delete the last page (handle LAST_PAGE_DELETION error)
   - Pages numbered sequentially within the lesson

8. Notebook Toolbar:
   - Breadcrumb: "My Notebooks > [Notebook Title]"
   - Sidebar toggle (bookmark icon)
   - Zoom controls (zoom in/out/reset — affects the canvas scale)
   - Current page indicator with global page number
   - Style editor button (opens Feature 7)
   - Export button (opens Feature 17)
   - Delete notebook button (with confirmation)

Update notebook: PUT /notebooks/{id} — only title and coverColor can change.
Show immutability notice for instrument and page size.

Design requirements:
The notebook shell has TWO visual zones working together:
- The app chrome (toolbar, sidebar, navigation arrows, dialogs) uses the earthy-modern
  design system: warm browns, sage accents, cream backgrounds, sleek shadows
- The canvas area (cover page, index page, lesson pages) uses the notebook metaphor:
  dotted paper, book-like rendering

Toolbar: slim, fixed-top, earthy dark (charcoal or deep brown) with warm-toned icons
and text. Clean icon buttons for sidebar toggle, zoom, styles, export. Current page
indicator as a subtle breadcrumb or pill. Must feel professional — like a premium
productivity app toolbar, not a toy.

Sidebar drawer: warm cream/off-white panel with earthy dividers. Lesson list items
with subtle hover states (warm brown highlight). "Add Lesson" button in primary
earthy brown. Clean typography with clear hierarchy (lesson titles bold, dates muted).

Cover page: The coverColor fills the entire canvas area. Title rendered in an elegant
serif or display font. Instrument name and date in lighter weight. Should feel like
the front of a quality leather-bound or cloth-bound notebook.

Index page: Dotted paper background with the TOC rendered in a bookish style —
serif or elegant sans-serif font, dotted leaders, page numbers right-aligned.
Professional print-quality aesthetic.

Page navigation arrows: subtle, positioned at canvas edges, earthy-toned with hover
reveal. Page number indicator: clean pill or badge in warm tones.

Edit/delete dialogs: shadcn/ui Dialog themed earthy — no default cold gray.
```

### Plan Prompt

```
Plan the implementation of Feature 5: Notebook Shell & Navigation.

This is a complex feature with many moving parts. Key architectural decisions:

1. The notebook shell should be a layout component at the route level. It fetches the
   NotebookDetail once and provides it via React context (or TanStack Query cache) to
   all child routes (cover, index, lesson pages).

2. Page navigation state machine: The nav arrows need to know the full page sequence.
   Build a utility that takes the notebook's lessons (with page counts) and computes:
   - Total page count (1 index + sum of all lesson pages)
   - For any current position: prev page URL and next page URL
   - Mapping from global page number to route URL
   Use the NotebookIndex response (which has startPageNumber per lesson) as the source.

3. The dotted paper background should be a reusable component. Use CSS radial-gradient:
   background: radial-gradient(circle, #ccc 1px, transparent 1px);
   background-size: {dotSpacing}px {dotSpacing}px;
   The dot spacing in pixels = gridUnitToPixels(1, zoom).
   This component will be reused by the canvas (Feature 8).

4. The sidebar uses shadcn/ui Sheet (slide-in panel). Lesson list is a TanStack Query
   on ["notebooks", notebookId, "lessons"]. Invalidate on create/update/delete.

5. Zoom: Store zoom level in Zustand UIStore. The dotted paper and module positions
   both scale with zoom. Define a gridUnitsToPixels(units, zoom) utility used everywhere.

6. The index page rendering should feel like a handwritten TOC. Consider using a serif
   font and dotted leader lines (CSS border-bottom: dotted or repeated "." characters).

7. Keyboard navigation: Listen for arrow keys at the notebook shell level.
   Left arrow = previous page, Right arrow = next page. Make sure this doesn't
   conflict with text editing in modules (Feature 9 will need to stopPropagation).
```

---

## Feature 6: App Navigation Sidebar

### Specify Prompt

```
Feature: App Navigation Sidebar

Build the app-level navigation sidebar — a persistent vertical navigation panel on
the left side of the application. This sidebar provides access to all top-level
sections and houses the user menu with profile and logout.

Backend API endpoints used (all existing, no new endpoints):
- GET /users/me → User (firstName, lastName, avatarUrl for display)
- POST /auth/logout → 204

Routes (all existing, no new routes):
- /app/notebooks → Notebook Dashboard
- /app/chords → Chord Library
- /app/exports → Export History
- /app/profile → User Profile & Settings

The App Sidebar:

1. App Branding (top of sidebar):
   - "Staccato" app name or wordmark at the top
   - Clickable — navigates to /app/notebooks (dashboard, the home screen)

2. Navigation Items (below branding):
   - Notebooks (BookOpen icon) → /app/notebooks
   - Chord Library (Music icon) → /app/chords
   - Exports (Download icon) → /app/exports
   - Active item highlighted with warm brown background
   - Each item shows icon + label text
   - Ordered as listed: primary workflow (notebooks) first

3. User Menu (bottom of sidebar):
   - Displays user avatar (or initials fallback from firstName/lastName) + display name
   - Clicking opens a dropdown/context menu (DropdownMenu) with:
     - "Profile & Settings" → navigates to /app/profile
     - Divider
     - "Log out" → performs logout (same logic as current header button)
   - Avatar uses shadcn/ui Avatar with AvatarImage (avatarUrl) + AvatarFallback (initials)

4. Coexistence with Notebook Shell (Feature 5):
   - The app sidebar MUST remain visible when the user is inside a notebook
     (/app/notebooks/:notebookId/*). The notebook's own toolbar and sidebar
     (Feature 5 Sheet) exist alongside the app sidebar.
   - The app sidebar occupies the far-left edge of the viewport.
   - The NotebookLayout (Feature 5) fills the remaining space to the right.
   - This works naturally because NotebookLayout is a child of AppLayout:
     AppLayout renders [AppSidebar | <Outlet />] where Outlet can be the
     dashboard, profile, OR the NotebookLayout with its own toolbar and canvas.

5. Sidebar Behavior:
   - Fixed width (~220-240px expanded)
   - Desktop-only for now (consistent with Feature 5 scope)
   - Not collapsible in this feature (keep it simple)

6. Visual Design:
   - Zone 1 earthy design system
   - Dark earthy sidebar background (deep brown or charcoal — same family as
     the notebook toolbar from Feature 5)
   - Warm-toned icons (cream/off-white), muted label text
   - Active nav item: warm brown highlight, slightly lighter text
   - Hover state: subtle warm brown tint
   - Clean visual separator between nav items section and user section
   - Professional, slim, unobtrusive — should not compete with the main
     content area or the notebook canvas

7. Replacing Existing Header:
   - The current AppLayout header (just a logout button in the top-right corner)
     will be removed or significantly simplified since the sidebar now handles
     all navigation and the user menu handles logout
   - The DeletionBanner should remain visible (above the main content area,
     not inside the sidebar)
```

### Plan Prompt

```
Plan the implementation of Feature 6: App Navigation Sidebar.

This feature completes the AppLayout by filling the existing empty sidebar slot.

Key architectural decisions:

1. The sidebar lives in AppLayout (src/routes/app-layout.tsx) — it fills the
   existing empty <aside> slot. This is NOT a new layout component; it's
   completing the existing AppLayout with a real sidebar component.

2. The sidebar must coexist with NotebookLayout (Feature 5). When a user is
   inside a notebook, the app sidebar remains on the far left, and the
   NotebookLayout (toolbar, canvas, notebook Sheet sidebar) occupies the
   remaining space via <Outlet />. This already works with the current route
   nesting — no structural changes needed.

3. User data comes from the existing useCurrentUser() hook (already called in
   AppLayout for the DeletionBanner). No new API calls or hooks needed.

4. Use React Router's NavLink component for nav items — its built-in isActive
   prop handles active state highlighting automatically. For the notebook route,
   NavLink with "end: false" ensures it stays active on all /app/notebooks/*
   sub-routes.

5. The user dropdown at the bottom uses shadcn/ui DropdownMenu, triggered by
   clicking the user avatar/name area. Profile link and logout action inside.

6. The current header in AppLayout (just a logout button) should be removed.
   Logout logic moves into the user dropdown. The DeletionBanner stays as a
   child of AppLayout above the main content, not inside the sidebar.

7. The sidebar component should live in src/components/layout/AppSidebar.tsx
   (it's a layout component shared across all app routes, not feature-specific).
   The nav item data (icon, label, path) can be a simple array constant.

8. Avatar handling: User type has avatarUrl (nullable), firstName, lastName.
   Use shadcn/ui Avatar: AvatarImage for avatarUrl, AvatarFallback with
   initials (first letter of firstName + firstName of lastName) when no avatar.

9. All strings must be localized via react-i18next. Add keys under nav.* or
   app.sidebar.* namespace. Both en.json and hu.json.
```

---

## Feature 7: Styling System

### Specify Prompt

```
Feature: Styling System

Build the module styling system — the style editor, preset browser, preset application,
and user-saved preset management.

Backend API endpoints:
- GET /notebooks/{id}/styles → NotebookModuleStyle[] (12 items)
- PUT /notebooks/{id}/styles → ModuleStyleRequest[] (12 items) → ModuleStyleResponse[]
- POST /notebooks/{id}/styles/apply-preset/{presetId} → ModuleStyleResponse[]
- GET /presets → SystemStylePreset[] (5 system presets)
- GET /users/me/presets → UserSavedPreset[]
- POST /users/me/presets → { name, styles: StyleEntry[] } → UserSavedPreset (201)
- PUT /users/me/presets/{id} → { name?, styles? } → UserSavedPreset
- DELETE /users/me/presets/{id} → 204

Style properties per module type (NotebookModuleStyle):
- backgroundColor (hex), borderColor (hex), borderStyle (None/Solid/Dashed/Dotted),
  borderWidth (px), borderRadius (px), headerBgColor (hex), headerTextColor (hex),
  bodyTextColor (hex), fontFamily (Default/Monospace/Serif)

Special rules:
- Title and Subtitle modules only use bodyTextColor and fontFamily (no background/border)
- Every notebook always has exactly 12 style records (one per ModuleType)
- Applying a preset overwrites ALL 12 styles at once

The Style Editor:

1. Accessible from the notebook toolbar (paint brush icon or "Styles" button)
2. Opens as a slide-in panel or dialog

3. Module Type Tabs:
   - 12 tabs (one per ModuleType): Title, Breadcrumb, Subtitle, Theory, Practice,
     Example, Important, Tip, Homework, Question, ChordTablature, FreeText
   - Each tab shows the editable style properties for that module type
   - Title and Subtitle tabs show only bodyTextColor and fontFamily
   - All other tabs show all 9 properties

4. Style Controls:
   - Color pickers for: backgroundColor, borderColor, headerBgColor, headerTextColor,
     bodyTextColor (use a Popover with hex input + preset color swatches)
   - BorderStyle: dropdown (None, Solid, Dashed, Dotted)
   - BorderWidth: number input (0-10 px range)
   - BorderRadius: number input (0-20 px range)
   - FontFamily: dropdown (Default, Monospace, Serif)

5. Live Preview:
   - Show a small preview of how a module of the current type would look with the
     current style settings. Render a mock module with the style applied.

6. Preset Browser:
   - Section above or beside the editor showing available presets
   - 5 system presets as visual thumbnails (colored rectangles showing the color scheme)
   - User-saved presets listed below system presets
   - "Apply" button on each preset → POST /notebooks/{id}/styles/apply-preset/{presetId}
   - Applying a preset refreshes all 12 style tabs

7. Save Current as Preset:
   - "Save as Preset" button → name input dialog
   - POST /users/me/presets with the notebook's current 12 styles
   - Error: DUPLICATE_PRESET_NAME → "A preset with this name already exists"

8. User Preset Management:
   - Rename preset: inline edit → PUT /users/me/presets/{id}
   - Delete preset: confirmation → DELETE /users/me/presets/{id}

9. Save Styles:
   - "Save" button → PUT /notebooks/{id}/styles with all 12 style objects
   - Changes apply to ALL modules of each type throughout the entire notebook

Changing a style should feel immediate. Consider optimistic updates: apply style
changes to the local TanStack Query cache immediately, then sync with server.

Design requirements:
- The style editor panel/dialog belongs to the app shell → earthy-modern design
- Use a warm cream background with earthy section dividers
- Module type tabs: styled as earthy tab bar (active tab = primary brown, inactive = muted)
- Color pickers: Popover with curated earthy/vibrant swatches + hex input. The swatch
  grid should look polished — evenly spaced circles or squares with subtle borders
- Live preview: render a mock module card inside the editor showing the current style
  in real-time. The preview sits on a small dotted-paper snippet to show context.
- Preset browser: system presets as visual thumbnail cards with a warm border,
  hover = subtle lift + earthy ring. User presets in a separate section below.
- "Save as Preset" and "Apply Preset" buttons: clean earthy styling
- The overall editor should feel like a premium design tool panel — professional,
  not cluttered
```

### Plan Prompt

```
Plan the implementation of Feature 7: Styling System.

Key considerations:

1. The style editor manages 12 module type styles simultaneously. Use local state for
   the editor form (React Hook Form with a Zod schema for all 12 styles), and only
   call PUT /notebooks/{id}/styles on explicit "Save". Applying a preset can reset
   the form state.

2. The color picker: shadcn/ui doesn't ship a color picker natively. Options:
   - Use a simple hex input + a curated palette of swatches (recommended for simplicity)
   - Or integrate a lightweight color picker like react-colorful inside a Popover
   The palette approach fits the notebook aesthetic better and is faster to use.

3. Preset thumbnails: For each system preset, render a small grid of colored rectangles
   (one per module type) to give a visual sense of the color scheme. This uses the
   preset's styles data directly — no need for full module rendering.

4. The styles data should be cached with TanStack Query key ["notebooks", notebookId,
   "styles"]. When the user saves or applies a preset, update the cache optimistically.
   Other components (the grid canvas, module renderer) read from this cache.

5. User-saved presets use a separate query key ["user", "presets"]. The save-as-preset
   flow reads the current notebook's styles, serializes them as StyleEntry objects
   (moduleType + stylesJson), and POSTs them.

6. Font family preview: Show a sample text line in each font so users can see the
   difference between Default (sans-serif), Monospace, and Serif.
```

---

## Feature 8: Grid Canvas & Module Placement

### Specify Prompt

```
Feature: Grid Canvas & Module Placement

Build the 2D dotted-paper grid canvas where modules are placed, dragged, resized, and
managed. This is the most complex UI component in the application.

Backend API endpoints:
- GET /pages/{pageId}/modules → Module[]
- POST /pages/{pageId}/modules → CreateModuleRequest → Module (201)
- PATCH /modules/{moduleId}/layout → { gridX, gridY, gridWidth, gridHeight, zIndex } → Module
- DELETE /modules/{moduleId} → 204

Grid system (from STACCATO_FRONTEND_DOCUMENTATION.md Section 4):
- 1 grid unit = 5mm physical
- Page dimensions per PageSize: A4=42x59, A5=29x42, A6=21x29, B5=35x50, B6=25x35
- Coordinates: (0,0) = top-left, X increases right, Y increases down
- Module occupies cells from (gridX, gridY) to (gridX+gridWidth-1, gridY+gridHeight-1)

Canvas Component:

1. Dotted Paper Background:
   - Render dots at every grid intersection using CSS radial-gradient
   - Dot spacing scales with zoom level: dotSpacingPx = gridUnitsToPixels(1, zoom)
   - The canvas dimensions match the page size in pixels at the current zoom
   - Paper-like background color (warm off-white)

2. Module Rendering:
   - Each module is an absolutely-positioned div within the canvas
   - Position: left = gridUnitsToPixels(gridX), top = gridUnitsToPixels(gridY)
   - Size: width = gridUnitsToPixels(gridWidth), height = gridUnitsToPixels(gridHeight)
   - Style: Apply NotebookModuleStyle for the module's type (from Feature 7)
   - Each module shows: header bar (module type label + headerBgColor/headerTextColor),
     body area (content rendered with bodyTextColor and fontFamily)
   - Modules stacked by zIndex

3. Module Selection:
   - Click a module to select it (show selection outline, resize handles)
   - Click empty canvas to deselect
   - Selected module shows: blue selection border, 8 resize handles (4 corners +
     4 edge midpoints), header drag handle area

4. Module Dragging (dnd-kit):
   - Drag a selected module by its header area
   - During drag: show ghost/outline at the snapped grid position
   - On drag end: snap to nearest grid unit, validate:
     a. Not out of bounds (gridX >= 0, gridY >= 0, fits within page)
     b. No overlap with other modules
     c. If valid: apply optimistically, call PATCH /modules/{id}/layout (debounced 500ms)
     d. If invalid (client-side check): snap back to original position, show error toast
     e. If server returns 422: revert position, show error from response

5. Module Resizing:
   - Drag any of the 8 resize handles
   - During resize: show ghost/outline snapped to grid
   - On resize end: snap to grid, validate:
     a. Minimum size for module type (from MODULE_MIN_SIZES)
     b. Not out of bounds
     c. No overlap
     d. Same optimistic update + PATCH pattern as dragging

6. Overlap Detection (client-side):
   - Before submitting any layout change, check all other modules on the same page
   - Two modules overlap if their rectangles intersect:
     NOT (a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)
   - Visual feedback: highlight conflicting module in red if drag would cause overlap

7. Add Module:
   - "Add Module" button opens a module type picker (12 types as icons/labels)
   - On type selection: place a new module at the first available grid position with
     minimum dimensions, or let the user click-to-place on the canvas
   - POST /pages/{pageId}/modules with initial position and empty content []
   - Handle errors: MODULE_OVERLAP, MODULE_OUT_OF_BOUNDS, MODULE_TOO_SMALL,
     DUPLICATE_TITLE_MODULE

8. Delete Module:
   - Right-click context menu or delete button on selected module
   - Confirmation for non-empty modules
   - DELETE /modules/{id} → optimistic removal

9. Z-Index Management:
   - Context menu on module: "Bring to Front" (max zIndex + 1), "Send to Back" (0)
   - Only visual layering — actual overlap is still forbidden

10. Zoom Controls:
    - Zoom in/out buttons + keyboard shortcuts (Ctrl+Plus, Ctrl+Minus, Ctrl+0 reset)
    - Zoom range: 50% to 200%, step 10%
    - Zoom affects dot spacing, module sizes, and all pixel calculations
    - Zoom level stored in Zustand UIStore

Module content rendering is NOT part of this feature — modules display their type label
and a placeholder. Content editing is Feature 9.

Design requirements:
- The canvas IS the notebook metaphor zone — warm off-white paper, subtle dot grid
- Dots: warm gray (#C5B9A8 range) not cold gray, evenly spaced, crisp at all zoom levels
- Module selection: earthy brown selection border (not default blue), warm-toned resize
  handles (small brown squares or circles at corners/edges)
- Drag ghost: semi-transparent module outline with earthy border
- Overlap warning: warm red highlight on conflicting module (muted terracotta, not
  harsh neon red)
- "Add Module" button: floating action button or toolbar button in earthy primary.
  Module type picker as a clean grid of labeled icons in a Popover — earthy styling
- Context menu (right-click): shadcn/ui DropdownMenu themed earthy
- Zoom controls: subtle, positioned at canvas corner, earthy icon buttons
- The canvas area should feel like looking at a real piece of dotted paper placed on
  a desk. Consider a subtle drop shadow around the page edges to lift it from the
  app background.
```

### Plan Prompt

```
Plan the implementation of Feature 8: Grid Canvas & Module Placement.

This is the most complex feature. Key architectural decisions:

1. dnd-kit setup: Use @dnd-kit/core for the drag engine. Each module is a useDraggable.
   The canvas is a useDroppable. Use a custom collision detection strategy that snaps
   to the grid. The DragOverlay should show a semi-transparent ghost of the module at
   the snapped position.

2. Resize implementation: dnd-kit doesn't natively handle resize. Implement custom
   resize handles as small divs at corners/edges. On mousedown, track mouse movement
   and calculate the new width/height in grid units. This is simpler than using a
   resize library and gives full control over snapping.

3. Grid snapping utility:
   pixelsToGridUnits(px, zoom) = Math.round(px / gridUnitsToPixels(1, zoom))
   All drag/resize results must be converted through this.

4. Performance: For a page with many modules (10-20), re-rendering the entire canvas
   on every drag frame is expensive. Strategies:
   - Use React.memo on module components (re-render only on data change)
   - The drag overlay is separate from the actual modules (dnd-kit's DragOverlay)
   - Module content rendering (Feature 9) should be virtualized or lazy

5. The overlap detection algorithm must be fast (O(n) check against all modules on page).
   For typical page sizes (10-20 modules), a simple loop is fine. Build a utility:
   checkOverlap(movingModule, allModules, excludeId?) → conflictingModule | null

6. Optimistic updates with TanStack Query:
   - On drag end: update the cache immediately (setQueryData)
   - Fire PATCH /modules/{id}/layout
   - On error: revert the cache to previous state (use onMutate/onError pattern)

7. The canvas container should handle wheel events for zoom (Ctrl+scroll = zoom,
   plain scroll = vertical pan).

8. Module placement on "Add Module": Two UX options:
   a. Auto-place at first available position (scan grid for empty space)
   b. Click-to-place: user clicks on canvas to set top-left corner
   Option (a) is simpler for MVP. Option (b) is better UX. Recommend starting with (a)
   and adding (b) later.

9. The canvas should respect the page boundaries visually — draw a subtle border or
   shadow at the page edges. Modules cannot be dragged beyond this boundary.
```

---

## Feature 9: Module Content Editor (Core)

### Specify Prompt

```
Feature: Module Content Editor (Core Framework)

Build the core framework for editing building block content inside modules. This feature
establishes the editor architecture — individual building block editors are separate features.

Backend API endpoints:
- PUT /modules/{moduleId} → { moduleType, gridX, gridY, gridWidth, gridHeight, zIndex,
  content: BuildingBlock[] } → Module
- (PATCH /modules/{id}/layout is Feature 8)

Content model:
- Module.content is a JSON array of building block objects
- Each object has a "type" discriminator: SectionHeading, Date, Text, BulletList,
  NumberedList, CheckboxList, Table, MusicalNotes, ChordProgression, ChordTablatureGroup
- Building blocks are ordered — array order = display order
- Each module type has a specific set of allowed building block types
  (see MODULE_ALLOWED_BLOCKS constant from Feature 1)

Editor Architecture:

1. View Mode (default):
   - Module displays its content read-only (rendered building blocks in order)
   - Click on module body → enter Edit Mode (if module is selected from Feature 8)
   - Double-click module → select + enter Edit Mode

2. Edit Mode:
   - Module shows editable versions of each building block
   - Toolbar appears at the bottom or top of the module:
     - "Add Block" button → dropdown showing only the ALLOWED block types for this module
     - Block type icons with labels
   - Each block shows: drag handle (for reordering), delete button (X), the block editor
   - Click outside the module → exit Edit Mode, trigger save

3. Block Reordering:
   - Use dnd-kit within the module for block-level drag-and-drop
   - Vertical list reordering (simpler than the 2D canvas drag)
   - On reorder: update local content array order, trigger auto-save

4. Auto-Save:
   - On any content change: update local state immediately (optimistic)
   - Debounce 1000ms, then call PUT /modules/{id} with full module data
   - Show subtle save indicator: "Saving..." → "Saved" → fade out
   - On save error: show error toast, keep local changes (don't revert content)

5. Block Registry:
   - A registry/map from BuildingBlockType to { Renderer, Editor } components
   - Renderer: read-only display component
   - Editor: interactive editing component
   - This feature provides the registry framework; specific block implementations
     are Features 9-14

6. Placeholder Blocks:
   - For block types not yet implemented (from later features), show a placeholder:
     "[ChordProgression block — coming soon]"
   - This allows the editor framework to work before all blocks are built

7. Module Type Constraints:
   - The "Add Block" dropdown filters based on MODULE_ALLOWED_BLOCKS[moduleType]
   - Breadcrumb modules (content always []) show no editor — display a message:
     "Content is auto-generated from subtitle modules"
   - Title modules only allow: Date, Text
   - FreeText allows all block types

8. Bold Text Editing (shared across all text-bearing blocks):
   - TextSpan model: { text: string, bold: boolean }
   - Provide a shared useTextSpanEditor hook or component that:
     a. Renders spans as contiguous text (bold spans wrapped in <strong>)
     b. Supports text selection across spans
     c. Toggle bold button: wraps/unwraps selected text in bold spans
     d. Merges adjacent spans with the same bold value
   - This is the ONLY formatting supported — no italic, underline, color, or font size

Error handling:
- INVALID_BUILDING_BLOCK (422): Block type not allowed in this module
- BREADCRUMB_CONTENT_NOT_EMPTY (422): Tried to add content to breadcrumb
- On save failure: show error toast with localized message from response

Design requirements:
- Module editing happens inside the notebook canvas zone (dotted paper), so the module
  itself renders with notebook-style typography and the user's chosen module styles
- However, the editing chrome (block toolbar, add-block dropdown, drag handles, delete
  buttons, save indicator) uses the earthy app design system
- "Add Block" dropdown: clean Popover with earthy styling, block type icons + labels
- Block drag handles: subtle, appear on hover, earthy warm gray
- Block delete buttons: small, muted, appear on hover — not visually aggressive
- Save indicator: subtle text in earthy muted tone ("Saving..." → "Saved" with a
  Lucide Check icon) in the module header or near the toolbar. No emojis.
- Bold toggle button: earthy-styled toggle (active = primary brown)
- Edit mode transition: subtle border color change or glow (warm brown) to indicate
  the module is being edited — professional, not flashy
```

### Plan Prompt

```
Plan the implementation of Feature 9: Module Content Editor (Core Framework).

Key architectural decisions:

1. The block registry pattern: Create a BLOCK_REGISTRY object:
   Record<BuildingBlockType, { Renderer: React.FC<{block}>, Editor: React.FC<{block, onChange}> }>
   Features 9-14 each register their implementations. Unregistered types show placeholders.

2. The TextSpan editor is the most reusable piece. It needs to handle:
   - Rendering: map spans to <span> or <strong> elements
   - Editing: contentEditable div or a controlled input approach
   - Bold toggle: track selection, split spans at selection boundaries, toggle bold
   - Span merging: after any edit, merge adjacent spans with identical bold values

   Two approaches:
   a. contentEditable with manual span tracking (complex but natural editing feel)
   b. Controlled textarea with a separate bold toggle button (simpler but less fluid)

   Recommend (a) for better UX, but with a well-encapsulated component. This is a
   mini rich-text editor with exactly one formatting option (bold).

3. The auto-save debounce: Use a custom useDebouncedSave hook that:
   - Tracks the latest content in a ref
   - Fires PUT /modules/{id} after 1000ms of inactivity
   - Cancels pending save if the user keeps editing
   - Flushes pending save on Edit Mode exit (click outside)

4. The Edit Mode transition: When entering edit mode, the module expands slightly
   (or shows a border change) to indicate editability. The module's building blocks
   switch from Renderer to Editor components.

5. Block deletion should ask for confirmation if the block has content. Empty blocks
   can be deleted without confirmation.

6. Keyboard shortcuts in edit mode:
   - Ctrl+B: toggle bold on selection
   - Enter: new line within text blocks, or move to next block
   - Tab: indent in list blocks (if applicable)
   - Escape: exit edit mode

7. The content is saved as a full PUT (not PATCH) because the entire content array
   is replaced. This simplifies conflict resolution — last write wins.
```

---

## Feature 10: Text & List Building Blocks

### Specify Prompt

```
Feature: Text & List Building Blocks

Implement the renderer and editor for 6 building block types: SectionHeading, Date,
Text, BulletList, NumberedList, and CheckboxList.

JSON schemas (from STACCATO_FRONTEND_DOCUMENTATION.md Section 5.3):

1. SectionHeading:
   { "type": "SectionHeading", "spans": TextSpan[] }
   Renderer: Bold, slightly larger text. Visually distinct from module header —
   use small-caps or uppercase styling.
   Editor: Single-line text input with bold span support.

2. Date:
   { "type": "Date", "value": "YYYY-MM-DD" }
   Renderer: Formatted date string according to user's locale.
   English: "February 23, 2025". Hungarian: "2025. február 23."
   Always plain text — no bold.
   Editor: Date picker (shadcn/ui Calendar + Popover pattern). Store as ISO 8601.

3. Text:
   { "type": "Text", "spans": TextSpan[] }
   Renderer: Paragraph with bold spans rendered as <strong>.
   Editor: Multi-line text area with bold toggle support using the shared
   TextSpan editor from Feature 9.

4. BulletList:
   { "type": "BulletList", "items": [{ "spans": TextSpan[] }] }
   Renderer: Unordered list with bullet markers (bullet dot character).
   Editor: Each item is a TextSpan editor. Enter at end of item → new item.
   Backspace on empty item → delete item. Add item button. Reorder items via drag.

5. NumberedList:
   { "type": "NumberedList", "items": [{ "spans": TextSpan[] }] }
   Renderer: Ordered list with sequential numbers (1. 2. 3. ...).
   Editor: Same as BulletList but with number prefix display. Numbers auto-update
   on reorder.

6. CheckboxList:
   { "type": "CheckboxList", "items": [{ "spans": TextSpan[], "isChecked": boolean }] }
   Renderer: List with checkbox indicators. Checked items show filled checkbox (or
   strikethrough styling). Unchecked items show empty checkbox.
   Editor: Same as BulletList + a checkbox toggle per item. Clicking the checkbox
   toggles isChecked. The checked state is persisted (this is a functional to-do list).
   Important: Checkbox toggling should save immediately (not wait for debounce) since
   it's a deliberate user action.

TextSpan model: { text: string, bold: boolean }
The shared TextSpan editor from Feature 9 is used by SectionHeading, Text, and all
list item editors.

Register all 6 types in the block registry (BLOCK_REGISTRY from Feature 9).

Design requirements:
- Renderers display inside the notebook canvas (module styles apply — user-configurable)
- Editor chrome (controls, buttons) follows the earthy app design system
- Date picker: shadcn/ui Calendar themed earthy (primary brown for selected date,
  warm background)
- Checkbox items: earthy-styled checkboxes (checked = primary brown checkmark).
  Checked items may have subtle muted/strikethrough styling.
- List bullet/number markers: inherit bodyTextColor from module style
- Text editing area: clean, minimal — the text inherits module style typography.
  Bold toggle button: earthy styling per Feature 9.
```

### Plan Prompt

```
Plan the implementation of Feature 10: Text & List Building Blocks.

Key considerations:

1. These 6 blocks share the TextSpan editing capability. The shared component from
   Feature 9 does the heavy lifting. Each block wraps it differently:
   - SectionHeading: single-line, larger font
   - Text: multi-line paragraph
   - List items: single-line per item, with list-level operations

2. List editors (BulletList, NumberedList, CheckboxList) share ~90% of their logic.
   Create a base ListBlockEditor component parameterized by:
   - Marker type: "bullet" | "number" | "checkbox"
   - Whether items have isChecked
   The three specific editors are thin wrappers.

3. Date picker: Use shadcn/ui's Calendar + Popover. The stored value is always
   "YYYY-MM-DD". Display formatting uses Intl.DateTimeFormat with the user's locale.

4. Checkbox immediate save: When isChecked toggles, bypass the 1000ms debounce and
   save immediately. Use a separate mutation for checkbox toggles, or flush the
   debounced save.

5. List item keyboard navigation:
   - Enter at end of item → insert new empty item below, focus it
   - Backspace on empty item → delete it, focus previous item
   - Arrow up/down → move focus between items
   This creates a natural editing flow similar to a note-taking app.

6. For the renderers (read mode), keep them simple and fast. They just map data to
   HTML elements. No interactivity except CheckboxList (checkbox toggling works in
   both view and edit mode).
```

---

## Feature 11: Table Building Block

### Specify Prompt

```
Feature: Table Building Block

Implement the renderer and editor for the Table building block type.

JSON schema:
{
  "type": "Table",
  "columns": [{ "header": "string" }],
  "rows": [
    [{ "spans": TextSpan[] }, { "spans": TextSpan[] }, ...]
  ]
}

- columns: defines column headers (plain text, no bold spans)
- rows: 2D array. Each row is an array of cells. Each cell contains TextSpan[].
- Row count and column count are fully user-defined.

Renderer:
- Display as a styled HTML table
- Header row with column names (styled with module's headerBgColor/headerTextColor)
- Body rows with cell content (each cell renders its TextSpan[] with bold support)
- Apply module's fontFamily to the entire table
- Alternate row striping for readability (optional, subtle)
- Table should be responsive within the module's width

Editor:
1. Column management:
   - Each column header is an editable text input
   - "Add Column" button (adds column to the right)
   - Delete column button on each header (removes column + all cells in that column)
   - Minimum 1 column

2. Row management:
   - "Add Row" button (adds row at the bottom)
   - Delete row button on each row
   - Minimum 0 rows (header-only table is valid)

3. Cell editing:
   - Each cell uses the shared TextSpan editor (bold support)
   - Tab key: move to next cell (left→right, then next row)
   - Shift+Tab: move to previous cell

4. Table size limits:
   - No hard limit from the backend, but the frontend should handle tables that
     exceed the module's visual width gracefully (horizontal scroll within module,
     or auto-shrink columns)

Register as "Table" in the block registry.

Design requirements:
- Table renderer: clean lines, module's headerBgColor/headerTextColor for the header row,
  subtle alternate row striping using a lighter shade of the module's backgroundColor
- Table editor controls (add/remove column/row): earthy icon buttons, appear contextually
- Cell focus state: warm brown border/ring
- The table should look professional and readable at all module sizes
```

### Plan Prompt

```
Plan the implementation of Feature 11: Table Building Block.

Key considerations:

1. The table editor is essentially a spreadsheet-lite component. Use shadcn/ui's Table
   component as the base for the renderer. For the editor, extend it with editable cells.

2. Column add/remove affects all rows — when a column is added, every row gets a new
   empty cell. When a column is removed, the corresponding cell index is spliced from
   every row. Ensure the data transformation is clean.

3. Cell navigation with Tab/Shift+Tab: Track the "active cell" position as
   [rowIndex, colIndex]. Tab increments colIndex; if past last column, wrap to
   (rowIndex+1, 0). This requires managing focus imperatively (useRef on cell elements).

4. For wide tables that exceed module width: use overflow-x: auto on the table
   container. The module's width is fixed by the grid, so horizontal scrolling within
   the module is the correct behavior.

5. The header row styling should use the module's headerBgColor and headerTextColor
   from the notebook styles (passed down via context or props).
```

---

## Feature 12: Musical Notes Building Block

### Specify Prompt

```
Feature: Musical Notes Building Block

Implement the renderer and editor for the MusicalNotes building block type.

JSON schema:
{
  "type": "MusicalNotes",
  "sequence": ["C", "D", "E", "F", "G", "A", "B"]
}

Valid note values: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (12-note chromatic scale).
Notes can repeat (e.g., ["C", "D", "E", "F", "G", "A", "B", "C"] for a full octave).

Renderer:
- Display each note as a circular badge (e.g., 32px circle with the note name centered)
- Between consecutive badges, display the interval:
  - 1 semitone apart → "S" (semitone) label
  - 2 semitones apart → "W" (whole tone) label
  - Other distances → display the number of semitones
- Interval calculation: distance = ((toIndex - fromIndex) + 12) % 12 where index is
  position in the chromatic scale
- Badges arranged horizontally in a row, wrapping to the next line if needed
- Note badges should be visually distinct (colored background, possibly color-coded
  by note name for consistency)

Editor:
1. Chromatic Scale Picker:
   - Display all 12 notes as clickable buttons in a row: C C# D D# E F F# G G# A A# B
   - Clicking a note appends it to the sequence
   - The current sequence is displayed above/below the picker as circular badges

2. Sequence Management:
   - Each note in the sequence is a draggable badge (reorder via dnd-kit)
   - Click X on a badge to remove it from the sequence
   - Clear all button to reset the sequence

3. Visual Feedback:
   - As the user builds the sequence, intervals are calculated and displayed in real-time
   - Color-coding: natural notes (C, D, E, F, G, A, B) in one color family,
     sharps (C#, D#, F#, G#, A#) in another

Register as "MusicalNotes" in the block registry.

Design requirements:
- Note badges: circular, warm-toned. Natural notes (C, D, E, F, G, A, B) in earthy
  primary (brown/terracotta fill, cream text). Sharps (C#, D#, F#, G#, A#) in earthy
  secondary (olive/sage fill, cream text). Professional, music-sheet-inspired look.
- Interval labels between badges: muted warm gray text, smaller font
- Chromatic picker in editor: 12 buttons styled like piano keys or a clean button grid.
  Earthy active state. The picker should feel like a refined music tool, not a generic
  button row.
```

### Plan Prompt

```
Plan the implementation of Feature 12: Musical Notes Building Block.

Key considerations:

1. The interval calculation utility:
   const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
   getInterval(from, to) = ((CHROMATIC_SCALE.indexOf(to) - CHROMATIC_SCALE.indexOf(from)) + 12) % 12

   This is a pure function — test it thoroughly with edge cases (same note → 0,
   B to C → 1, etc.).

2. The circular badge component is reusable. Create a NoteBadge component:
   { note: string, size?: "sm" | "md", onClick?: () => void, onRemove?: () => void }

3. The interval label component sits between two badges:
   IntervalLabel { value: number } → renders "S", "W", or the number.

4. For horizontal wrapping: use CSS flexbox with flex-wrap. Ensure badges and interval
   labels stay visually connected (no orphaned interval at the start of a new line).

5. The chromatic picker buttons should have a consistent style. Consider using
   a piano-keyboard-like layout: white keys for naturals, slightly offset/smaller/darker
   buttons for sharps.

6. Drag reordering within the sequence: Use dnd-kit's SortableContext with a horizontal
   strategy. On reorder, update the sequence array.
```

---

## Feature 13: Chord Library & Fretboard Renderer

### Specify Prompt

```
Feature: Chord Library & Fretboard Renderer

Build the chord library browser page and the reusable fretboard diagram SVG component.
The chord library is also accessible as a standalone page (/app/chords).

Backend API endpoints:
- GET /chords?instrument={key}&root={note}&quality={q}&extension={ext}&alternation={alt}
  → ChordSummary[] (public, cached 5 min)
- GET /chords/{id} → ChordDetail (public, cached 5 min)
- GET /instruments → Instrument[] (public, cached 5 min)

Data models:
ChordPosition { label, baseFret, barre?: ChordBarre, strings: ChordString[] }
ChordBarre { fret, fromString, toString }
ChordString { string: number, state: "open"|"fretted"|"muted", fret?: number, finger?: number }
String numbering: 1 = highest pitched (high E), 6 = lowest pitched (low E)

Component 1: FretboardDiagram (SVG)
- Input: ChordPosition data
- Renders a fretboard diagram with:
  a. Nut line at top (thick bar if baseFret === 1, or fret number label if baseFret > 1)
  b. 5 frets displayed (baseFret to baseFret + 4)
  c. Vertical lines for strings (left = lowest pitched = string 6, right = highest = string 1)
  d. Horizontal lines for frets
  e. Above the nut: "O" for open strings, "X" for muted strings
  f. Filled circles for fretted strings at the correct fret position
  g. Barre: horizontal bar spanning fromString to toString at the barre fret
  h. Optional: finger numbers (1-4) inside or below the dots
  i. Chord name/label below the diagram
- Sizes: "sm" (thumbnail in search results), "md" (in chord selector), "lg" (in module)
- The component must be pure SVG for crisp rendering at any size

Component 2: Chord Library Browser Page (/app/chords)
1. Instrument Selector:
   - Dropdown or tabs showing available instruments from GET /instruments
   - Currently only Guitar6String has chords, but design for future instruments

2. Filter Controls:
   - Root note: grid of 12 buttons (C, C#, D, ... B). Click to filter.
   - Quality: list/tabs of common qualities (major, minor, 7, maj7, min7, dim, aug, sus2, sus4, etc.)
   - Extension filter (optional): 7, 9, 11, 13
   - Alternation filter (optional): sus4, sus2, add9, etc.
   - Clear filters button
   - Filters call GET /chords with the selected parameters

3. Search Results:
   - Grid of chord cards, each showing:
     - FretboardDiagram (sm) using previewPosition
     - Chord name (e.g., "F Major", "Am7")
     - Root + quality badges
   - Click a card → expand to show all positions (ChordDetail)

4. Chord Detail View:
   - Modal/dialog or inline expansion
   - Shows: chord name, all positions as FretboardDiagram (md) in a horizontal row
   - Position labels (e.g., "Open position", "Barre 5th fret")
   - User can tab/swipe between positions

Component 3: Chord Selector Modal (reusable)
- Used by ChordProgression (Feature 14) and ChordTablatureGroup (Feature 15)
- Opens as a Dialog with the same filter controls as the browser page
- User selects a chord → returns { chordId, displayName } to the caller
- If chord has multiple positions → show position selector
- For ChordTablatureGroup: also returns the selected position label

The chord library page should be accessible without authentication (public endpoints),
but the chord selector modal is used within the authenticated notebook editor.

Design requirements:
- Chord library page is part of the app shell → full earthy-modern design
- Page layout: clean, spacious, magazine-like grid of chord cards
- Filter controls: earthy-styled buttons/tabs. Root note grid: 12 note buttons arranged
  in a row or 4x3 grid, active = primary brown fill, inactive = warm outline. Quality
  tabs: horizontal scroll or wrap, earthy active state.
- Chord cards: warm white surface with subtle shadow, fretboard diagram thumbnail,
  chord name in refined typography. Hover: subtle lift + earthy ring.
- Chord detail dialog: earthy Dialog with fretboard diagrams at medium size, position
  tabs using earthy tab styling, position labels in muted warm text
- Fretboard diagram SVG: clean, professional rendering. Use warm tones:
  - Fret lines: warm gray
  - String lines: slightly darker warm gray
  - Nut: charcoal/dark brown (thick line)
  - Finger dots: primary brown or charcoal, filled circles
  - Barre bar: rounded rectangle in dark brown
  - Open/muted markers: sage green (open) and muted red (muted), or standard black/gray
  - Base fret number: warm gray text
  - The diagram should look like it was drawn with care — not a generic SVG
- Chord selector modal (used from editor): same earthy styling as the library page
  but in a Dialog. Compact filter controls, results grid, confirm button.
```

### Plan Prompt

```
Plan the implementation of Feature 13: Chord Library & Fretboard Renderer.

Key architectural decisions:

1. FretboardDiagram SVG component:
   - Use React SVG elements (<svg>, <line>, <circle>, <rect>, <text>)
   - Define a coordinate system: e.g., viewBox="0 0 100 120" and map string/fret
     positions to coordinates
   - String positions: evenly spaced horizontally (6 strings for guitar)
   - Fret positions: evenly spaced vertically (5 frets shown)
   - The component should accept a stringCount prop for future multi-instrument support
   - Barre rendering: a rounded rectangle or thick line from one string to another

2. Coordinate mapping:
   - String x-position: stringX(n) = margin + (stringCount - n) * stringSpacing
     (string 1 = rightmost, string 6 = leftmost)
   - Fret y-position: fretY(f) = topMargin + (f - baseFret) * fretSpacing
   - Dot position: (stringX(s.string), midpoint between fretY(s.fret-1) and fretY(s.fret))

3. Chord search: Use TanStack Query with key ["chords", { instrument, root, quality, extension, alternation }].
   Debounce filter changes (300ms) to avoid excessive API calls while the user clicks
   through filter options.

4. The chord selector modal should share components with the chord library page but
   be a separate Dialog. Extract a shared ChordSearch component that both use.

5. Chord detail: GET /chords/{id} returns all positions. Cache this aggressively
   (staleTime: 5 min to match server cache). When a chord is used in a module,
   the frontend may need to fetch its positions for rendering — the TanStack Query
   cache handles this.

6. The chord library page route /app/chords should work both authenticated and
   unauthenticated. If inside the /app layout, it uses the auth header. If accessed
   directly, the endpoints are public so it still works.

7. Performance: The chord search can return many results. Use virtualized rendering
   (e.g., @tanstack/react-virtual) for the results grid if there are 100+ chords.
   Or implement pagination (the backend returns all matching chords in one call,
   so paginate client-side).
```

---

## Feature 14: Chord Progression Building Block

### Specify Prompt

```
Feature: Chord Progression Building Block

Implement the renderer and editor for the ChordProgression building block type.

JSON schema:
{
  "type": "ChordProgression",
  "timeSignature": "4/4",
  "sections": [
    {
      "label": "Verse" | null,
      "repeat": true | false,
      "measures": [
        {
          "chords": [
            { "chordId": "uuid", "displayName": "C", "beats": 4 }
          ]
        }
      ]
    }
  ]
}

Business rules:
- timeSignature: string like "4/4", "3/4", "6/8"
- sections[].label: optional section name
- sections[].repeat: if true, render with ||: and :|| markers
- measures[].chords[].chordId: UUID referencing chord in library
- measures[].chords[].displayName: shown in UI (stored to avoid chord lookup)
- measures[].chords[].beats: how many beats this chord lasts
- Beat validation: sum of beats in a measure MUST equal the time signature numerator

Renderer:
- Display as horizontal rows of chord badges organized by section
- Time signature shown at the start (e.g., "4/4" in a box)
- Section label above each section (if set), e.g., "Verse", "Chorus"
- Repeat markers: ||: at start, :|| at end of repeating sections
- Each measure shown as a group of chord badges:
  - Badge shows chord displayName (e.g., "C", "Am", "F7")
  - Beat count shown below each badge in smaller text (e.g., "(4)", "(2)")
  - Colored pill/badge style
- Measure separators (vertical bar lines) between measures
- Sections separated by double bar lines or spacing

Editor:
1. Time Signature:
   - Dropdown or input: common options (4/4, 3/4, 6/8, 2/4) + custom input
   - Changing time signature should warn if existing measures become invalid

2. Section Management:
   - "Add Section" button
   - Each section has: label input (optional), repeat checkbox, list of measures
   - Reorder sections via drag
   - Delete section button

3. Measure Management (within a section):
   - "Add Measure" button
   - Each measure shows its chords as a horizontal row
   - Reorder measures via drag
   - Delete measure button

4. Chord Management (within a measure):
   - "Add Chord" button → opens the Chord Selector Modal (from Feature 13)
   - On chord selection: add { chordId, displayName, beats: remainingBeats } to measure
   - Beats input: number field per chord (must be >= 1)
   - Real-time beat count validation: show current sum vs required sum
     If sum < numerator: show "X beats remaining"
     If sum > numerator: show error "Exceeds time signature"
     If sum === numerator: show green checkmark
   - Reorder chords within measure via drag
   - Delete chord from measure

5. Visual feedback during editing:
   - Show the progression as it will render, with edit controls overlaid
   - Invalid measures highlighted (beat sum mismatch)

Register as "ChordProgression" in the block registry.

Design requirements:
- Chord badges/pills: earthy warm tones. Each chord as a rounded pill — primary brown
  background with cream text, or varied earthy tones per chord for visual distinction.
  Beat count below in smaller muted text.
- Time signature: displayed in a clean box or badge at the start, warm charcoal text
- Repeat markers ||: and :||: rendered in warm charcoal, music-notation-inspired
- Section labels: refined typography above each section, muted warm color
- Measure bar lines: subtle warm gray vertical separators
- Editor controls (add section/measure/chord buttons): earthy app styling
- Beat validation indicators: sage green checkmark for valid, warm amber for incomplete,
  muted red for exceeds — inline, subtle, professional
- The progression should look like a professional lead sheet or chord chart
```

### Plan Prompt

```
Plan the implementation of Feature 14: Chord Progression Building Block.

Key considerations:

1. This is one of the most complex building blocks. It has a 3-level nested structure:
   Progression → Sections → Measures → Chords. Each level needs add/remove/reorder.
   Use a nested state management approach — the top-level onChange callback propagates
   the entire updated progression object up to the module editor.

2. Beat validation is critical UX. Parse the time signature numerator:
   const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
   For each measure: sum(chords.map(c => c.beats)) must equal beatsPerMeasure.
   Display validation inline per measure.

3. The Chord Selector Modal (from Feature 13) returns { chordId, displayName }.
   When adding a chord to a measure, default beats = remaining beats in the measure
   (or 1 if measure is full, which triggers a validation warning).

4. Rendering the repeat markers ||: and :|| — these are music notation symbols.
   Render them as styled spans or SVG glyphs at the start/end of repeating sections.

5. The progression can be wide (many measures). Use horizontal scrolling within the
   module if the progression exceeds the module width. Or wrap measures to new lines
   with clear section boundaries.

6. The editor UI is complex. Consider a structured form layout:
   - Sections as vertical cards
   - Measures as horizontal rows within each section
   - Chord badges within each measure row
   - All add/remove/reorder controls clearly labeled

7. When the time signature changes, existing measures may become invalid. Options:
   a. Warn and let the user fix them manually (recommended)
   b. Auto-adjust beats (risky — may change user intent)
   Show a warning: "Changing time signature may invalidate existing measures."
```

---

## Feature 15: Chord Tablature Group Building Block

### Specify Prompt

```
Feature: Chord Tablature Group Building Block

Implement the renderer and editor for the ChordTablatureGroup building block type.

JSON schema:
{
  "type": "ChordTablatureGroup",
  "chords": [
    { "chordId": "uuid", "label": "F Major" },
    { "chordId": "uuid", "label": "Am" }
  ]
}

- chords[].chordId: UUID referencing a chord in the library
- chords[].label: display label shown below the diagram (can differ from canonical name)
- Array order determines display order
- User can reorder diagrams

Renderer:
- Display a horizontal row of fretboard diagrams
- Each diagram uses the FretboardDiagram SVG component (from Feature 13) at "lg" size
- The first position (previewPosition) of each chord is shown by default
- Label displayed below each diagram
- If the row exceeds module width, wrap to the next line
- Spacing between diagrams should be consistent

Editor:
1. Add Chord:
   - "Add Chord" button → opens the Chord Selector Modal (from Feature 13)
   - On selection: appends { chordId, label: chord.name } to the chords array
   - The user can edit the label after adding (inline text edit below the diagram)

2. Remove Chord:
   - X button on each chord diagram → remove from array

3. Reorder Chords:
   - Drag-and-drop reordering of diagrams (dnd-kit SortableContext, horizontal)
   - Visual feedback during drag (ghost/placeholder)

4. Position Selection (optional enhancement):
   - If a chord has multiple positions, show a "position" indicator
   - Click to cycle through positions or show a position picker
   - Note: The current schema only stores chordId, not a specific positionIndex.
     The renderer fetches all positions via GET /chords/{id} and shows the first.
     If position selection is desired, the schema would need a positionIndex field.
     For now, always render the first position.

5. Label Editing:
   - Each chord's label is editable (text input below the diagram)
   - Default: the chord's canonical name from the library
   - User can customize (e.g., "F Barre" instead of "F Major")

Register as "ChordTablatureGroup" in the block registry.

Design requirements:
- Fretboard diagrams rendered at large size with the earthy SVG styling from Feature 13
- Labels below diagrams: clean, warm charcoal text
- Spacing between diagrams: generous, professional
- Editor controls (add/remove/reorder): earthy-styled, appear contextually on hover
- Drag reorder: subtle drag handles, warm ghost state during drag
- Empty state: "Add your first chord" with a muted earthy placeholder icon and
  dashed earthy border
```

### Plan Prompt

```
Plan the implementation of Feature 15: Chord Tablature Group Building Block.

Key considerations:

1. Each chord in the group requires fetching its full data (positions) from
   GET /chords/{id} to render the fretboard diagram. Use TanStack Query for each
   chord ID. These are cached (5 min staleTime), so repeated references to the same
   chord don't re-fetch.

2. The FretboardDiagram component from Feature 13 is used at "lg" size. The group
   component manages the horizontal layout and spacing.

3. Drag reordering: Use dnd-kit's SortableContext with useSortable for each diagram.
   The layout is horizontal, so use the horizontalListSortingStrategy.

4. Label editing: Simple inline text input below each diagram. On blur or Enter,
   update the label in the chords array and trigger auto-save.

5. The chords array can be empty (valid state — shows "Add your first chord" placeholder).

6. Performance: If a group has many chords (10+), each triggers a TanStack Query.
   The queries run in parallel and are individually cached. The FretboardDiagram SVG
   is lightweight, so rendering many diagrams is not a performance concern.

7. The module type ChordTablature has min dimensions 8x10 (taller than most modules)
   because fretboard diagrams need vertical space. The editor should use the full
   module height.
```

---

## Feature 16: Breadcrumb Module

### Specify Prompt

```
Feature: Breadcrumb Module

Implement the special rendering logic for the Breadcrumb module type. This module has
no user-editable content — its display is derived from the lesson's Subtitle modules.

Behavior:
- Breadcrumb module's content is always an empty array [] (server-enforced)
- The frontend derives its display by reading all Subtitle modules in the same lesson
- Subtitle modules are sorted by position (gridY ascending, then gridX ascending)
- For each Subtitle module, extract the text content from its Text building blocks
- Display as: "→ Subtitle 1 → Subtitle 2 → Subtitle 3"

Implementation:

1. Renderer:
   - Takes the current lesson's modules as context (not just the breadcrumb's own content)
   - Filters for modules with moduleType === "Subtitle"
   - Sorts by gridY, then gridX (across all pages of the lesson? or current page only?)
     Per the documentation: subtitle modules across the entire lesson.
   - Extracts text from each subtitle's content: filter blocks where type === "Text",
     concatenate all spans' text values
   - Renders: arrow-separated breadcrumb trail
   - Styled with the Breadcrumb module's bodyTextColor and fontFamily

2. Editor:
   - No editor. When the user enters edit mode on a Breadcrumb module, show a message:
     "This module's content is automatically generated from the Subtitle modules in
     this lesson. Add or edit Subtitle modules to update the breadcrumb."
   - The Breadcrumb module can still be repositioned/resized (Feature 8)

3. Real-time Updates:
   - When a Subtitle module is added, removed, edited, or moved in the lesson,
     the Breadcrumb module should update automatically
   - This requires the Breadcrumb renderer to react to changes in other modules
   - Use TanStack Query: the Breadcrumb reads from the modules query cache.
     When any module on any page of the lesson changes, the breadcrumb re-derives.

4. Cross-page awareness:
   - A lesson can have multiple pages. The breadcrumb collects subtitles from ALL pages.
   - This means the breadcrumb renderer needs access to modules from all pages of the
     lesson, not just the current page.
   - Consider a useLesson Subtitles(lessonId) hook that aggregates subtitle data.

Register as "Breadcrumb" in the block registry (renderer only, no editor).

Design requirements:
- The breadcrumb renders inside the notebook canvas with the Breadcrumb module style
- Arrow separators (→) in muted warm gray
- Subtitle text inherits the module's bodyTextColor and fontFamily
- The info message (shown in edit mode) uses earthy app styling: warm amber info box
  with clear, helpful text
- The overall breadcrumb trail should look like an elegant navigation path printed
  on the page — subtle, informative, not visually dominant
```

### Plan Prompt

```
Plan the implementation of Feature 16: Breadcrumb Module.

Key considerations:

1. The cross-page subtitle aggregation is the main challenge. The modules query is
   per-page (GET /pages/{pageId}/modules). To get subtitles from all pages:
   a. Fetch the lesson detail (GET /lessons/{id}) to get all page IDs
   b. For each page, read the modules from TanStack Query cache (they may already be
      cached from previous page views)
   c. Filter for Subtitle modules, sort, extract text

   This could be a custom hook: useLessonSubtitles(lessonId) that combines data from
   multiple page module queries.

2. Reactivity: When a subtitle module changes on any page, the breadcrumb should update.
   Since TanStack Query caches are reactive, the breadcrumb component will re-render
   when its dependent queries update. The key is making sure the hook depends on all
   relevant queries.

3. If some pages haven't been visited (modules not cached), the breadcrumb might show
   incomplete data. Options:
   a. Eagerly fetch all pages' modules when entering a lesson (might be excessive)
   b. Show breadcrumb based on cached data only, with a "..." for unknown pages
   c. Fetch all pages' modules in the background when the breadcrumb renders

   Option (c) is the best UX — the breadcrumb triggers background fetches for pages
   not yet cached.

4. The Breadcrumb block registry entry only has a Renderer, no Editor. The editor
   framework from Feature 9 should handle this gracefully (show the info message
   instead of block editors).
```

---

## Feature 17: PDF Export & SignalR

### Specify Prompt

```
Feature: PDF Export & SignalR Integration

Build the PDF export flow and the SignalR real-time notification system.

Backend API endpoints:
- POST /exports → { notebookId, lessonIds?: string[] | null } → { exportId, status } (202)
- GET /exports → PdfExport[] (user's exports, ordered by createdAt desc)
- GET /exports/{id} → PdfExport
- GET /exports/{id}/download → PDF file stream
- DELETE /exports/{id} → 204

SignalR hub: /hubs/notifications (requires JWT auth via query string)
Events:
- PdfReady(exportId: string, fileName: string)
- PdfFailed(exportId: string, errorCode: string)

Export flow:

1. Export Initiation (from notebook toolbar or dedicated button):
   - "Export PDF" button → opens export scope selector dialog:
     a. "Entire Notebook" — lessonIds: null
     b. "This Lesson Only" — lessonIds: [currentLessonId] (only shown when viewing a lesson)
     c. "Select Lessons" — multi-select checklist of all lessons
   - On confirm: POST /exports → receive exportId + status "Pending"
   - Show toast: "PDF export started. You'll be notified when it's ready."
   - Error 409 ACTIVE_EXPORT_EXISTS: "An export is already in progress for this notebook."

2. SignalR Connection:
   - Establish connection after successful authentication:
     new HubConnectionBuilder()
       .withUrl('{baseUrl}/hubs/notifications', { accessTokenFactory: () => getAccessToken() })
       .withAutomaticReconnect()
       .build()
   - Connection lifecycle:
     - Connect after login / successful silent refresh
     - Disconnect on logout
     - Auto-reconnect on transient failures
   - Event handlers:
     - PdfReady: show success toast with "Download PDF" action button
     - PdfFailed: show error toast with the error code

3. Polling Fallback:
   - If SignalR connection fails or is unavailable, fall back to polling
   - Poll GET /exports/{id} every 3 seconds
   - Stop polling when status becomes "Ready" or "Failed"
   - Show the same toast notifications as SignalR

4. PDF Download:
   - When export is Ready: GET /exports/{id}/download
   - Trigger browser download (Content-Disposition: attachment)
   - Options:
     a. window.open(url) — simplest, but doesn't include auth header
     b. Fetch with auth header → create blob URL → trigger download link click
   - Use option (b) since the endpoint requires authentication

5. Export History Page (/app/exports):
   - List of all user exports (GET /exports)
   - Each entry shows: notebook title, status badge (Pending/Processing/Ready/Failed),
     created date, completed date, scope (whole notebook or specific lessons)
   - Actions per export:
     - Ready: "Download" button
     - Pending/Processing: "Cancel" option (DELETE /exports/{id})
     - Any status: "Delete" button (DELETE /exports/{id})
   - Auto-refresh: poll the list or use SignalR events to update status in real-time

6. Export Status in Notebook View:
   - If an export is Pending or Processing for the current notebook, show an indicator
     in the notebook toolbar (spinner + "Exporting...")
   - When Ready: the indicator changes to a download button
   - This requires tracking active exports per notebook

Export lifecycle: Pending → Processing → Ready (24h) → auto-deleted
                                       → Failed

Error handling:
- ACTIVE_EXPORT_EXISTS (409) → "An export is already in progress"
- EXPORT_NOT_READY (404) → "Export is not ready for download"
- EXPORT_EXPIRED (404) → "Export has expired. Please create a new export."

Design requirements:
- Export scope selector dialog: earthy Dialog with clean lesson checklist. Checkboxes
  using earthy primary color. Scope options as radio buttons or segmented control
  (earthy styled). Clear CTA button.
- Toast notifications: earthy-themed toasts — success = sage green background,
  error = muted terracotta, info = warm amber. "Download PDF" action button in toast
  using primary brown.
- Export history page (/app/exports): clean table or card list, earthy styling.
  Status badges: Pending = warm amber, Processing = sage with spinner, Ready = green
  with download icon, Failed = muted red. Professional, dashboard-like layout.
- Toolbar export indicator: subtle spinner or progress dot in earthy tones, transitions
  smoothly to a download icon when ready.
- The overall export UX should feel confident and premium — clear status feedback,
  no ambiguity about what's happening.
```

### Plan Prompt

```
Plan the implementation of Feature 17: PDF Export & SignalR Integration.

Key considerations:

1. SignalR connection management: Create a SignalR service/hook that manages the
   connection lifecycle. It should:
   - Connect when the user is authenticated (token exists in Zustand)
   - Disconnect on logout or auth failure
   - Expose event subscription methods for components
   - Handle reconnection gracefully
   - Store connection state (connected/connecting/disconnected) in Zustand

2. The SignalR access token is passed via query string (not header). The
   accessTokenFactory callback must read from Zustand at call time (not closure time)
   to handle token refresh.

3. Download with auth: Use fetch/Axios to get the PDF blob, then create a temporary
   URL and trigger download:
   const response = await axios.get(`/exports/${id}/download`, { responseType: 'blob' });
   const url = URL.createObjectURL(response.data);
   const a = document.createElement('a');
   a.href = url; a.download = fileName; a.click();
   URL.revokeObjectURL(url);

4. Export status tracking: Use TanStack Query for the export list (key: ["exports"]).
   SignalR events trigger query invalidation:
   connection.on('PdfReady', () => queryClient.invalidateQueries(["exports"]));

5. The polling fallback should be encapsulated in a useExportStatus(exportId) hook
   that first tries SignalR and falls back to polling. Use TanStack Query's refetchInterval
   option for the polling case.

6. The export scope selector: When "Select Lessons" is chosen, fetch
   GET /notebooks/{id}/lessons to populate the checklist. Each lesson shows its title.
   The user can select/deselect individual lessons.

7. The notebook toolbar export indicator: A small component that queries for active
   exports for the current notebook. Filter the exports list by notebookId and status
   (Pending or Processing). Show spinner while active, download button when Ready.
```

---
