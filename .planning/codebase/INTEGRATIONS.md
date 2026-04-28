# External Integrations

**Analysis Date:** 2026-04-28

## Backend REST API

- **Client:** `src/api/client.ts` — single `axios.create()` instance.
  - `baseURL`: `import.meta.env.VITE_API_BASE_URL` (throws on boot if unset, line 9)
  - `withCredentials: true` (refresh-token cookie support)
  - `timeout: 30_000`
  - Default `Content-Type: application/json`
- **Request interceptor (lines 25–32):**
  - Injects `Authorization: Bearer <accessToken>` from `useAuthStore.getState().accessToken`
  - Sets `Accept-Language` from `i18next.language` (fallback `en`)
- **Response interceptor (lines 63–83):**
  - On `401` and not `_retried`: calls `silentRefresh()` (line 38), updates header, replays
  - Single-flight refresh via `isRefreshing` + shared `refreshPromise` (lines 35–61)
  - On refresh failure: `useAuthStore.getState().clearAuth()` and reject (no full-page redirect)
- **Raw (interceptor-free) client:** `src/api/raw-client.ts` — used by `silentRefresh` for `POST /auth/refresh`
- **Resource modules** (`src/api/`): `auth.ts`, `chords.ts`, `exports.ts`, `instruments.ts`, `lessons.ts`, `modules.ts`, `notebooks.ts`, `pages.ts`, `presets.ts`, `users.ts`
- **Tests:** `client.test.ts`, `modules.test.ts`, `notebooks.test.ts`, `presets.test.ts`

## Authentication & Identity

- **Strategy:** in-memory access token (Zustand) + backend-managed httpOnly refresh cookie.
- **Store:** `src/stores/authStore.ts`
  - Fields: `accessToken: string | null`, `expiresAt: number | null`, `isLoggingOut: boolean`
  - Actions: `setAuth(token, expiresIn)`, `clearAuth()`, `startLogout()`
  - **No persistence** — token never written to `localStorage` / `sessionStorage` (XSS-safe).
- **Refresh:** `silentRefresh()` in `src/api/client.ts`
  - `POST /auth/refresh` via `rawClient`; expects `{ accessToken, expiresIn }`
  - Aborts if `isLoggingOut` (avoids reviving session mid-logout)
- **Proactive refresh:** `src/features/auth/hooks/useProactiveRefresh.ts` (timer-based; uses `expiresAt`)
- **Routes:**
  - `LoginPage`, `RegisterPage` (`src/features/auth/`)
  - `ProtectedRoute` (`src/routes/protected-route.tsx`) — guards `/app/*`
  - `RootRedirect`, `PublicLayout`, `AppLayout`, `NotebookLayout`

## Google OAuth

- **SDK:** `@react-oauth/google`
- **Provider mount:** `src/App.tsx` lines 16–22 — `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>` (gated; if env unset, falls through without provider)
- **Configuration surface:**
  - `VITE_GOOGLE_CLIENT_ID` (Web Client ID)
  - Authorized origins / redirect URIs in Google Cloud Console must match dev/prod hosts.

## Internationalization (i18next)

- **Init:** `src/i18n/index.ts`
  - Plugins: `LanguageDetector` + `initReactI18next`
  - `fallbackLng: 'en'`, `supportedLngs: ['en', 'hu']`
  - `keySeparator: '.'`, `interpolation.escapeValue: false`
- **Resource bundles:** `src/i18n/en.json`, `src/i18n/hu.json` (translation namespace)
- **Side-effect import:** `src/main.tsx` line 5 imports `@/i18n` before mount.
- **Used by:** `apiClient` request interceptor (`Accept-Language`), `useLanguageSwitch` hook in `src/features/profile/hooks/`.

## Realtime (SignalR)

- **SDK installed:** `@microsoft/signalr@^10.0.0`
- **Status:** dependency only — **no hub wrapper found in `src/lib/` or `src/api/`** at this time. Realtime layer is a future scaffolding task.

## Toasts

- **SDK:** `sonner` via shadcn wrapper at `src/components/ui/sonner.tsx`
- **Mount:** `src/App.tsx` `<Toaster />` (sibling of `<RouterProvider>`)

## Theme

- **SDK:** `next-themes@^0.4.6` (declared; provider not yet wired in `src/App.tsx` — pending if dark mode required)

## Drag & Drop

- **SDK:** `@dnd-kit/core` — consumed by canvas/grid features (specs 007/008 module placement). Lookup via grep when implementing spec 008.

## Configuration Surface (`import.meta.env.VITE_*`)

Confirmed consumers in code:

| Env var                  | Consumer                          | Required? |
|--------------------------|-----------------------------------|-----------|
| `VITE_API_BASE_URL`      | `src/api/client.ts` (line 7)      | **Yes** — throws on boot if unset |
| `VITE_GOOGLE_CLIENT_ID`  | `src/App.tsx` (line 6)            | Optional — Google provider gated when missing |

`raw-client.ts` likely reuses `VITE_API_BASE_URL` (same backend). Document any new `VITE_*` keys in `README.md`.

## Browser APIs

- `localStorage` — used by `i18next-browser-languagedetector` for selected locale (only); **not** used for tokens.
- `WebSocket` — reserved for SignalR transport once realtime is wired.
- `window.history` / `location` — managed by React Router; do not mutate manually.

## Integration Rules

- **All HTTP** through `src/api/client.ts` (or `raw-client.ts` for auth-exempt). Never `axios.create` ad hoc in features.
- **All server reads** via TanStack Query hooks, not directly from API modules in components.
- **All tokens** stay in `useAuthStore` (memory only).
- **All user-facing strings** through `t(...)`.
- **All env access** via `import.meta.env.VITE_*` (typed extension under `vite/client` types).

