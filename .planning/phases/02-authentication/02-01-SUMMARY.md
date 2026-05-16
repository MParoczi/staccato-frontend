---
plan: 02-01
status: completed
completed_at: 2026-05-16
---

# Plan 01 Summary — Auth Infrastructure

## What was built
- Installed @react-oauth/google package (.npmrc created for peer dep compat with React 19)
- Added shadcn card component (src/components/ui/card.tsx — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- Defined bg-auth-dots CSS utility in src/index.css (@layer utilities block with radial-gradient at 0.12 opacity)
- Added i18n validation keys (6) + googleFailed to en/auth.json; matching __HU_TODO__ stubs in hu/auth.json (22 total HU stubs)
- Created src/features/auth/api/authApi.ts with login, register, loginWithGoogle, logout — all using rawClient, AuthResponse not exported
- Created src/features/auth/hooks/useProactiveRefresh.ts with JWT atob decode + Math.max(0, exp*1000-Date.now()-60_000) delay + rawClient refresh + setAuth/clearAuth on result
- Wired GoogleOAuthProvider as outermost provider in main.tsx with env.VITE_GOOGLE_CLIENT_ID
- Mounted useProactiveRefresh() in ProtectedRoute.tsx (unconditionally, before status checks)
- Added logout button to NotebooksPage.tsx (clearAuth in finally block, no window.location usage)

## Verification results
```
pnpm tsc --noEmit — exit 0 (no TypeScript errors)
@react-oauth/google in package.json — match
src/components/ui/card.tsx — exists
bg-auth-dots in src/index.css — match
validation in public/locales/en/auth.json — match
__HU_TODO__ in public/locales/hu/auth.json — 22 matches
export async function in authApi.ts — 4 matches (login, register, loginWithGoogle, logout)
useProactiveRefresh in ProtectedRoute.tsx — 2 matches (import + call)
GoogleOAuthProvider in main.tsx — 3 matches (import + open tag + close tag)
clearAuth in NotebooksPage.tsx — 2 matches (selector + finally call)
```

## Decisions made
- .npmrc with strict-peer-dependencies=false was needed because @react-oauth/google 0.13.5 declares a React 18 peer dependency but the project uses React 19; pnpm strict mode would have blocked the install.
- AuthResponse interface kept unexported as specified — callers in Plans 02–03 will destructure { user, accessToken } directly from the returned value.
- useProactiveRefresh uses `let timeoutId: ReturnType<typeof setTimeout>` (uninitialized) because the assignment only happens inside a try block; the cleanup `() => clearTimeout(timeoutId)` is safe because clearTimeout with undefined is a no-op.
- GoogleOAuthProvider placed as the outermost wrapper (outside StrictMode) so the Google Identity Services script initializes before any React rendering — consistent with @react-oauth/google's recommended placement.
