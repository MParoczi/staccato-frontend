# Research: Authentication & Token Management

**Branch**: `002-auth-token-management` | **Date**: 2026-03-30

## R-001: Auth API Contract Mismatches

**Context**: The existing `src/api/auth.ts` was scaffolded during project setup but has several discrepancies with the actual backend API documented in `STACCATO_FRONTEND_DOCUMENTATION.md`.

**Findings** (existing → required):

| Endpoint | Issue | Current Code | Backend Contract |
|----------|-------|--------------|------------------|
| POST /auth/login | Missing field | `{ email, password }` | `{ email, password, rememberMe }` |
| POST /auth/register | Wrong fields | `{ email, password, firstName, lastName, language }` | `{ email, displayName, password }` |
| All auth responses | Wrong shape | `{ accessToken, user: User }` | `{ accessToken, expiresIn }` (no user object) |
| DELETE /auth/logout | Wrong method | `apiClient.post('/auth/logout')` | `DELETE /auth/logout` (and should use rawClient) |
| POST /auth/google | Wrong field name | `{ credential }` | `{ idToken }` |
| POST /auth/refresh | Missing field extraction | Only extracts `accessToken` | Also returns `expiresIn` |

**Decision**: Update all auth API functions to match the backend contract exactly. Use `rawClient` for logout (avoids interceptor complications when ending session). Update `silentRefresh` to extract and store `expiresIn`.

**Alternatives considered**: None — contract alignment is mandatory.

---

## R-002: Google OAuth Button Strategy

**Context**: The spec requires the Google sign-in button to "follow Google's branding guidelines but harmonize with the earthy theme." The `@react-oauth/google` package (already installed) provides two approaches: `GoogleLogin` component (renders Google's official button via `google.accounts.id` API) and `useGoogleLogin` hook (returns a callback for a custom button via `google.accounts.oauth2` API).

**Findings**:
- `GoogleLogin` component: Uses `google.accounts.id` (Sign In With Google API). Returns a `CredentialResponse` with `credential` field containing a JWT ID token. Limited customization (theme: outline/filled_blue/filled_black, size, shape). Renders inside an iframe.
- `useGoogleLogin` hook: Uses `google.accounts.oauth2` (OAuth2 authorization API). Returns `TokenResponse` with `access_token` (implicit flow) or `CodeResponse` with `code` (auth-code flow). **Neither flow returns a JWT ID token.** These are two entirely separate Google APIs within the same SDK.
- The backend `POST /auth/google` endpoint expects `{ idToken: "..." }` — a JWT ID token, not an OAuth2 access token or authorization code.
- `useGoogleLogin` cannot be used without changing the backend contract to accept an authorization code instead of an ID token.
- The `outline` theme for `GoogleLogin` is visually neutral (white background, thin border) and sits acceptably within the earthy design when wrapped in a styled container.

**Decision**: Use the `GoogleLogin` component from `@react-oauth/google` with `theme: 'outline'`, `size: 'large'`, `shape: 'rectangular'`, and full container width. This is the only path in the library that returns a JWT `credential` (ID token) — required by the backend's `POST /auth/google` endpoint. The button uses Google's standard rendering with an `outline` theme that is visually neutral within the earthy design. A styled container div provides earthy-themed spacing and context (separator line, "or" text). The `text` prop controls button label: `'signin_with'` for login pages, `'signup_with'` for register pages.

**Alternatives considered**:
- `useGoogleLogin` hook + custom button: Rejected — uses `google.accounts.oauth2` API which returns `access_token` or `code`, not the JWT ID token the backend expects. Would require backend endpoint change from `{ idToken }` to `{ code }` with server-side token exchange.
- `useGoogleLogin({ flow: 'auth-code' })` + backend code exchange: Rejected — requires backend contract change. Out of scope for this feature.
- Raw `google.accounts.id.initialize` + `prompt()`: Rejected — shows One Tap UI (top-of-page popup), not a button click. Wrong UX for a dedicated sign-in page.
- Raw Google Identity Services GIS library: Rejected — @react-oauth/google already wraps it with React lifecycle management and is in the approved tech stack.

---

## R-003: Proactive Token Refresh Strategy

**Context**: The backend returns `expiresIn: 900` (15 minutes). Without proactive refresh, tokens expire silently and the next API call triggers a 401 → reactive refresh → retry cycle, which adds latency.

**Findings**:
- The reactive 401 interceptor in `client.ts` already handles expired tokens correctly with a promise queue for concurrent requests.
- Adding a proactive timer at 80% of token lifetime (720s = 12 minutes) means the token is refreshed before expiry during active use.
- The timer should be implemented as a React hook (`useProactiveRefresh`) used in the app's root layout, not in the store itself, because `setTimeout` requires cleanup tied to component lifecycle.
- The auth store needs to track `expiresAt` (absolute timestamp) so the hook can compute the timer delay.

**Decision**: Add `expiresAt: number | null` to the auth store. Create `useProactiveRefresh` hook that schedules `silentRefresh()` at 80% of token lifetime. The hook reruns whenever `expiresAt` changes (which happens after each refresh). The reactive 401 interceptor remains as a safety net for edge cases (e.g., clock drift, tab suspension).

**Implementation detail**:
```
setAuth(token, expiresIn) → expiresAt = Date.now() + expiresIn * 1000
Timer delay = (expiresAt - Date.now()) * 0.8
On timer fire → silentRefresh() → updates expiresAt → hook reschedules
```

**Alternatives considered**:
- Store-level `setInterval`: Rejected — no cleanup mechanism, runs outside React lifecycle.
- Refresh on every API call: Rejected — wasteful, adds latency to every request.

---

## R-004: Rate Limit (429) Handling

**Context**: All `/auth/*` endpoints are rate-limited to 10 req/min/IP. The backend returns HTTP 429 with a `Retry-After` header (value in seconds).

**Findings**:
- The current Axios response interceptor only handles 401. No 429 handling exists.
- Rate limiting is specific to auth endpoints but could theoretically apply to any endpoint. However, the spec only requires handling it on auth pages.
- Two approaches: (a) Add global 429 interceptor to `client.ts`, (b) Handle 429 in the form components only.
- Global interceptor is cleaner and follows constitution principle III (centralized HTTP handling). But the UX response (countdown timer) is feature-specific.

**Decision**: Create a custom `useRateLimitError` hook in `src/features/auth/hooks/` that tracks rate limit state (isLimited, retryAfterSeconds, countdown). Auth forms catch 429 errors from API calls and feed them to this hook. The hook manages a countdown timer and provides display state. No global interceptor change needed — the 429 error propagates naturally through the promise rejection chain, and the form component handles it.

**Rationale**: This keeps the rate limit UX logic colocated with the auth feature (per constitution principle I) while the Axios layer stays focused on transport concerns. If rate limiting needs global handling later, it can be promoted.

**Alternatives considered**:
- Global Axios 429 interceptor with toast: Rejected — auth pages need inline countdown, not toast. Other endpoints may need different UX.
- Disabling submit button for fixed duration: Rejected — `Retry-After` header provides exact timing; use it.

---

## R-005: Auth Page Layout Strategy

**Context**: The spec describes "split layout: left side = branding/illustration, right side = form" or "centered card on warm textured background."

**Findings**:
- Split layout on large screens gives a premium, distinctive feel. The left panel can show the app name ("Staccato"), a tagline, and a musical motif (using Lucide music icons like `Music`, `Music2`, `Music3`, `Music4`).
- On mobile/small screens, the split layout collapses to a centered card (no branding panel).
- The branding panel is static content — no interactivity, purely atmospheric.
- Both login and register pages share the same layout structure, differing only in the form content.

**Decision**: Create `AuthLayout` component as a shared wrapper. Desktop (≥1024px): two-column split (left 40% branding, right 60% form in card). Mobile (<1024px): single column with form card centered, minimal branding above. The branding panel uses the earthy palette with decorative Lucide music icons as visual accents (not functional indicators). Both `LoginPage` and `RegisterPage` compose `AuthLayout` with their respective form components.

**Alternatives considered**:
- Full-screen centered card only: Rejected — misses the opportunity for a distinctive first impression on desktop.
- Animated background illustrations: Rejected — adds complexity without clear value; Lucide icon accents are sufficient and constitution-compliant.

---

## R-006: WCAG 2.1 AA Implementation for Auth Forms

**Context**: The spec requires WCAG 2.1 AA compliance for all auth pages.

**Findings**:
- shadcn/ui components (built on Radix) provide good baseline accessibility (proper ARIA attributes, keyboard navigation).
- Key additions needed:
  1. `aria-describedby` linking form fields to their error messages
  2. `aria-invalid="true"` on fields with errors
  3. `aria-live="polite"` region for dynamic error announcements
  4. Proper `<label>` associations (shadcn/ui Label component handles this)
  5. Visible focus indicators (Tailwind's `focus-visible:` already styled via design tokens)
  6. Focus management: move focus to first error field on validation failure
  7. Skip to main content link (optional for auth pages but good practice)
  8. Color contrast: earthy palette must maintain 4.5:1 ratio for text
- The existing `index.css` design tokens use OKLch colors. Need to verify contrast ratios for:
  - Primary text on cream background
  - Error text (warm red) on cream background
  - Button text on warm brown button background
  - Placeholder text contrast

**Decision**: Implement accessibility through a combination of shadcn/ui's built-in ARIA support, explicit `aria-describedby`/`aria-invalid` on form fields, an `aria-live` region for error summary, and focus management via React Hook Form's `setFocus`. Verify all earthy palette color combinations meet 4.5:1 contrast ratio during implementation; adjust lightness/darkness values if needed.

**Alternatives considered**: None — WCAG 2.1 AA is a hard requirement from the spec.

---

## R-007: Logout Implementation

**Context**: The existing `src/api/auth.ts` uses `apiClient.post('/auth/logout')` but the backend expects `DELETE /auth/logout`.

**Findings**:
- The logout endpoint reads the refresh token from the HttpOnly cookie, revokes it, and clears the cookie. Returns 204.
- Using `apiClient` (with interceptors) means if the access token is expired, the 401 interceptor fires and tries to refresh — counterproductive during logout.
- Using `rawClient` avoids interceptor complications. The endpoint identifies the session via cookie, not Bearer token.
- If the logout call fails (network error, server down), the frontend should still clear local auth state and redirect. The backend refresh token will eventually expire on its own.

**Decision**: Use `rawClient.delete('/auth/logout')` instead of `apiClient.post('/auth/logout')`. Frontend always clears auth state and redirects to `/login` regardless of whether the API call succeeds (fire-and-forget pattern with best-effort server notification).

**Alternatives considered**:
- `apiClient.delete`: Rejected — interceptor may interfere during session teardown.
- Keep `POST`: Rejected — backend expects `DELETE`.

---

## R-008: Hard Redirect on Refresh Failure

**Context**: The existing `silentRefresh()` in `client.ts` uses `window.location.href = '/login'` on failure, which triggers a full page reload instead of SPA navigation.

**Findings**:
- The hard redirect is actually desirable for the refresh failure case: it clears all JavaScript state (Zustand stores, TanStack Query cache, timers), ensuring a completely clean slate.
- SPA navigation via React Router would preserve in-memory state, potentially leaving stale data.
- This only fires when the refresh token is invalid/expired — an infrequent event.
- The ProtectedRoute component handles the initial mount case (no token → attempt refresh → redirect on failure) via React Router navigation. The hard redirect in the interceptor handles the mid-session case (active use → token refresh fails).

**Decision**: Keep `window.location.href = '/login'` in the interceptor's refresh failure path. It's intentionally different from the ProtectedRoute's React Router redirect because it needs to clear all client state.

**Alternatives considered**:
- React Router navigation via callback: Rejected — leaves stale in-memory state.
- Custom event + listener pattern: Rejected — adds complexity for no user-visible benefit.
