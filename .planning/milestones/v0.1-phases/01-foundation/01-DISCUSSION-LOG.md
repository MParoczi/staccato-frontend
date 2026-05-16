# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 1-Foundation
**Areas discussed:** Boot loading state, Route scaffolding scope, shadcn pre-installation scope, i18n namespace strategy

---

## Boot Loading State

### Q1: What does the user see during POST /auth/refresh on boot?

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen spinner | Centred loader covers viewport until auth resolves; prevents flash of login for returning users | ✓ |
| Blank / white screen | Nothing rendered until auth settles; looks broken on slow connections | |
| App shell skeleton | Render layout frame immediately, swap in content once auth resolves | |

**User's choice:** Full-screen spinner

---

### Q2: How should ProtectedRoute behave while auth state is "unknown"?

| Option | Description | Selected |
|--------|-------------|----------|
| Render nothing / show spinner | Hold rendering until refresh resolves; user lands on correct page directly | ✓ |
| Redirect to /login immediately, then back | Double-navigation flash — generally undesirable | |

**User's choice:** Render nothing / show spinner

---

### Q3: Where does the spinner live architecturally?

| Option | Description | Selected |
|--------|-------------|----------|
| Inside ProtectedRoute | ProtectedRoute checks authStore.status; renders spinner while 'loading' | ✓ |
| In root App component | App wraps everything in loader gate; harder to compose with public routes | |
| Separate AuthGate wrapper | Dedicated component above router; explicit but extra layer | |

**User's choice:** Inside ProtectedRoute

---

### Q4: authStore shape?

| Option | Description | Selected |
|--------|-------------|----------|
| status + user + accessToken | `status: 'loading' \| 'authenticated' \| 'unauthenticated'`; single discriminant drives all logic | ✓ |
| isLoading + isAuthenticated + user + accessToken | Boolean flags; more fields to keep in sync | |
| You decide | Let planner choose | |

**User's choice:** status + user + accessToken

---

## Route Scaffolding Scope

### Q1: How much of the route tree to wire in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Only Phase 1 routes | Wire /, /login, /register, /app/notebooks. Later phases add their own. | ✓ |
| All known routes as empty shells | Wire every route from the roadmap now | |

**User's choice:** Only Phase 1 routes

---

### Q2: Behavior of / (root)?

| Option | Description | Selected |
|--------|-------------|----------|
| / always redirects — no content | Unauthenticated → /login; authenticated → /app/notebooks | ✓ |
| / renders a public landing page | Marketing/home page; adds public page to Phase 1 scope | |

**User's choice:** / always redirects — no content

---

### Q3: Routing pattern?

| Option | Description | Selected |
|--------|-------------|----------|
| Config-based (createBrowserRouter) | All routes in src/router.tsx; full control over layout nesting and lazy loading | ✓ |
| File-based routing (framework mode) | Convention-over-config; may conflict with Vite 8 config | |

**User's choice:** Config-based (createBrowserRouter)

---

## shadcn Pre-installation Scope

### Q1: How much to pre-install?

| Option | Description | Selected |
|--------|-------------|----------|
| Full known set upfront | Button, Input, Label, Form, Dialog, Sheet, Select, Checkbox, Table, Textarea, Sonner, Badge, Avatar, Separator, DropdownMenu, Tooltip, Skeleton | ✓ |
| Phase 1 minimum only | Button, Input, Label — later phases install theirs | |

**User's choice:** Full known set upfront

---

### Q2: Where do non-shadcn custom components live?

| Option | Description | Selected |
|--------|-------------|----------|
| src/components/ui/ alongside shadcn | All primitives together; provenance tracked by git | ✓ |
| src/components/custom/ separate | Explicit separation; more folders | |
| src/components/ flat | Everything flat; gets noisy at scale | |

**User's choice:** src/components/ui/ alongside shadcn

---

### Q3: CSS token palette?

| Option | Description | Selected |
|--------|-------------|----------|
| Planner derives from shadcn defaults + neutral base | Researcher/planner picks tokens consistent with radix-nova; user tunes later | ✓ |
| I have a specific palette | User specifies exact values now | |

**User's choice:** Planner derives from shadcn defaults + neutral base

---

## i18n Namespace Strategy

### Q1: Namespace organization?

| Option | Description | Selected |
|--------|-------------|----------|
| Define all namespaces now, populate incrementally | common, auth, notebooks, lessons, canvas, chords, styles, profile — all created as empty JSON | ✓ |
| Start with common only, add per phase | Minimal upfront; repeated file-creation work | |
| Single namespace for everything | One file; grows large by Phase 12 | |

**User's choice:** Define all namespaces now, populate incrementally

---

### Q2: Locale file strategy for Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Both locales from day one, hu files empty | public/locales/en/*.json (real) + public/locales/hu/*.json (empty/TODO) | ✓ |
| English only in Phase 1, add hu in Phase 12 | Risks key-structure drift | |

**User's choice:** Both locales from day one, hu files empty

---

### Q3: i18next loading strategy?

| Option | Description | Selected |
|--------|-------------|----------|
| Static JSON files fetched at runtime via i18next-http-backend | Files in public/locales/; standard pattern; CDN-compatible | ✓ |
| Bundled via import (inline) | No network round-trip; inflates bundle; hard to update without redeploy | |

**User's choice:** Static JSON files fetched at runtime via i18next-http-backend

---

## Claude's Discretion

- Exact folder structure inside `src/features/` (internal layout per feature)
- Environment variable validation approach (Zod schema vs. manual checks)
- Axios interceptor implementation details (handled by PROJECT.md Key Decisions)
- Vite plugin selection (`@vitejs/plugin-react` vs. `@vitejs/plugin-react-swc`)

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
