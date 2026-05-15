# Phase 1: Foundation - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the complete technical skeleton for the Staccato SPA: Vite + TypeScript build configuration, Tailwind v4 CSS-first setup, shadcn radix-nova primitives, config-based routing structure, single Axios HTTP client with interceptors, Zustand auth store, TanStack QueryClient, ProtectedRoute with boot-state spinner, i18n bootstrap, and environment variable validation. No user-visible feature logic — this is the substrate every subsequent phase builds on.

</domain>

<decisions>
## Implementation Decisions

### Boot Loading State
- **D-01:** Show a full-screen spinner during `POST /auth/refresh` silent restore on app boot — no flash of login page for returning users.
- **D-02:** `ProtectedRoute` holds rendering while `authStore.status === 'loading'`; it never redirects to `/login` prematurely during the in-flight refresh.
- **D-03:** The full-screen spinner lives inside `ProtectedRoute` — not in the App root component and not in a separate `AuthGate` wrapper.
- **D-04:** `authStore` shape: `{ status: 'loading' | 'authenticated' | 'unauthenticated', user: UserProfile | null, accessToken: string | null }`. The `status` discriminant drives spinner and redirect logic cleanly.

### Route Scaffolding Scope
- **D-05:** Wire only Phase 1 routes as page shells: `/`, `/login`, `/register`, `/app/notebooks`. Later phases add their own routes when they build real pages.
- **D-06:** `/` (root) is a pure redirect with no page content — unauthenticated → `/login`, authenticated → `/app/notebooks`. There is no public landing page.
- **D-07:** Config-based routing using `createBrowserRouter` defined in `src/router.tsx`. No file-based / framework-mode routing.

### shadcn Pre-installation Scope
- **D-08:** Pre-install the full known component set in Phase 1 (one-time cost): `Button`, `Input`, `Label`, `Form`, `Dialog`, `Sheet`, `Select`, `Checkbox`, `Table`, `Textarea`, `Sonner`, `Badge`, `Avatar`, `Separator`, `DropdownMenu`, `Tooltip`, `Skeleton`.
- **D-09:** All shared UI components — both shadcn-generated and hand-written (e.g., `DotGrid`, `FretboardDiagram`) — live together in `src/components/ui/`. No separate `custom/` subdirectory.
- **D-10:** Color tokens (CSS variables in `src/index.css`) are derived by the planner from shadcn defaults + neutral base, radix-nova style. User will tune palette in a later styling pass.

### i18n Namespace Strategy
- **D-11:** Define all namespaces upfront as empty JSON objects; each phase populates its own. Namespaces: `common`, `auth`, `notebooks`, `lessons`, `canvas`, `chords`, `styles`, `profile`.
- **D-12:** Both locales scaffolded from day one: `public/locales/en/*.json` (real strings filled incrementally) and `public/locales/hu/*.json` (empty or `"TODO"` values, filled in Phase 12). Prevents en/hu key-structure drift.
- **D-13:** `i18next-http-backend` loads translation files at runtime from `public/locales/`; files are NOT bundled inline. Supports CDN hosting and translation updates without a redeploy.

### Claude's Discretion
- Exact folder structure inside `src/features/` (each feature's internal layout of `components/`, `hooks/`, `types/`) — planner chooses a consistent pattern.
- Environment variable validation approach (Zod schema vs. manual checks) — planner chooses.
- Axios interceptor implementation details (request interceptor for `Authorization` + `Accept-Language`, response interceptor for 401 → single-flight refresh) — planner follows PROJECT.md Key Decisions.
- Vite plugin selection (`@vitejs/plugin-react` vs. `@vitejs/plugin-react-swc`) — planner chooses based on Vite 8 compatibility.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — all locked architectural and technology decisions; Key Decisions table documents token storage, single-flight refresh, rawClient, etc.
- `.planning/REQUIREMENTS.md` — full v1 requirements list; AUTH-01–06 define the auth model Phase 1 must scaffold
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 criteria) define the acceptance bar

### Project Constraints (also in CLAUDE.md)
- `CLAUDE.md` — hard constraints: pnpm only, erasableSyntaxOnly, verbatimModuleSyntax, no localStorage tokens, single Axios instance at `src/api/client.ts`, React Router only, Lucide only, Tailwind v4 CSS-first, no cross-feature imports, SignalR dynamically imported

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is a greenfield project. Phase 1 creates all foundational assets.

### Established Patterns
- None yet — Phase 1 establishes the patterns all subsequent phases follow.

### Integration Points
- Backend: ASP.NET Core 10 WebAPI (separate repo). `src/api/client.ts` Axios instance is the single integration point. Base URL from `VITE_API_BASE_URL` env var.
- Auth: `POST /auth/refresh` is called on boot (silent restore) and proactively before expiry. Access token returned in JSON body; refresh token in HttpOnly cookie.

</code_context>

<specifics>
## Specific Ideas

- No specific references or "like X" moments from discussion — open to standard Vite + React 19 scaffold patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-05-15*
