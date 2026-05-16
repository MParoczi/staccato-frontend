# Phase 2: Authentication - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete authentication UI and flows on top of Phase 1's wired infrastructure. LoginPage and RegisterPage go from empty stubs to real forms supporting email/password login, email/password registration, and Google OAuth. The `useProactiveRefresh` hook is introduced and mounted inside `ProtectedRoute`. Logout is wired to the API.

The underlying infrastructure — `authStore`, single-flight 401 refresh in `client.ts`, `rawClient`, `ProtectedRoute` spinner/redirect logic, and the boot refresh in `main.tsx` — was built in Phase 1 and **must not be changed**.

</domain>

<decisions>
## Implementation Decisions

### Auth Page Layout
- **D-01:** Centered card layout for both LoginPage and RegisterPage. No split-screen, no full-page form.
- **D-02:** "Staccato" app name rendered as a styled text heading above the card title (`auth.login.title` / `auth.register.title` from i18n). No image asset required.
- **D-03:** Subtle dotted-paper texture as the page background behind the card. This is CSS-only (e.g., `radial-gradient` dot pattern as a background-image) — **not** the canvas grid logic from Phase 6. Reinforces product identity on the entry screen. A CSS custom property or Tailwind utility class is sufficient.
- **D-04:** LoginPage.tsx and RegisterPage.tsx stay as two independent page components. No shared `AuthPage` wrapper.

### Form Validation & Errors
- **D-05:** Client-side validation triggers on blur (react-hook-form `mode: 'onBlur'`). Fields validate when the user leaves them, not on every keystroke.
- **D-06:** Server errors (wrong credentials, email already taken) are displayed as **Sonner toast notifications**. The `<Toaster />` is already mounted in `main.tsx`. Use `toast.error()` with the relevant i18n string (`auth.errors.invalidCredentials`, `auth.errors.emailTaken`).
- **D-07:** Zod for form schema validation, paired with `@hookform/resolvers/zod`. Consistent with Phase 1's `src/env.ts` Zod usage.
- **D-08:** Register password field requires **minimum 8 characters** only. No complexity rules (no uppercase/symbol requirements). Researcher should confirm the backend enforces the same or weaker policy.

### Google OAuth Integration
- **D-09:** Use the `GoogleLogin` component from `@react-oauth/google`. Renders Google's standard styled button with Google branding. `onSuccess` receives a credential (ID token); send it to `rawClient.post('/auth/google', { idToken: credential.credential })`.
- **D-10:** Google button appears **above** the email/password form, separated by an "or" divider (use the `Separator` component). Layout order: `GoogleLogin` → `Separator` with "or" text → email/password form fields.
- **D-11:** `GoogleOAuthProvider` wraps the whole app in `main.tsx` alongside `QueryClientProvider`. Client ID from a new `VITE_GOOGLE_CLIENT_ID` env variable (add to `src/env.ts` Zod schema and `.env.example`).

### Proactive Token Refresh
- **D-12:** `useProactiveRefresh` decodes the JWT access token using `atob` on the payload segment (no extra library). Reads the `exp` claim. Schedules a `setTimeout` for `(exp * 1000 - Date.now() - 60_000)` ms. Dynamically accurate — adjusts to the actual token lifetime.
- **D-13:** `useProactiveRefresh` is mounted **inside `ProtectedRoute`** (called in the component body before the `return <Outlet />`). Natural lifecycle: starts when user is authenticated, unmounts on logout/unauthentication.
- **D-14:** On a successful proactive refresh, the hook calls `useAuthStore.getState().setAuth(user, newToken)` to keep the store's access token current. Mirrors the pattern used in the boot refresh in `main.tsx`.

### Claude's Discretion
- Internal layout of `src/features/auth/` (components, hooks, types subdirectory structure) — planner chooses a consistent pattern matching the project convention.
- Whether login/register/logout/google API calls are plain async functions in a service file or TanStack Query mutations — planner decides (TanStack Query mutations are natural for mutations with loading/error state; plain functions are simpler for fire-and-forget calls like logout).
- The exact auth API request/response shapes for `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/logout` — researcher must verify against the backend spec. The response for login/register should return `{ accessToken: string; user: UserProfile }` (matches the existing boot refresh contract).
- `displayName` field validation on Register (max length?) — defer to backend spec; researcher should confirm.
- ERR-03 (5xx retry ×3): the `QueryClient` in `main.tsx` already retries non-4xx failures up to 3 times for TanStack Query queries. Planner decides if auth mutations (which bypass TanStack Query) need their own retry wrapper.
- ERR-04: Refresh failure → `clearAuth()` → `ProtectedRoute` redirects to `/login`. This is already implemented in `client.ts`'s `.catch` block. Planner verifies it covers all logout scenarios.
- I18N-03: The `auth` namespace already has the core strings. Planner adds any missing keys (e.g., validation messages) to both `public/locales/en/auth.json` and `public/locales/hu/auth.json` (HU stubs as `"__HU_TODO__"`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Constraints
- `.planning/PROJECT.md` — Key Decisions table: token in Zustand memory, HttpOnly cookie, single-flight refresh, rawClient, React Router navigation
- `CLAUDE.md` — Hard constraints: pnpm only, no localStorage tokens, single Axios instance at `src/api/client.ts`, no `window.location`, Lucide icons only, no cross-feature imports

### Phase Scope
- `.planning/ROADMAP.md` §Phase 2 — 5 success criteria define the acceptance bar; these are the test cases for done

### Existing Infrastructure (read before touching)
- `src/stores/authStore.ts` — Store shape: `{ status, user, accessToken }` with `setAuth`, `clearAuth`, `setLoading` actions. **Do not add persist.**
- `src/api/client.ts` — Single-flight 401 refresh interceptor; module-level `refreshPromise`. **Do not duplicate this logic.**
- `src/api/rawClient.ts` — Bare Axios for auth endpoints; avoids circular interceptor. Auth API calls (login, register, logout, google, refresh) **must use rawClient**.
- `src/main.tsx` — Boot refresh sequence before ReactDOM.render; `GoogleOAuthProvider` wraps here (D-11).
- `src/components/ui/ProtectedRoute.tsx` — `useProactiveRefresh` mounts here (D-13). Outlet renders when `status === 'authenticated'`.

### Pages to Build Out
- `src/pages/LoginPage.tsx` — Current stub returns `<div>Login</div>`. Phase 2 fills this out.
- `src/pages/RegisterPage.tsx` — Current stub returns `<div>Register</div>`. Phase 2 fills this out.

### i18n
- `public/locales/en/auth.json` — Already has `login`, `register`, `google`, `errors` keys. Add missing validation strings; mirror stubs in `public/locales/hu/auth.json`.
- `src/types/index.ts` — `UserProfile` interface — what `setAuth(user, accessToken)` expects as first argument.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/form.tsx` — shadcn Form (FormProvider, FormField, FormItem, FormLabel, FormControl, FormMessage). Use for both Login and Register forms with react-hook-form.
- `src/components/ui/input.tsx` — Input component for email, password, displayName fields.
- `src/components/ui/button.tsx` — Button for form submit.
- `src/components/ui/checkbox.tsx` — Checkbox for the "Remember Me" toggle on LoginPage.
- `src/components/ui/separator.tsx` — Use for the "or" divider between Google OAuth button and email/password form.
- `src/components/ui/sonner.tsx` + `<Toaster />` — Already mounted in `main.tsx`. Call `toast.error()` for server auth errors.
- `src/lib/utils.ts` — `cn()` helper for conditional class names.

### Established Patterns
- `rawClient` (not `client`) for all auth API calls — avoids the 401 interceptor loop.
- Boot refresh in `main.tsx` is the canonical model for `useProactiveRefresh`: `rawClient.post('/auth/refresh').then(({ data }) => setAuth(data.user, data.accessToken)).catch(() => clearAuth())`.
- Zod schema + `@hookform/resolvers/zod` — matches the Zod-for-env-validation pattern from Phase 1.
- `import type { … }` required for type-only imports (`verbatimModuleSyntax: true`).
- No `enum` — use `as const` union types.
- `useNavigate()` from `react-router` for post-auth redirect to `/app/notebooks`.

### Integration Points
- `rawClient.post<{ accessToken: string; user: UserProfile }>('/auth/login', { email, password, rememberMe })` → `setAuth(user, accessToken)`
- `rawClient.post<{ accessToken: string; user: UserProfile }>('/auth/register', { email, displayName, password })` → `setAuth(user, accessToken)`
- `rawClient.post('/auth/google', { idToken: credential.credential })` → `setAuth(user, accessToken)` — researcher confirms exact request shape
- `rawClient.post('/auth/logout')` → `clearAuth()` → `ProtectedRoute` redirects to `/login`
- `useAuthStore.getState().setAuth(user, newToken)` inside `useProactiveRefresh` on successful refresh

</code_context>

<specifics>
## Specific Ideas

- The dotted-paper background on auth pages (D-03) was specifically requested to reinforce the notebook product identity on the entry screens. Keep the dots very subtle (low opacity) so the form card remains the visual focus.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Authentication*
*Context gathered: 2026-05-16*
