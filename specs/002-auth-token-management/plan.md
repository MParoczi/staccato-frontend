# Implementation Plan: Authentication & Token Management

**Branch**: `002-auth-token-management` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-auth-token-management/spec.md`

## Summary

Implement the complete authentication flow for Staccato's frontend: local login, local registration, Google OAuth sign-in, silent token refresh with proactive timer, and logout. The existing codebase already provides significant infrastructure (Axios client with 401 interceptor, auth store, ProtectedRoute, routing, i18n setup, design tokens) but the auth API module has type mismatches with the backend contract and the auth pages are placeholder components. This plan covers fixing the API layer, building the two auth pages with premium earthy design, adding proactive token refresh, rate limit handling, and WCAG 2.1 AA accessibility.

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode enabled
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod 4, react-i18next, @react-oauth/google, Lucide React
**Storage**: N/A (frontend-only; access token in Zustand memory, refresh token in backend-managed HttpOnly cookie)
**Testing**: Vitest + React Testing Library + MSW (Mock Service Worker)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge latest 2)
**Project Type**: Web application (SPA frontend)
**Performance Goals**: Login flow <15s end-to-end, form validation feedback <200ms
**Constraints**: Token stored in memory only (never localStorage/sessionStorage), WCAG 2.1 AA compliance, zero emojis (Lucide icons only), max 250 lines per component
**Scale/Scope**: 2 auth pages, 1 OAuth integration, token refresh system, ~15 new/modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Folder Structure | PASS | Auth pages in `src/features/auth/`, schemas in feature folder, API in `src/api/auth.ts` |
| II. State Management | PASS | Token in Zustand (client-only state). Auth refresh is explicitly exempted from TanStack Query per constitution. |
| III. API Integration | PASS | All calls through centralized Axios client. Token in memory. Concurrent 401 queue already implemented. |
| IV. Component Architecture | PASS | Presentational components (LoginForm, RegisterForm) + page components (LoginPage, RegisterPage). Function components only. |
| V. Design System — Zone 1 | PASS | Auth pages belong to Zone 1 (App Shell). Earthy-modern theme with CSS variables already defined. |
| VI. No Emojis | PASS | Lucide icons for all UI indicators. Google "G" brand mark is a required third-party logo (OAuth compliance), not a UI indicator — does not violate this principle. |
| VII. Form Handling | PASS | React Hook Form + Zod. Schemas in `src/features/auth/schemas/`. Server errors mapped via `setError`. |
| VIII. Routing | PASS | Routes already defined. ProtectedRoute handles silent refresh on mount. PublicLayout redirects authenticated users. |
| IX. i18n | PASS | Namespaced `auth.*` translations in en.json/hu.json. |
| X. Type Safety | PASS | Strict mode. All auth DTOs typed in `src/lib/types/auth.ts`. |
| XI. Performance | N/A | No grid canvas or drag operations in auth pages. |
| XII. Testing | PASS | Vitest + colocated tests. Priority: Zod schemas (unit), auth store transitions (unit), interceptor retry (unit with MSW), auth flows (integration with RTL). |

**Gate result: ALL PASS** — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-token-management/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity & type definitions
├── contracts/
│   └── auth-api.md      # Phase 1: backend API contract consumed by frontend
├── quickstart.md        # Phase 1: dev setup guide
└── tasks.md             # Phase 2: task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
  api/
    auth.ts                 # MODIFY: fix request/response types to match backend
    client.ts               # MODIFY: update silentRefresh to extract expiresIn and call setAuth
    raw-client.ts           # NO CHANGE
  features/
    auth/
      components/
        AuthLayout.tsx          # NEW: split layout (branding panel | form panel)
        LoginForm.tsx           # NEW: login form with RHF + Zod
        RegisterForm.tsx        # NEW: register form with RHF + Zod
        GoogleSignInButton.tsx  # NEW: GoogleLogin component wrapper with earthy container
        PasswordInput.tsx       # NEW: password field with visibility toggle
      hooks/
        useProactiveRefresh.ts  # NEW: timer-based token refresh at 80% lifetime
        useRateLimitError.ts    # NEW: parse 429 + countdown state
      schemas/
        login-schema.ts         # NEW: Zod schema mirroring backend validation
        register-schema.ts      # NEW: Zod schema mirroring backend validation
      LoginPage.tsx             # NEW: page component composing AuthLayout + LoginForm
      RegisterPage.tsx          # NEW: page component composing AuthLayout + RegisterForm
  stores/
    authStore.ts            # MODIFY: add expiresAt, rename setAccessToken → setAuth
  routes/
    protected-route.tsx     # MODIFY: proper full-screen loading spinner
    index.tsx               # MODIFY: import real auth page components
    placeholders.tsx        # MODIFY: remove LoginPage/RegisterPage placeholders
  i18n/
    en.json                 # MODIFY: expand auth.* namespace (all form labels, errors, buttons)
    hu.json                 # MODIFY: expand auth.* namespace (Hungarian translations)
  App.tsx                   # MODIFY: wrap with GoogleOAuthProvider
  lib/
    types/
      auth.ts               # MODIFY: add AuthResponse, LoginRequest, RegisterRequest types
```

**Structure Decision**: Single SPA frontend following the constitution's folder structure. Auth feature is self-contained in `src/features/auth/` with its own components, hooks, and schemas. Shared API layer and store updates live in their canonical locations.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
