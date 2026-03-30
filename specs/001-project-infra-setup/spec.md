# Feature Specification: Project Infrastructure Setup

**Feature Branch**: `001-project-infra-setup`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Set up the foundational infrastructure for the Staccato frontend — a React TypeScript SPA built with Vite."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Starts Feature Work on a Configured Codebase (Priority: P1)

A developer clones the repository and wants to start building the first user-facing feature (e.g., authentication or notebook dashboard). They need all foundational libraries installed, configuration wired, folder conventions established, and shared types available — so they can import from well-known paths and focus entirely on feature logic.

**Why this priority**: Without the infrastructure in place, no feature work can begin. This is the prerequisite for the entire project.

**Independent Test**: Can be verified by confirming the development server starts without errors, all configured routes resolve (even to placeholder pages), the Axios instance is importable and configured, stores are accessible, i18n returns translations, and all TypeScript types compile without errors.

**Acceptance Scenarios**:

1. **Given** the repository is freshly cloned, **When** a developer runs the install and dev commands, **Then** the application starts without errors and renders a root page.
2. **Given** the project is running, **When** a developer imports any shared type (e.g., `NotebookSummary`, `ModuleType`), **Then** TypeScript resolves the type without errors.
3. **Given** the project is running, **When** a developer imports the Axios instance, **Then** it is pre-configured with the base URL from environment variables and credential inclusion.

---

### User Story 2 - Developer Navigates the Route Structure (Priority: P1)

A developer needs to verify that the routing skeleton is in place — public routes exist for login/register, protected routes exist under `/app/*`, and unauthenticated access to protected routes redirects to login.

**Why this priority**: Routing is the backbone of the SPA; every feature plugs into this structure.

**Independent Test**: Can be verified by navigating to each defined route path and confirming the correct placeholder or redirect behavior.

**Acceptance Scenarios**:

1. **Given** no authentication token is present, **When** a user navigates to `/`, **Then** they are redirected to `/login`.
2. **Given** no authentication token is present, **When** a user navigates to `/app/notebooks`, **Then** they are redirected to `/login`.
3. **Given** a valid authentication token is present, **When** a user navigates to `/`, **Then** they are redirected to `/app/notebooks`.
4. **Given** a valid authentication token is present, **When** a user navigates to `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`, **Then** the route resolves without error.

---

### User Story 3 - Developer Uses the Design System Theme (Priority: P1)

A developer building a UI component needs the earthy design system theme to be available via Tailwind CSS classes and shadcn/ui primitives. They expect buttons, cards, and other primitives to use earthy tones (warm browns, olive greens, muted golds) by default — not generic zinc/slate.

**Why this priority**: Visual consistency from day one prevents costly redesigns later. All feature UIs depend on the theme.

**Independent Test**: Can be verified by rendering a shadcn/ui Button and Card component and confirming they use the earthy color palette (warm brown primary, cream background) instead of default zinc/slate.

**Acceptance Scenarios**:

1. **Given** the design system is configured, **When** a developer renders a shadcn/ui Button, **Then** it displays in the warm brown/terracotta primary color.
2. **Given** the design system is configured, **When** a developer inspects the page background, **Then** it uses a cream/warm off-white color (not pure white).
3. **Given** the design system is configured, **When** a developer uses the `destructive` variant, **Then** it renders in a muted terracotta-red (not harsh red).

---

### User Story 4 - Developer Configures Server Communication (Priority: P2)

A developer building an API integration needs the Axios instance to automatically handle authentication headers, language preferences, and token refresh — so they only write the endpoint-specific logic.

**Why this priority**: Consistent HTTP configuration prevents auth bugs and reduces boilerplate across all future API calls.

**Independent Test**: Can be verified by inspecting the Axios instance configuration and confirming interceptors are registered for authorization header injection, language header injection, and 401 response handling.

**Acceptance Scenarios**:

1. **Given** the auth store contains an access token, **When** any API request is made, **Then** the `Authorization: Bearer <token>` header is automatically attached.
2. **Given** the user's language preference is Hungarian, **When** any API request is made, **Then** the `Accept-Language: hu` header is attached.
3. **Given** a request returns 401, **When** the interceptor fires, **Then** it attempts to call `POST /auth/refresh` and retries the original request with the new token.
4. **Given** the refresh call also fails, **When** the retry is exhausted, **Then** the user is redirected to `/login` and the auth store is cleared.

---

### User Story 5 - Developer Uses Internationalization (Priority: P2)

A developer adding UI text needs to use translation keys instead of hardcoded strings. The i18n system must be initialized with English and Hungarian skeleton files, and language detection must work from the browser default.

**Why this priority**: i18n is structural — retrofitting it later means touching every component. Setting it up early is significantly cheaper.

**Independent Test**: Can be verified by switching the language setting and confirming that translation keys resolve to the correct language's values.

**Acceptance Scenarios**:

1. **Given** the i18n system is initialized, **When** a developer calls a translation function with a key present in `en.json`, **Then** the English string is returned.
2. **Given** the user's browser language is Hungarian, **When** the application loads (before login), **Then** Hungarian translations are used by default.

---

### User Story 6 - Developer References Backend Data Structures (Priority: P2)

A developer building any feature that touches the backend API needs TypeScript types that mirror all backend DTOs and enums — so they get compile-time safety and autocomplete for all request/response shapes.

**Why this priority**: Shared types prevent runtime errors from shape mismatches and accelerate development with autocomplete.

**Independent Test**: Can be verified by importing each type and enum and confirming they compile and match the backend documentation.

**Acceptance Scenarios**:

1. **Given** the types are defined, **When** a developer imports `ModuleType`, **Then** it provides autocomplete for all 12 module types.
2. **Given** the types are defined, **When** a developer constructs a `NotebookDetail` object missing required fields, **Then** TypeScript raises a compile error.

---

### Edge Cases

- What happens when `VITE_API_BASE_URL` is not set in the environment? The Axios instance should fail clearly at development time rather than silently sending requests to a wrong URL.
- What happens when both a stored access token and a refresh attempt are invalid? The application should clear all auth state and redirect to login without entering an infinite refresh loop.
- What happens when an unsupported language is detected from the browser? The system should fall back to English as the default language.
- What happens when a developer navigates to an undefined route under `/app/*`? A catch-all route should show a minimal not-found page.
- What happens when an unauthenticated user deep-links to a protected route (e.g., `/app/notebooks/123`)? The system should preserve the intended URL and redirect back to it after successful login.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Tailwind CSS configuration with a custom earthy design system theme including primary (warm brown/terracotta), secondary (olive/sage green), accent (muted gold/amber), neutral (warm grays/charcoal), background (cream/warm off-white), surface (warm-tinted white), and destructive (muted terracotta-red) color scales. Both light and dark mode values MUST be defined — dark mode uses deeper, warmer earthy tones (not cold blue-gray). Typography MUST use the system font stack (no custom web fonts).
- **FR-002**: System MUST include a "notebook" color subset for the dotted-paper canvas area, defining paper-white, dot color, selection highlight, and drag-hover indicator colors.
- **FR-003**: System MUST configure shadcn/ui CSS variables to map to the earthy palette so all primitives render in earthy tones by default.
- **FR-004**: System MUST provide a pre-configured HTTP client instance with base URL from environment variable, credential inclusion for HttpOnly cookie transport, JSON content type, and a 30-second default request timeout.
- **FR-005**: System MUST automatically inject the authorization header from the auth store on every outgoing request when a token is present.
- **FR-006**: System MUST automatically inject the language preference header based on the user's current language setting on every outgoing request.
- **FR-007**: System MUST intercept 401 responses to silently attempt token refresh, retry the original request on success, and redirect to login on failure.
- **FR-008**: System MUST prevent infinite refresh loops (a failed refresh must not trigger another refresh attempt).
- **FR-009**: System MUST provide a server state management client with sensible defaults for stale time, retry logic, and error handling.
- **FR-010**: System MUST provide a client state store for authentication with access token storage and clear capabilities.
- **FR-011**: System MUST provide a client state store for UI concerns with sidebar open state, selected module ID, zoom level (bounded 0.25 to 3.0), and theme preference (light/dark/system).
- **FR-012**: System MUST define routes for: `/login`, `/register` (public), and `/app/notebooks`, `/app/notebooks/new`, `/app/notebooks/:notebookId`, `/app/notebooks/:notebookId/index`, `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`, `/app/profile`, `/app/exports`, `/app/chords` (protected).
- **FR-013**: System MUST redirect the root path to the notebooks dashboard when authenticated, or to the login page when not authenticated.
- **FR-014**: System MUST provide a route guard that redirects unauthenticated users to the login page. The guard MUST attempt a silent token refresh before redirecting (handles page reload). It MUST show a loading state during refresh — never flash the login page. It MUST preserve the intended URL so the user is redirected back after successful login.
- **FR-014a**: Public routes (`/login`, `/register`) MUST redirect already-authenticated users to `/app/notebooks`.
- **FR-015**: System MUST initialize internationalization with English and Hungarian translation skeleton files. Skeleton files MUST contain the namespace structure with sample keys per namespace (e.g., `common.save`, `common.cancel`, `auth.*`, `notebooks.*`) to establish the pattern for feature developers.
- **FR-016**: System MUST detect the user's language from the browser default before login, and from the user profile after login.
- **FR-017**: System MUST provide an environment configuration example file documenting required environment variables.
- **FR-018**: System MUST establish a clear folder structure separating API logic, shared components, feature-specific components, custom hooks, state stores, utilities, internationalization files, and route definitions. A path alias (`@/` resolving to `src/`) MUST be configured in both TypeScript and the build tool.
- **FR-019**: System MUST define TypeScript types mirroring all backend data transfer objects: User, NotebookSummary, NotebookDetail, LessonSummary, LessonDetail, LessonPage, Module, NotebookModuleStyle, ChordSummary, ChordDetail, ChordPosition, ChordString, ChordBarre, PdfExport, SystemStylePreset, UserSavedPreset, StyleEntry, NotebookIndex, NotebookIndexEntry, Instrument.
- **FR-020**: System MUST define TypeScript types for all backend enumerations: ModuleType, BuildingBlockType, BorderStyle, FontFamily, PageSize, InstrumentKey, Language.
- **FR-021**: System MUST provide constant lookup tables for page size grid dimensions, module minimum sizes, allowed building blocks per module type, and the chromatic scale.
- **FR-022**: System MUST install the SignalR client library as a dependency (connection setup is deferred to a future feature).
- **FR-023**: System MUST install form handling and schema validation libraries as dependencies.
- **FR-024**: System MUST install the Google OAuth client library as a dependency (wiring deferred to the authentication feature).
- **FR-025**: System MUST provide a minimal not-found page for undefined routes under the protected area.
- **FR-026**: The earthy design system color palette MUST meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text) in both light and dark modes.

### Key Entities

- **Design System Theme**: The earthy color palette configuration that controls the visual identity of all UI components — warm browns, olive greens, muted golds, cream backgrounds.
- **HTTP Client Instance**: The centralized HTTP client configured with authentication, language, and token refresh behavior.
- **Auth Store**: Client-side state holding the access token and providing methods to update or clear authentication.
- **UI Store**: Client-side state for transient UI concerns — sidebar visibility, selected module, zoom level, theme preference.
- **Route Structure**: The hierarchical mapping of URL paths to application views, split between public and protected sections.
- **Shared Types**: TypeScript interfaces and enums that mirror the backend API contract, ensuring type safety across all features.
- **Constants**: Static lookup tables for grid dimensions, module size constraints, allowed building blocks, and the chromatic scale.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The application starts and renders without errors after a fresh install and dev server start — verified in under 60 seconds.
- **SC-002**: All defined route paths resolve correctly — public routes are accessible without authentication, protected routes redirect to login when unauthenticated.
- **SC-003**: UI primitives (buttons, cards, dialogs) render using the earthy theme colors by default — no generic gray defaults visible.
- **SC-004**: The background color of the application is a cream/warm off-white tone, not pure white.
- **SC-005**: All 20+ shared TypeScript types and 7 enumeration types compile without errors and match the backend API documentation field-for-field.
- **SC-006**: The HTTP client instance includes all four configured behaviors: base URL from environment, auth header injection, language header injection, and 401 refresh interceptor.
- **SC-007**: Translation keys resolve correctly for both English and Hungarian languages.
- **SC-008**: All constant lookup tables (page size dimensions, module minimum sizes, allowed building blocks, chromatic scale) are complete and match the backend documentation values.
- **SC-009**: All required dependencies are installed and importable without errors.

## Assumptions

- The Vite + React + TypeScript project is already scaffolded and the dev server starts correctly before this feature begins.
- The backend API is not yet available for integration testing; all HTTP configuration is structural and will be validated against a running backend in future features.
- The token refresh endpoint uses HttpOnly cookies (the refresh token is never stored in client-accessible state).
- English is the default fallback language when the browser language is not English or Hungarian.
- The SignalR client library is install-only in this feature; the actual hub connection and event handling are deferred to a later feature.
- Form handling and validation libraries are install-only in this feature; actual form implementations are built in their respective features.
- Route paths render placeholder components (empty or minimal) — no actual page UI is built in this feature.
- The "notebook" palette subset is structural configuration — the actual dotted-paper canvas rendering is a future feature concern.
