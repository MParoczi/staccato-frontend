# Quickstart: Authentication & Token Management

**Branch**: `002-auth-token-management` | **Date**: 2026-03-30

## Prerequisites

- Node.js LTS (22+)
- pnpm (package manager)
- Backend API running at `VITE_API_BASE_URL` with auth endpoints operational
- Google OAuth Client ID configured in Google Cloud Console

## Environment Setup

1. Ensure `.env` has the required variables:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

2. Install dependencies (if not already):

```bash
pnpm install
```

3. Start the dev server:

```bash
pnpm dev
```

## Google OAuth Local Development

To test Google OAuth locally:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create or select an OAuth 2.0 Client ID (Web application type)
3. Add `http://localhost:5173` to "Authorized JavaScript origins"
4. Copy the Client ID to `VITE_GOOGLE_CLIENT_ID` in `.env`
5. The Google popup flow will work on localhost

Note: Google OAuth requires HTTPS in production. Vite dev server uses HTTP, which is allowed for `localhost` origins only.

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Axios instance with auth interceptor (401 refresh queue) |
| `src/api/raw-client.ts` | Plain Axios for auth endpoints that bypass interceptors |
| `src/api/auth.ts` | Auth API functions (login, register, google, refresh, logout) |
| `src/stores/authStore.ts` | Zustand store for access token + expiry |
| `src/routes/protected-route.tsx` | Route guard with silent refresh on mount |
| `src/routes/public-layout.tsx` | Redirects authenticated users away from auth pages |
| `src/features/auth/` | All auth feature components, hooks, and schemas |
| `src/i18n/en.json` | English translations (auth.* namespace) |
| `src/i18n/hu.json` | Hungarian translations (auth.* namespace) |

## Testing

```bash
pnpm test                    # Run all tests
pnpm test src/features/auth  # Run auth feature tests only
```

Test priorities for this feature:
1. Zod schema validation (unit) — valid and invalid inputs
2. Auth store state transitions (unit) — setAuth, clearAuth
3. Interceptor retry logic (unit with MSW) — 401 refresh queue
4. Auth page forms (integration with RTL) — submit flows, error display

## Auth Flow Summary

```
Page Load → ProtectedRoute checks token
  ├── Token exists → render app
  └── No token → silentRefresh()
        ├── Success → store token, render app
        └── Failure → redirect to /login

Login/Register → API call → store token → redirect to /app/notebooks

Active Use → API call fails with 401
  └── Interceptor → silentRefresh() → retry original request
        └── Refresh fails → hard redirect to /login

Proactive Refresh → Timer at 80% token lifetime
  └── silentRefresh() → store new token → reschedule timer
```
