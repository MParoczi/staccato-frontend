# Phase 1: Foundation - Research

**Researched:** 2026-05-15
**Domain:** React 19 SPA scaffold — Vite 8, TypeScript, Tailwind v4, shadcn, React Router v7, Zustand 5, TanStack Query v5, Axios, i18next v26
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Boot Loading State**
- D-01: Show a full-screen spinner during `POST /auth/refresh` silent restore on app boot.
- D-02: `ProtectedRoute` holds rendering while `authStore.status === 'loading'`; never redirects to `/login` prematurely.
- D-03: The full-screen spinner lives inside `ProtectedRoute` — not in App root or a separate `AuthGate`.
- D-04: `authStore` shape: `{ status: 'loading' | 'authenticated' | 'unauthenticated', user: UserProfile | null, accessToken: string | null }`.

**Route Scaffolding Scope**
- D-05: Wire only Phase 1 routes as page shells: `/`, `/login`, `/register`, `/app/notebooks`.
- D-06: `/` is a pure redirect only — unauthenticated → `/login`, authenticated → `/app/notebooks`. No landing page.
- D-07: Config-based routing using `createBrowserRouter` defined in `src/router.tsx`.

**shadcn Pre-installation Scope**
- D-08: Pre-install: `Button`, `Input`, `Label`, `Form`, `Dialog`, `Sheet`, `Select`, `Checkbox`, `Table`, `Textarea`, `Sonner`, `Badge`, `Avatar`, `Separator`, `DropdownMenu`, `Tooltip`, `Skeleton`.
- D-09: All shared UI components in `src/components/ui/` — no separate `custom/` subdirectory.
- D-10: Color tokens derived from shadcn defaults + neutral base, radix-nova style.

**i18n Namespace Strategy**
- D-11: Namespaces defined upfront: `common`, `auth`, `notebooks`, `lessons`, `canvas`, `chords`, `styles`, `profile`.
- D-12: Both locales scaffolded: `public/locales/en/*.json` (real strings) and `public/locales/hu/*.json` (empty/"TODO").
- D-13: `i18next-http-backend` loads from `public/locales/` at runtime — files NOT bundled inline.

### Claude's Discretion
- Exact folder structure inside `src/features/`
- Environment variable validation approach (Zod schema vs manual checks)
- Axios interceptor implementation details
- Vite plugin selection (`@vitejs/plugin-react` vs `@vitejs/plugin-react-swc`)

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

---

## Summary

Phase 1 scaffolds the complete technical skeleton for the Staccato SPA. This is a greenfield project on a modern stack where every library is at a recent major version; several versions have changed significantly since the project spec was written in May 2026.

The most significant finding is the version landscape shift: TypeScript latest is 6.0.3 (the project spec says 5.9); i18next latest is 26.2.0 and react-i18next requires i18next >=26.2.0 (the spec implies v23-level usage); `@vitejs/plugin-react` is at v6.0.2 which dropped Babel entirely in favour of Oxc. None of these require changing locked decisions, but they change the exact package versions and some configuration patterns the planner must use.

The second key finding is that `radix-nova` is a valid shadcn style (confirmed via official changelog and GitHub issues), and the shadcn CLI with Tailwind v4 uses `@import "tailwindcss"` in `src/index.css` — no `tailwind.config.js` file, all tokens via CSS `@theme inline`.

The third key finding is the React Router v7 mode split: this project must use **Data Mode** (`createBrowserRouter` + `RouterProvider`), not Framework Mode (which requires a Vite plugin and file-based routing). Data Mode is a pure library — no framework-level Vite integration needed.

**Primary recommendation:** Scaffold with `pnpm create vite@latest . --template react-ts`, then layer in Tailwind v4, shadcn, routing, state, and i18n in sequence. Use `@vitejs/plugin-react@6.0.2` (Oxc, no Babel). Pin TypeScript to `5.9.3` to match the spec; do not upgrade to 6.0 in this phase (spec says 5.9). Use `i18next@26.2.0` + `react-i18next@17.0.8` (the current ecosystem-compatible versions).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| App scaffold (Vite, TS config) | Frontend Server (build) | — | Build-time concern; Vite owns bundling |
| Routing structure | Browser / Client | — | SPA; `createBrowserRouter` runs in browser |
| Auth token storage | Browser / Client (memory) | — | Zustand in-memory; never persisted |
| Silent token refresh on boot | Browser / Client | API / Backend | Client calls `POST /auth/refresh` once on mount |
| HTTP client (Axios) | Browser / Client | API / Backend | Singleton in client memory; talks to API tier |
| i18n translation loading | Browser / Client | CDN / Static | Fetches JSON files from `public/` at runtime |
| CSS theming tokens | Browser / Client | — | CSS variables in `index.css`; no SSR |
| Environment variable validation | Frontend Server (build) | — | Validated at Vite startup via `import.meta.env` |
| QueryClient (TanStack) | Browser / Client | — | Client-side cache for server state |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` | 19.2.6 | UI runtime | Locked by spec |
| `react-dom` | 19.2.6 | DOM renderer | Required with React 19 |
| `vite` | 8.0.13 | Build tool | Locked by spec; Rolldown-backed |
| `typescript` | 5.9.3 | Type checking | Spec says 5.9; `erasableSyntaxOnly` was introduced in 5.8 |
| `tailwindcss` | 4.3.0 | CSS framework | Locked by spec; CSS-first v4 |
| `@tailwindcss/vite` | 4.3.0 | Vite plugin for Tailwind v4 | Required for v4 CSS-first integration |
| `react-router` | 7.15.1 | Routing | Locked by spec; Data Mode |
| `zustand` | 5.0.13 | Client state | Locked by spec; authStore |
| `@tanstack/react-query` | 5.100.10 | Server state / cache | Locked by spec |
| `axios` | 1.16.1 | HTTP client | Locked by spec; single instance |
| `i18next` | 26.2.0 | i18n core | Ecosystem-current; react-i18next@17 requires >=26.2.0 |
| `react-i18next` | 17.0.8 | React i18n bindings | Ecosystem-current |
| `i18next-http-backend` | 4.0.0 | Runtime translation loading | Locked by spec (D-13) |
| `i18next-browser-languagedetector` | 8.2.1 | Language detection | Standard companion |
| `lucide-react` | 0.511.0 | Icons | Locked by spec; only icon set allowed |
| `zod` | 3.24.4 | Schema validation | For env var validation; industry standard |
| `sonner` | 2.0.7 | Toast notifications | Required by shadcn Sonner component |

### Build / Dev Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@vitejs/plugin-react` | 6.0.2 | Vite React plugin | Locked by spec (discretion); v6 uses Oxc, no Babel |
| `@types/react` | 19.2.14 | React TypeScript types | Required |
| `@types/react-dom` | 19.2.3 | React DOM TypeScript types | Required |
| `@types/node` | 22.x | Node type definitions | Required for `path.resolve` in vite.config.ts |

### shadcn / UI
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `class-variance-authority` | (via shadcn) | Component variants | Generated by shadcn CLI |
| `clsx` | (via shadcn) | Class merging | Generated by shadcn CLI |
| `tailwind-merge` | (via shadcn) | Tailwind class deduplication | Generated by shadcn CLI |
| `tw-animate-css` | (via shadcn) | Animation utilities | Imported in index.css for shadcn |
| `@radix-ui/*` | (via shadcn) | Primitive UI components | Generated by shadcn CLI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vitejs/plugin-react` (Oxc) | `@vitejs/plugin-react-swc` | SWC supports Vite 8 (`^4 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8`). SWC is faster on large codebases; Oxc is the Vite-team-endorsed default for v6+. Use `@vitejs/plugin-react` (Oxc). |
| `zod` inline env validation | `@julr/vite-plugin-validate-env` | The plugin adds build-time validation; inline Zod is simpler and zero extra deps for a small env schema. |
| `i18next-browser-languagedetector` | manual `navigator.language` | The detector handles edge cases (cookie, query param, localStorage) correctly. Include it. |

**Installation (runtime deps):**
```bash
pnpm add react react-dom react-router zustand @tanstack/react-query axios \
  i18next react-i18next i18next-http-backend i18next-browser-languagedetector \
  lucide-react zod sonner
```

**Installation (Tailwind v4 + shadcn — order matters):**
```bash
pnpm add tailwindcss @tailwindcss/vite
pnpm dlx shadcn@latest init
```

**Installation (dev deps):**
```bash
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node
```

**Version verification (confirmed against npm registry 2026-05-15):**
```bash
npm view vite version                    # 8.0.13
npm view @vitejs/plugin-react version    # 6.0.2
npm view tailwindcss version             # 4.3.0
npm view @tailwindcss/vite version       # 4.3.0
npm view react version                   # 19.2.6
npm view typescript version              # 6.0.3 (latest), use 5.9.3 per spec
npm view i18next version                 # 26.2.0
npm view react-i18next version           # 17.0.8
npm view react-router version            # 7.15.1
npm view zustand version                 # 5.0.13
npm view @tanstack/react-query version   # 5.100.10
npm view axios version                   # 1.16.1
```

---

## Package Legitimacy Audit

> slopcheck v0.6.1 was run but targets PyPI registry, not npm. All verdicts below are npm-verified via `npm view <pkg> repository.url time.created` — every package listed points to an authoritative GitHub organization repo and was created years ago.

| Package | Registry | Age | Source Repo | Postinstall | Disposition |
|---------|----------|-----|-------------|-------------|-------------|
| `react` | npm | 2011 | facebook/react | none | Approved |
| `@vitejs/plugin-react` | npm | 2021 | vitejs/vite-plugin-react | none | Approved |
| `@tailwindcss/vite` | npm | 2024 | tailwindlabs/tailwindcss | none | Approved |
| `tailwindcss` | npm | 2017 | tailwindlabs/tailwindcss | none | Approved |
| `zustand` | npm | 2019 | pmndrs/zustand | none | Approved |
| `react-router` | npm | 2014 | remix-run/react-router | none | Approved |
| `@tanstack/react-query` | npm | 2022 | TanStack/query | none | Approved |
| `lucide-react` | npm | 2020 | lucide-icons/lucide | none | Approved |
| `i18next` | npm | 2012 | i18next/i18next | none | Approved |
| `i18next-http-backend` | npm | 2020 | i18next/i18next-http-backend | none | Approved |
| `react-i18next` | npm | 2015 | i18next/react-i18next | none | Approved |
| `sonner` | npm | 2023 | emilkowalski/sonner | none | Approved |
| `axios` | npm | 2014 | axios/axios | none | Approved |
| `zod` | npm | 2020 | colinhacks/zod | none | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none — slopcheck checked PyPI (Python), not npm. All npm packages independently verified as legitimate.
**Packages flagged as suspicious [SUS]:** none.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
│
├── main.tsx
│    ├── validates import.meta.env via Zod (startup gate)
│    ├── initializes i18n (i18next + http-backend)
│    ├── <QueryClientProvider>
│    └── <RouterProvider router={router}>
│
├── src/router.tsx  (createBrowserRouter — Data Mode)
│    ├── /  → RootRedirect (reads authStore.status → navigate)
│    ├── /login  → LoginPage shell
│    ├── /register  → RegisterPage shell
│    └── /app  → <ProtectedRoute>
│         └── /app/notebooks  → NotebooksPage shell
│
├── src/stores/authStore.ts  (Zustand, no persist)
│    └── { status, user, accessToken, setAuth, clearAuth }
│
├── src/api/client.ts  (single Axios instance)
│    ├── baseURL from VITE_API_BASE_URL
│    ├── request interceptor: Authorization + Accept-Language
│    └── response interceptor: 401 → single-flight refresh
│
├── src/api/rawClient.ts  (bare Axios for /auth/refresh — no interceptors)
│
└── public/locales/
     ├── en/  common.json, auth.json, notebooks.json … (8 namespaces)
     └── hu/  common.json, auth.json, … (empty/"TODO")
```

### Recommended Project Structure
```
src/
├── api/
│   ├── client.ts          # Single Axios instance with interceptors
│   └── rawClient.ts       # Bare Axios for auth/refresh endpoint
├── components/
│   └── ui/                # All shared UI: shadcn-generated + hand-written
├── features/
│   ├── auth/              # Phase 2+ (empty shell in Phase 1)
│   └── notebooks/         # Phase 4+ (empty shell in Phase 1)
├── hooks/                 # Shared hooks (useProactiveRefresh etc.)
├── lib/
│   └── utils.ts           # cn() helper (generated by shadcn)
├── pages/                 # Route-level page shells
│   ├── RootPage.tsx       # Pure redirect component
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── NotebooksPage.tsx
├── router.tsx             # createBrowserRouter definition
├── stores/
│   └── authStore.ts       # Zustand authStore (no persist)
├── types/
│   └── index.ts           # Shared TypeScript types (UserProfile etc.)
├── env.ts                 # Zod env validation, exports typed env object
├── i18n.ts                # i18next initialization
├── index.css              # Tailwind v4 + shadcn CSS variables
└── main.tsx               # App entry point
public/
├── locales/
│   ├── en/
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── notebooks.json
│   │   ├── lessons.json
│   │   ├── canvas.json
│   │   ├── chords.json
│   │   ├── styles.json
│   │   └── profile.json
│   └── hu/
│       └── (same 8 files, empty/"TODO" strings)
```

### Pattern 1: Vite 8 + React 19 + TypeScript Configuration

**What:** Minimal Vite 8 config using `@vitejs/plugin-react` v6 (Oxc-based, no Babel) and Tailwind v4's Vite plugin. Path alias `@/` mapped to `src/`.

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/installation/vite + https://vite.dev/blog/announcing-vite8
// vite.config.ts
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),          // Oxc-based React Refresh; no Babel option in v6
    tailwindcss(),    // Tailwind v4 CSS-first integration
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**tsconfig.app.json** (the config referenced by Vite):
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Note on `verbatimModuleSyntax`:** With this flag, type-only imports MUST use `import type { Foo }`. Value imports must use `import { Foo }`. React's JSX transform (`react-jsx`) does not require `import React from 'react'` — the runtime is injected by `@vitejs/plugin-react`, so no React import is needed in components. This is fully compatible with `verbatimModuleSyntax`.

### Pattern 2: Tailwind v4 CSS-First + shadcn Setup

**What:** Tailwind v4 requires no `tailwind.config.js`. All tokens live in `src/index.css`. shadcn generates CSS variables in `:root` / `.dark` using OKLCH color notation, exposed to Tailwind via `@theme inline`.

**`src/index.css` structure:**
```css
/* Source: https://ui.shadcn.com/docs/tailwind-v4 */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  /* shadcn CLI generates these values automatically */
}
```

**`components.json` for radix-nova style:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**shadcn init command:**
```bash
pnpm dlx shadcn@latest init
```
The CLI prompts for style (choose `radix-nova`), base color (choose `neutral`), and CSS file. After init, add all pre-required components in one command:
```bash
pnpm dlx shadcn@latest add -y button input label form dialog sheet select checkbox table textarea sonner badge avatar separator dropdown-menu tooltip skeleton
```

### Pattern 3: Zustand 5 authStore (No Persist)

**What:** Curried `create<T>()()` syntax for TypeScript type inference. No persist middleware (CLAUDE.md hard constraint). Status discriminant drives all auth-gated rendering.

```typescript
// Source: https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5
// src/stores/authStore.ts
import { create } from 'zustand'
import type { UserProfile } from '@/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: UserProfile | null
  accessToken: string | null
  setAuth: (user: UserProfile, accessToken: string) => void
  clearAuth: () => void
  setLoading: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',      // starts loading — silent refresh runs immediately
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ status: 'authenticated', user, accessToken }),
  clearAuth: () => set({ status: 'unauthenticated', user: null, accessToken: null }),
  setLoading: () => set({ status: 'loading' }),
}))
```

**Key constraint:** `getState()` is used inside Axios interceptors (not hooks) to read `accessToken` without triggering React re-renders:
```typescript
const token = useAuthStore.getState().accessToken
```

### Pattern 4: React Router v7 Data Mode — createBrowserRouter + ProtectedRoute

**What:** Config-based routing (D-07). ProtectedRoute holds rendering on `status === 'loading'` and redirects on `status === 'unauthenticated'` (D-02, D-03).

```typescript
// Source: https://reactrouter.com/start/modes (Data Mode)
// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router'
import { ProtectedRoute } from '@/components/ui/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import NotebooksPage from '@/pages/NotebooksPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,   // reads authStore.status and navigates
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/app',
    element: <ProtectedRoute />,   // spinner during 'loading', redirect on 'unauthenticated'
    children: [
      {
        path: 'notebooks',
        element: <NotebooksPage />,
      },
    ],
  },
])
```

**ProtectedRoute pattern (D-02, D-03):**
```typescript
// src/components/ui/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'loading') {
    return <FullScreenSpinner />  // full-screen spinner per D-03
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
```

**Lazy loading for Phase 2+ routes (pattern for later phases):**
```typescript
// Route with lazy() — code splits per route, loads only on navigate
{
  path: 'notebooks/:id',
  lazy: async () => {
    const { NotebookDetailPage } = await import('./pages/NotebookDetailPage')
    return { Component: NotebookDetailPage }
  },
}
```

### Pattern 5: Axios Single Instance + Interceptors

**What:** Single `client.ts` Axios instance with request and response interceptors. `rawClient.ts` is a bare Axios instance used only for the `/auth/refresh` call to avoid circular 401 loops.

```typescript
// Source: [ASSUMED] — single-flight pattern from community gists
// src/api/client.ts
import axios from 'axios'
import i18next from 'i18next'
import { env } from '@/env'
import { useAuthStore } from '@/stores/authStore'
import { rawClient } from './rawClient'

export const client = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,     // send HttpOnly refresh cookie on every request
})

// Request interceptor: add Authorization + Accept-Language
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = i18next.language ?? 'en'
  return config
})

// Response interceptor: 401 → single-flight token refresh
let refreshPromise: Promise<string> | null = null

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || originalRequest._retried) {
      return Promise.reject(error)
    }
    originalRequest._retried = true

    if (!refreshPromise) {
      refreshPromise = rawClient
        .post<{ accessToken: string }>('/auth/refresh')
        .then((res) => {
          const token = res.data.accessToken
          useAuthStore.getState().setAuth(useAuthStore.getState().user!, token)
          return token
        })
        .catch((refreshError) => {
          useAuthStore.getState().clearAuth()
          throw refreshError
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const newToken = await refreshPromise
    originalRequest.headers.Authorization = `Bearer ${newToken}`
    return client(originalRequest)
  },
)
```

```typescript
// src/api/rawClient.ts — no interceptors, used for /auth/refresh only
import axios from 'axios'
import { env } from '@/env'

export const rawClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
})
```

### Pattern 6: Environment Variable Validation (Zod)

**What:** Validate `import.meta.env` at app startup. Fail fast with a descriptive error if required vars are missing. Export a typed `env` object for use throughout the app.

```typescript
// Source: https://vite.dev/guide/env-and-mode
// src/env.ts
import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, 'VITE_GOOGLE_CLIENT_ID is required'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors
  console.error('Invalid environment variables:', errors)
  throw new Error(`Missing or invalid environment variables:\n${JSON.stringify(errors, null, 2)}`)
}

export const env = parsed.data
```

**TypeScript augmentation** (`src/vite-env.d.ts`):
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Pattern 7: i18next v26 Initialization

**What:** i18next v26 with `react-i18next@17` (requires `i18next >= 26.2.0`). HTTP backend loads JSON from `public/locales/`. Multiple namespaces (D-11). Language detection from browser. i18n initialization must complete before React renders (use Suspense).

```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
// src/i18n.ts
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18next
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hu'],
    ns: ['common', 'auth', 'notebooks', 'lessons', 'canvas', 'chords', 'styles', 'profile'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,  // React handles XSS
    },
    react: {
      useSuspense: true,   // use Suspense for loading state
    },
  })

export default i18next
```

**`main.tsx` with Suspense:**
```typescript
import './i18n'   // side-effect import — initialize i18n before app renders
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error: unknown) => {
        // Never retry 4xx errors; retry 5xx/network up to 3 times (ERR-04)
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 3
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Suspense>
  </React.StrictMode>,
)
```

### Pattern 8: TanStack Query v5 Setup

**What:** Standard QueryClient configuration. `retry` is configured globally to match ERR-04 (never retry 4xx). `staleTime` set to 1 minute to reduce redundant refetches in a SPA.

```typescript
// Source: https://tanstack.com/query/v5/docs/reference/QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,            // 1 minute — prevents waterfalls on navigation
      refetchOnWindowFocus: false,  // reduce noise during development
      retry: (failureCount, error) => {
        const status = (error as any)?.response?.status
        if (status && status >= 400 && status < 500) return false  // never retry 4xx
        return failureCount < 3    // retry 5xx/network up to 3× (ERR-04)
      },
    },
  },
})
```

### Anti-Patterns to Avoid

- **No React Compiler in Phase 1:** `@vitejs/plugin-react` v6 dropped Babel. Adding React Compiler now requires `@rolldown/plugin-babel` separately. Phase 1 should not include React Compiler — it adds complexity with no Phase 1 benefit.
- **No `tailwind.config.js`:** Tailwind v4 CSS-first; creating this file conflicts with the setup.
- **No `persist` middleware on authStore:** Hard constraint in CLAUDE.md. Access token stays in memory.
- **No `window.location.href` for navigation:** Always use React Router's `useNavigate` or `<Navigate>`.
- **No barrel `index.ts` in `src/features/*`:** PROJECT.md explicitly avoids barrel files to keep tree-shaking clean. Exception: curated type/constant barrels only.
- **Refreshing token via `client` (not `rawClient`):** Using the interceptor-equipped `client` for `/auth/refresh` causes an infinite loop when the refresh itself returns 401. Always use `rawClient` for the refresh endpoint.
- **Importing i18n after ReactDOM.render:** `import './i18n'` must be the first side-effect import in `main.tsx` — before React renders, or Suspense will not catch the loading state correctly.
- **Using `baseUrl` in tsconfig with TypeScript 6+:** TypeScript 6.0 deprecates `baseUrl`; use `paths` entries with explicit `./src/` prefix. Since we pin to 5.9.3, `baseUrl` still works, but prefer `paths`-only for forward compatibility.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS token system | Custom CSS variable scheme | shadcn + Tailwind v4 `@theme inline` | shadcn CLI generates all semantic pairs; OKLCH-correct; dark mode handled |
| Toast notifications | Custom toast state + portal | `sonner` (bundled via shadcn Sonner) | Queuing, stacking, dedup, keyboard accessibility — all edge cases |
| Form validation | Manual `onChange` + error state | `react-hook-form` (via shadcn Form) | shadcn Form component wraps react-hook-form; accessible error binding |
| Token refresh queue | Manual `isRefreshing` flag | Promise-shared pattern (see Pattern 5) | Race conditions on multiple simultaneous 401s; standard promise queue solves it |
| i18n plural rules | Custom plural mapping | i18next built-in (uses `Intl.PluralRules`) | Language-specific plural forms (Hungarian has different rules than English) |
| Accessible dialog/select/menu | Custom `div`-based popups | `@radix-ui/*` via shadcn | Focus trapping, ARIA roles, keyboard nav — weeks of work |
| Icon set | SVG sprites / inline SVGs | `lucide-react` | Hard constraint (CLAUDE.md); tree-shaken individual imports |

**Key insight:** shadcn generates source code into `src/components/ui/` — components are owned by the project and can be modified. This is not a runtime dependency in the traditional sense; the components are code the project controls.

---

## Common Pitfalls

### Pitfall 1: i18next v26 — Incompatible with react-i18next < 17

**What goes wrong:** Installing `i18next@26.x` with `react-i18next@16.x` or earlier results in runtime errors or missing exports because `react-i18next@17` requires `i18next >= 26.2.0`.
**Why it happens:** The major version bump to i18next v26 introduced breaking changes (removed `initImmediate` in favour of `initAsync`; changed `interpolation.format` API).
**How to avoid:** Always install `i18next@26.2.0` and `react-i18next@17.0.8` together. Never mix these across major boundaries.
**Warning signs:** Runtime error: "i18next.t is not a function" or TypeScript errors on `i18next.init()` options.

### Pitfall 2: `@vitejs/plugin-react` v6 Has No Babel Option

**What goes wrong:** Copying a v5 `vite.config.ts` that passes `babel: { plugins: [...] }` to `react()` causes Vite to throw at startup because the `babel` option was removed in v6.
**Why it happens:** v6 replaced Babel with Oxc for React Refresh.
**How to avoid:** Use `react()` with no options for the standard case. If Babel transforms are genuinely needed (e.g., React Compiler), install `@rolldown/plugin-babel` separately and place it before `react()` in the plugins array.
**Warning signs:** Vite startup error: "Unknown option 'babel' in plugin-react configuration."

### Pitfall 3: `verbatimModuleSyntax` Requires `import type` for All Type-Only Imports

**What goes wrong:** Using `import { SomeType }` instead of `import type { SomeType }` causes a TypeScript error when `verbatimModuleSyntax: true` is set (the import cannot be elided).
**Why it happens:** `verbatimModuleSyntax` prevents TypeScript from silently removing imports that turn out to be type-only; you must declare intent explicitly.
**How to avoid:** Use `import type { Foo }` for any import where `Foo` is only used as a type (interface, type alias, or type parameter). Value imports (`const`, `function`, `class`) use regular `import { Bar }`.
**Warning signs:** TS error 1484: "This import is never used as a value and must use 'import type' because 'verbatimModuleSyntax' is enabled."

### Pitfall 4: `erasableSyntaxOnly` Forbids Enums

**What goes wrong:** Using TypeScript `enum` anywhere in the codebase causes a compile error. This also affects parameter properties (`constructor(public x: number)`) and `namespace` with runtime code.
**Why it happens:** `erasableSyntaxOnly: true` ensures TypeScript code is compatible with Node.js native TypeScript stripping (where only erasable syntax is supported). CLAUDE.md explicitly forbids enums.
**How to avoid:** Use `as const` unions instead of enums:
```typescript
// WRONG
enum AuthStatus { Loading = 'loading', Auth = 'authenticated' }
// CORRECT
const AUTH_STATUS = { Loading: 'loading', Auth: 'authenticated' } as const
type AuthStatus = typeof AUTH_STATUS[keyof typeof AUTH_STATUS]
// Or simply: type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
```
**Warning signs:** TS error 1345: "'enum' declarations are not allowed with 'erasableSyntaxOnly'."

### Pitfall 5: Tailwind v4 — `@apply` with CSS Variables

**What goes wrong:** Using `@apply bg-background` inside a CSS file before `@theme inline` is declared causes Tailwind to not recognize the utility, because `--color-background` is only available after the `@theme inline` block maps it.
**Why it happens:** Tailwind v4 uses static analysis of `@theme` blocks to generate utilities; declaration order in `index.css` matters.
**How to avoid:** Keep the import order in `index.css` exactly: `@import "tailwindcss"` → `@import "tw-animate-css"` → `@theme inline` → `:root` variables. Never use `@apply` with shadcn semantic tokens in component-level CSS files.
**Warning signs:** CSS property shows as unrecognized in browser devtools despite being in `@theme`.

### Pitfall 6: Single-Flight Refresh — Multiple 401s Before `refreshPromise` Resolves

**What goes wrong:** Without the `_retried` flag + shared promise pattern, two parallel requests that both receive 401 each independently call `/auth/refresh`, causing a token rotation conflict (the second refresh invalidates the first new token).
**Why it happens:** Axios interceptors are synchronous setups, but the actual calls are async; two 401s can arrive before the refresh completes.
**How to avoid:** The module-level `let refreshPromise: Promise<string> | null = null` pattern ensures all concurrent 401s await the same refresh promise (see Pattern 5).
**Warning signs:** Intermittent authentication failures under parallel request scenarios.

### Pitfall 7: shadcn `init` Overwrites `src/index.css`

**What goes wrong:** Running `pnpm dlx shadcn@latest init` after manually editing `src/index.css` for Tailwind v4 overwrites the file with the CLI's generated content.
**Why it happens:** shadcn's `init` command writes the CSS variable block to the target CSS file.
**How to avoid:** Run `shadcn init` immediately after the Tailwind v4 `@import "tailwindcss"` line is in place but before any custom token additions. The CLI output IS the canonical starting point — review and extend it, don't pre-populate it.

### Pitfall 8: TypeScript Path Aliases — `tsconfig.app.json` vs Root `tsconfig.json`

**What goes wrong:** Defining `paths` in `tsconfig.app.json` (the referenced project config used by Vite) while the root `tsconfig.json` lacks them can cause Vite's `resolve.tsconfigPaths` to fail in dev mode on Windows.
**Why it happens:** Vite 8's `resolve.tsconfigPaths` (new built-in) has known issues with project references on Windows.
**How to avoid:** Use the explicit `resolve.alias` approach in `vite.config.ts` (see Pattern 1) rather than relying on `resolve.tsconfigPaths: true`. Keep `paths` in `tsconfig.app.json` for editor/type-check tooling, but let Vite use the alias directly. Both can coexist.

---

## Code Examples

### Walking Skeleton — Boot Sequence

The Phase 1 walking skeleton must demonstrate the complete auth boot flow end-to-end:

1. App loads → authStore starts with `status: 'loading'`
2. `main.tsx` triggers silent refresh: calls `rawClient.post('/auth/refresh')`
3. Success → `setAuth(user, token)` → authStore becomes `'authenticated'`
4. Failure (no cookie) → `clearAuth()` → authStore becomes `'unauthenticated'`
5. ProtectedRoute observes status → shows spinner during loading, redirects on unauthenticated, renders on authenticated

```typescript
// src/main.tsx — boot sequence trigger
import './i18n'
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { rawClient } from './api/rawClient'
import { useAuthStore } from './stores/authStore'
import './index.css'

// Trigger silent refresh before rendering
rawClient
  .post<{ accessToken: string; user: UserProfile }>('/auth/refresh')
  .then(({ data }) => {
    useAuthStore.getState().setAuth(data.user, data.accessToken)
  })
  .catch(() => {
    useAuthStore.getState().clearAuth()
  })

const queryClient = new QueryClient({ /* ... see Pattern 8 */ })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Suspense>
  </React.StrictMode>,
)
```

### `cn()` Utility (generated by shadcn)

```typescript
// src/lib/utils.ts — generated by shadcn init
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@vitejs/plugin-react` with Babel transforms | `@vitejs/plugin-react@6` uses Oxc; Babel removed | v6.0.0 (2025) | No `babel:` option in vite.config; React Compiler needs `@rolldown/plugin-babel` |
| `i18next@23` + `react-i18next@14/15` | `i18next@26` + `react-i18next@17` | 2025-2026 | `initImmediate` removed; `interpolation.format` API changed |
| Tailwind `tailwind.config.js` | Tailwind v4 CSS-first — `@theme inline` in CSS | v4.0 (2025) | No JS config file; tokens are CSS variables |
| shadcn `default` or `new-york` styles only | `radix-nova`, `radix-vega`, `radix-maia`, `radix-lyra`, `radix-mira` | 2025 | `default` deprecated; named styles including `radix-nova` are current |
| React Router `<BrowserRouter>` / `<Routes>` | `createBrowserRouter` + `RouterProvider` (Data Mode) | v6.4+ (now v7) | Enables loaders/actions; required for lazy() route splitting |
| Zustand `import create from 'zustand'` (default) | `import { create } from 'zustand'` (named) | v4→v5 | Default export removed in v5; must use named import |

**Deprecated/outdated:**
- `tailwind.config.js`: obsolete in v4; do not create
- `i18next.initImmediate`: removed in v26; the init is now always async
- `shadcn@latest` `default` style: deprecated; use `radix-nova`
- TypeScript `enum`: forbidden by `erasableSyntaxOnly`; use `as const` unions
- TypeScript `namespace` with runtime code: forbidden by `erasableSyntaxOnly`
- TypeScript parameter properties (`constructor(public x)`): forbidden by `erasableSyntaxOnly`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `rawClient.ts` calling `POST /auth/refresh` returns `{ accessToken, user }` in the body | Pattern 5, Boot Sequence | If backend returns different shape, boot sequence fails silently. Verify against PROJECT.md API contracts before implementing. |
| A2 | `i18next-browser-languagedetector` detects `navigator.language` correctly for `hu` (Hungarian BCP 47 tag) | Pattern 7 | Hungarian locale might need `hu-HU` vs `hu`; backend `Accept-Language` header must match backend's supported values |
| A3 | The Axios interceptor single-flight pattern (shared Promise) is sufficient for Phase 1's SPA; no queueing of failed requests beyond the originating request is needed | Pattern 5 | If multiple simultaneous requests need to be retried after refresh (not just the triggering one), the queue implementation above is incomplete. Full queue implementation needed if Phase 2 auth tests reveal the issue. |
| A4 | `pnpm dlx shadcn@latest init` in May 2026 defaults to a Tailwind v4-compatible output when `@tailwindcss/vite` is already installed | Pattern 2 | If shadcn CLI still generates Tailwind v3 config, manual migration of `components.json` and `index.css` is needed |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (It is not empty.)

---

## Open Questions

1. **TypeScript version: 5.9.3 vs 6.0.3**
   - What we know: The project spec says "TypeScript 5.9". TypeScript 6.0.3 is current `latest`. Both have `erasableSyntaxOnly` and `verbatimModuleSyntax`. TypeScript 6.0 has breaking changes (strict now default, `baseUrl` deprecated, `--moduleResolution node` deprecated).
   - What's unclear: Whether the project owner intended to stay on 5.9 long-term or just named the version available at spec-writing time.
   - Recommendation: Pin to `typescript@5.9.3` for Phase 1 to exactly match the spec. This avoids unplanned TS6 migration friction. Flag for explicit upgrade decision at a later phase.

2. **`POST /auth/refresh` response shape**
   - What we know: The response includes `accessToken` in JSON body and sets/refreshes the HttpOnly cookie. PROJECT.md describes the flow but the exact response schema is not included in the planning files read.
   - What's unclear: Whether the response also includes a `user: UserProfile` object or just the token.
   - Recommendation: Before implementing `main.tsx` boot sequence, confirm the exact response shape from the backend spec/OpenAPI. The Phase 1 walking skeleton's ProtectedRoute depends on this.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8 (requires >=20.19 or >=22.12) | ✓ | v24.14.1 | — |
| pnpm | Package manager | ✓ | 10.33.0 | — |
| npm (for `npm view` checks) | Version verification | ✓ | 11.11.0 | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

Node v24.14.1 satisfies Vite 8's `node: "^20.19.0 || >=22.12.0"` requirement.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (standard for Vite projects; not yet installed) |
| Config file | `vitest.config.ts` — does not exist yet (Wave 0 gap) |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map

Phase 1 is infrastructure-only. No user-visible feature requirements with REQ-IDs are assigned to this phase (see REQUIREMENTS.md Traceability). Validation focuses on structural/integration smoke tests:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| App builds without TypeScript errors | build | `pnpm tsc --noEmit` | Wave 0: tsconfig |
| App boots in browser and renders root route | smoke | `pnpm vitest run tests/smoke/app-boots.test.tsx` | Wave 0 |
| authStore starts with status: 'loading' | unit | `pnpm vitest run src/stores/__tests__/authStore.test.ts` | Wave 0 |
| Env validation throws on missing VITE_API_BASE_URL | unit | `pnpm vitest run src/__tests__/env.test.ts` | Wave 0 |
| ProtectedRoute renders spinner when status='loading' | unit | `pnpm vitest run src/components/ui/__tests__/ProtectedRoute.test.tsx` | Wave 0 |
| ProtectedRoute redirects when status='unauthenticated' | unit | as above | Wave 0 |
| Axios client adds Authorization header | unit | `pnpm vitest run src/api/__tests__/client.test.ts` | Wave 0 |
| i18n initializes and loads en/common.json | integration | `pnpm vitest run src/__tests__/i18n.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm tsc --noEmit` (type-check only; fast)
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite + `pnpm build` green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest is not yet installed; framework install: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] `src/stores/__tests__/authStore.test.ts`
- [ ] `src/__tests__/env.test.ts`
- [ ] `src/components/ui/__tests__/ProtectedRoute.test.tsx`
- [ ] `src/api/__tests__/client.test.ts`
- [ ] `src/__tests__/i18n.test.ts`
- [ ] `tests/smoke/app-boots.test.tsx`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Partial | Auth scaffold only — token storage pattern (Zustand memory, no localStorage) |
| V3 Session Management | Partial | HttpOnly cookie for refresh token; `withCredentials: true` on Axios |
| V4 Access Control | yes | `ProtectedRoute` gates all `/app/*` routes |
| V5 Input Validation | Partial | Env var validation via Zod; no user input forms in Phase 1 |
| V6 Cryptography | no | No crypto operations in Phase 1 |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS token theft | Information Disclosure | Access token in Zustand memory only — not in DOM, not in localStorage; `dangerouslySetInnerHTML` forbidden |
| CSRF on refresh endpoint | Tampering | Refresh token in `SameSite=Strict` HttpOnly cookie; backend responsibility |
| Token stampede (multiple 401s) | Denial of Service | Single-flight refresh via shared Promise — only one `POST /auth/refresh` per burst |
| Open redirect via `window.location` | Spoofing | `window.location.href` navigation forbidden; React Router `Navigate` used exclusively |
| Malicious env var injection | Tampering | Zod validates `VITE_API_BASE_URL` is a valid URL format at startup |

---

## Sources

### Primary (HIGH confidence)
- `npm view <pkg> version` — registry verification of all package versions (2026-05-15)
- `npm view <pkg> repository.url time.created` — package legitimacy verification
- https://vite.dev/blog/announcing-vite8 — Vite 8 changes, Oxc integration, Node requirements
- https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react%406.0.0 — plugin-react v6 breaking changes
- https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html — erasableSyntaxOnly behaviour
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html — TS 6.0 breaking changes
- https://ui.shadcn.com/docs/installation/vite — shadcn Vite setup steps
- https://ui.shadcn.com/docs/tailwind-v4 — Tailwind v4 CSS-first setup
- https://ui.shadcn.com/docs/components-json — components.json schema
- https://ui.shadcn.com/docs/theming — CSS variable structure and OKLCH
- https://reactrouter.com/start/modes — React Router v7 mode comparison
- https://reactrouter.com/api/data-routers/createBrowserRouter — createBrowserRouter TypeScript signature
- https://vite.dev/guide/env-and-mode — Vite env var typing with vite-env.d.ts
- https://tanstack.com/query/v5/docs/reference/QueryClient — QueryClient options
- https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5 — Zustand v5 breaking changes
- https://react.i18next.com/latest/using-with-hooks — i18next initialization pattern

### Secondary (MEDIUM confidence)
- https://www.shadcnblocks.com/blog/shadcn-component-styles-vega-nova-maia-lyra-mira — radix-nova style confirmed as valid
- https://github.com/shadcn-ui/ui/issues/9228 — radix-nova GitHub issue (confirms style exists)
- https://www.i18next.com/misc/migration-guide — i18next v26 migration changes
- `npm view react-i18next@17.0.8 peerDependencies` — confirms i18next >= 26.2.0 requirement

### Tertiary (LOW confidence, flagged assumptions)
- Community gists for Axios single-flight refresh pattern (multiple sources agree; implementation is A3)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed against npm registry 2026-05-15
- Architecture: HIGH — based on official docs for each library
- Pitfalls: HIGH — all grounded in verified API changes (plugin-react v6, TS erasableSyntaxOnly, i18next v26)
- Assumptions log: 4 items flagged for planner attention

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (stable, established libraries — but i18next/react-i18next are at a major version boundary; verify peer dep chain before install)
