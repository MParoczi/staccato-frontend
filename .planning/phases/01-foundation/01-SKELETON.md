# Walking Skeleton: Staccato Phase 1 — Foundation

**Phase:** 01-foundation
**Generated:** 2026-05-15
**Mode:** Walking Skeleton (Phase 1, new project)

---

## What the Skeleton Delivers

After Phase 1 completes, the following end-to-end slice works in a browser:

1. User opens `http://localhost:5173` — browser performs `POST /auth/refresh` (silent boot)
2. If the refresh cookie exists: the app navigates to `/app/notebooks` and renders a "Notebooks (shell)" page
3. If no cookie: the app navigates to `/login` and renders a "Login (shell)" page
4. During the refresh in-flight: a full-screen Lucide `Loader2` spinner renders (no flash of login)
5. `pnpm build` compiles with zero TypeScript errors and zero lint errors
6. `pnpm test` passes all unit/smoke tests

---

## Architectural Decisions (Locked for All Subsequent Phases)

These decisions are established in Phase 1 and **must not be renegotiated** in subsequent phases.

| Decision | Value | Rationale |
|----------|-------|-----------|
| Framework | React 19.2.6 + Vite 8.0.13 | SPA; Rolldown-backed build |
| Language | TypeScript 5.9.3 (`erasableSyntaxOnly`, `verbatimModuleSyntax`) | Spec-pinned; no enums, use `as const` unions |
| Styling | Tailwind v4 CSS-first (`@import "tailwindcss"` in `src/index.css`; no `tailwind.config.js`) | CSS variable tokens via `@theme inline` |
| Component library | shadcn `radix-nova` style, `neutral` base, `cssVariables: true` | All components generated into `src/components/ui/` |
| Routing | React Router v7 Data Mode (`createBrowserRouter` + `RouterProvider`); no Framework Mode | Config in `src/router.tsx` |
| Client state | Zustand 5 (`import { create } from 'zustand'`; no persist on authStore) | Access token in memory only |
| Server state | TanStack Query v5 (QueryClient with ERR-04 retry policy) | Never retry 4xx; retry 5xx up to 3× |
| HTTP client | Axios 1.16.1 — single instance at `src/api/client.ts`; `rawClient.ts` for `/auth/refresh` only | Circular loop prevention |
| i18n | i18next 26.2.0 + react-i18next 17.0.8 + i18next-http-backend 4.0.0 | Runtime JSON loading from `public/locales/` |
| Package manager | pnpm 10.33.0 | Enforced; npm/yarn forbidden |
| Icons | lucide-react 0.511.0 | Only permitted icon set |
| Toasts | sonner 2.0.7 (via shadcn Sonner) | Standard for all phases |
| Forms | react-hook-form (via shadcn Form) | All form phases build on this |
| Env validation | Zod at startup in `src/env.ts` | Fails fast with descriptive error |

---

## Directory Layout

```
C:/Users/shift/Desktop/Frontend/
├── public/
│   └── locales/
│       ├── en/           # 8 namespace JSON files (real strings)
│       │   ├── common.json
│       │   ├── auth.json
│       │   ├── notebooks.json
│       │   ├── lessons.json
│       │   ├── canvas.json
│       │   ├── chords.json
│       │   ├── styles.json
│       │   └── profile.json
│       └── hu/           # 8 namespace JSON files (empty/"TODO")
│           └── (same 8 files)
├── src/
│   ├── api/
│   │   ├── client.ts         # Single Axios instance + interceptors
│   │   └── rawClient.ts      # Bare Axios for /auth/refresh only
│   ├── components/
│   │   └── ui/               # shadcn-generated + hand-written shared components
│   │       ├── ProtectedRoute.tsx
│   │       └── (17 shadcn components)
│   ├── features/
│   │   ├── auth/             # Empty shell (Phase 2 builds here)
│   │   └── notebooks/        # Empty shell (Phase 4 builds here)
│   ├── hooks/                # Shared hooks directory
│   ├── lib/
│   │   └── utils.ts          # cn() helper (shadcn-generated)
│   ├── pages/
│   │   ├── RootPage.tsx      # Pure redirect (auth-aware)
│   │   ├── LoginPage.tsx     # Shell only
│   │   ├── RegisterPage.tsx  # Shell only
│   │   └── NotebooksPage.tsx # Shell only
│   ├── stores/
│   │   └── authStore.ts      # Zustand; no persist; status discriminant
│   ├── types/
│   │   └── index.ts          # UserProfile + shared TS types
│   ├── env.ts                # Zod env validation; exports typed env
│   ├── i18n.ts               # i18next init
│   ├── index.css             # Tailwind v4 + shadcn CSS variables
│   ├── main.tsx              # Entry: env gate, i18n, boot refresh, QueryClient, RouterProvider
│   ├── router.tsx            # createBrowserRouter definition
│   └── vite-env.d.ts         # ImportMetaEnv augmentation
├── tests/
│   └── smoke/
│       └── app-boots.test.tsx
├── .env.example              # Documents required env vars
├── components.json           # shadcn config (radix-nova, neutral, cssVariables)
├── package.json
├── tsconfig.json             # Project references root
├── tsconfig.app.json         # App config (erasableSyntaxOnly, verbatimModuleSyntax)
├── tsconfig.node.json        # Vite config type checking
├── vite.config.ts
└── vitest.config.ts
```

---

## Auth Boot Sequence (Core Walking Skeleton Flow)

```
App starts (main.tsx)
    │
    ├── import './i18n'          → i18next init (async, Suspense wraps render)
    ├── validate import.meta.env → Zod; throws on missing VITE_API_BASE_URL
    ├── authStore.status = 'loading'  (initial state — no explicit call needed)
    ├── rawClient.post('/auth/refresh')  → fire-and-forget before ReactDOM.render
    │       ├── success: setAuth(user, token) → status = 'authenticated'
    │       └── failure: clearAuth()          → status = 'unauthenticated'
    │
    └── ReactDOM.render(<RouterProvider>)
            │
            └── ProtectedRoute (observes authStore.status)
                    ├── 'loading'          → <FullScreenSpinner> (Loader2, centered)
                    ├── 'unauthenticated'  → <Navigate to="/login" replace />
                    └── 'authenticated'    → <Outlet /> → NotebooksPage shell
```

---

## API Contracts Used in Phase 1

| Endpoint | Method | Purpose | Response shape |
|----------|--------|---------|---------------|
| `/auth/refresh` | POST | Silent boot restore | `{ accessToken: string; user: UserProfile }` (assumed — verify against backend spec) |

All other API endpoints belong to Phase 2+.

---

## What Subsequent Phases Build On

| Phase | Depends On From Skeleton |
|-------|--------------------------|
| Phase 2 (Auth) | `authStore` (setAuth/clearAuth), `rawClient` (/auth/refresh), `client.ts` interceptors, `/login` + `/register` page shells, `src/features/auth/` directory |
| Phase 3 (Profile) | `client.ts`, `useAuthStore`, `src/features/` pattern |
| Phase 4+ (Notebooks, Lessons…) | Router (add routes inside `/app/`), QueryClient, shadcn components, `src/features/notebooks/` shell |
| Phase 12 (i18n) | Translation JSON structure, namespace list, i18next instance |
| Phase 11 (PDF/SignalR) | SignalR is dynamically imported (not scaffolded here) |

---

## Validation Bar

The Walking Skeleton is complete when all five Phase 1 success criteria pass:

1. `pnpm dev` starts without errors; `pnpm build` exits 0 with zero TypeScript errors and zero lint errors
2. Navigating to `/` redirects unauthenticated users to `/login`; authenticated session redirects to `/app/notebooks`
3. All route paths (`/`, `/login`, `/register`, `/app/notebooks`) render page shells without crashing
4. `useAuthStore` has no `persist` middleware; store resets to `status: 'loading'` on page reload (then resolves via boot refresh)
5. i18n initialises with English as default; `t('common.appName')` resolves without error; `Accept-Language: en` header present on every API request
