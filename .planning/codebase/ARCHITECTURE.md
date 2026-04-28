# Architecture

**Analysis Date:** 2026-04-28

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│  index.html → src/main.tsx                                          │
│    └─ <StrictMode>                                                  │
│        └─ <QueryClientProvider client={queryClient}>                │
│            └─ <App />  (src/App.tsx)                                │
│                ├─ [optional] <GoogleOAuthProvider>                  │
│                ├─ <RouterProvider router={router} />                │
│                └─ <Toaster />  (sonner)                             │
└─────────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   ┌─ src/routes/index.tsx ─┐      ┌─ src/i18n (side-effect import) ─┐
   │ createBrowserRouter([  │      │ i18next + LanguageDetector       │
   │  RootRedirect          │      │ resources: en, hu                │
   │  PublicLayout          │      └──────────────────────────────────┘
   │   ├ /login             │
   │   └ /register          │
   │  ProtectedRoute        │
   │   └ AppLayout          │
   │      ├ /app/notebooks  │
   │      ├ /app/notebooks/:notebookId (NotebookLayout)
   │      │   ├ index → CoverPage
   │      │   ├ index   → IndexPage
   │      │   └ lessons/:lessonId/pages/:pageId → LessonPage
   │      ├ /app/profile    │
   │      ├ /app/exports    │
   │      └ /app/chords     │
   └────────────────────────┘
                               │
                               ▼
            ┌────────────────────────────────────────┐
            │     Feature modules (src/features/*)   │
            │  auth · notebooks · profile · styling  │
            │  components/  hooks/  schemas/  utils/ │
            └────────────────────────────────────────┘
                  │              │             │
                  ▼              ▼             ▼
         ┌──────────────┐ ┌────────────┐ ┌──────────────┐
         │ TanStack     │ │ Zustand    │ │ RHF + Zod    │
         │ Query v5     │ │ stores/    │ │ (form state) │
         │ (server)     │ │ auth, ui   │ │              │
         └──────┬───────┘ └────────────┘ └──────────────┘
                │
                ▼
         ┌─────────────────────────────────────┐
         │ src/api/client.ts (axios)           │
         │ ├─ req: Authorization, Accept-Lang  │
         │ └─ res: 401 → silentRefresh (1-flight)
         │ src/api/raw-client.ts               │
         │ src/api/{auth,notebooks,modules,…}  │
         └──────────────────┬──────────────────┘
                            ▼
              Backend REST API + (future) SignalR Hub
```

## Component Responsibilities

| Layer              | Responsibility                                                       | Location                                     |
|--------------------|----------------------------------------------------------------------|----------------------------------------------|
| Bootstrap          | Mount React root, install QueryClient + i18n side-effect             | `src/main.tsx`                               |
| App shell          | Compose Router + Google OAuth + Toaster                              | `src/App.tsx`                                |
| Routing            | `createBrowserRouter` route tree                                     | `src/routes/index.tsx`                       |
| Layout / guards    | `RootRedirect`, `PublicLayout`, `ProtectedRoute`, `AppLayout`, `NotebookLayout` | `src/routes/`                       |
| Features           | Vertical slices (UI + hooks + schemas + utils)                       | `src/features/{auth,notebooks,profile,styling}/` |
| Shared layout      | App sidebar, user menu, navigation chrome                            | `src/components/layout/`                     |
| Shared common      | DottedPaper, DeletionBanner, PageErrorBoundary                       | `src/components/common/`                     |
| Design primitives  | shadcn/Radix primitives (Button, Dialog, …)                          | `src/components/ui/`                         |
| Stores             | `authStore` (token + expiresAt + isLoggingOut), `uiStore`            | `src/stores/`                                |
| Hooks (shared)     | `useInstruments`, etc.                                               | `src/hooks/`                                 |
| Lib                | `query-client.ts`, `utils.ts`, `constants/{grid,modules,music,notebook-colors}`, `types/*` | `src/lib/`              |
| i18n               | `i18next` init + `en.json`/`hu.json` bundles                         | `src/i18n/`                                  |
| API                | Axios instances + per-resource modules (+ co-located tests)          | `src/api/`                                   |

## Pattern Overview

Feature-sliced SPA. Strict separation of:
- **Server state** → TanStack Query (single `queryClient` in `src/lib/query-client.ts`)
- **Client state** → Zustand (`src/stores/`)
- **Form state** → React Hook Form + Zod (per-feature `schemas/`)
- **Transport** → single Axios instance in `src/api/client.ts`

No SSR. Vite produces a static SPA.

## Key Behaviors

### Auth Flow

1. `LoginPage` (or Google OAuth) calls `src/api/auth.ts` via the **raw** client.
2. Backend returns `{ accessToken, expiresIn, user? }` and sets a httpOnly refresh cookie.
3. `useAuthStore.setAuth(token, expiresIn)` stores token in memory + computes `expiresAt = now + expiresIn*1000`.
4. Every subsequent request: `apiClient` injects `Authorization: Bearer …`.
5. On `401`: response interceptor calls `silentRefresh()` (single-flight) → `POST /auth/refresh` via `rawClient` → updates store → replays original request with `_retried = true` flag.
6. On refresh failure: `clearAuth()`; `ProtectedRoute` then renders `<Navigate to="/login" />` on next render (no `window.location` mutation).
7. Proactive refresh timer in `src/features/auth/hooks/useProactiveRefresh.ts` schedules `silentRefresh()` ahead of `expiresAt`.

### Server Read Path

Component → feature hook (`useNotebooks`, `useLesson`, …) → `useQuery({ queryKey, queryFn })` → `src/api/<resource>.ts` → `apiClient` → backend → cache → component.

Retry policy (`src/lib/query-client.ts`): retry up to 3× on **5xx or network errors only**; never on 4xx; never on 401 (handled by interceptor).

### Server Write Path

`useMutation` in feature hook → `src/api/<resource>.ts` → on success, `queryClient.invalidateQueries(...)` or `setQueryData`. Toasts surfaced via `sonner`.

### i18n

- Side-effect import `@/i18n` in `src/main.tsx` initializes `i18next` before `<App />`.
- `LanguageDetector` reads `localStorage` / `navigator.language`.
- `apiClient` injects detected language as `Accept-Language` per request.
- `useLanguageSwitch` (`src/features/profile/hooks/`) updates user profile + i18next together.

### Notebook Domain (current focus)

- **Routes:** `/app/notebooks/:notebookId` → `NotebookLayout`
  - `index` → `CoverPage`
  - `index` (path) → `IndexPage`
  - `lessons/:lessonId/pages/:pageId` → `LessonPage`
- **Spec 007** (`specs/007-module-styling-system/plan.md`): module styling — `src/features/styling/{components,hooks,utils}`.
- **Spec 008** (`specs/008-grid-canvas-module-placement/plan.md`): grid canvas + drag/drop placement using `@dnd-kit/core`. Grid constants in `src/lib/constants/grid.ts`; module constants in `src/lib/constants/modules.ts`.
- Page navigation: `src/features/notebooks/utils/page-sequence.ts` + `usePageNavigation` hook (see CONCERNS.md / Issue 1 in `issues/bug-audit-2026-04.md`).

## Architectural Constraints

- **Single Axios instance** — `src/api/client.ts`. No ad-hoc `axios.create` or `fetch` in features.
- **Single QueryClient** — `src/lib/query-client.ts`. Imported into `src/main.tsx` provider.
- **Token in memory only** — never persist `accessToken`. The `authStore` has no `persist` middleware.
- **Single-flight refresh** — concurrent 401s share `refreshPromise`.
- **Server data in TanStack Query, not Zustand.**
- **No cross-feature imports** between `src/features/*` siblings — push shared code into `components/`, `lib/`, `hooks/`, `stores/`.
- **All user-facing strings through `t(...)`.**

## Anti-Patterns to Avoid

- Direct `axios.create` or `fetch` in components — bypasses auth/refresh.
- Persisting `accessToken` to `localStorage` — breaks XSS posture.
- Storing server collections in Zustand — duplicates TanStack cache.
- `window.location.href = …` for navigation — bypasses Router (see Issue 3 in bug-audit-2026-04 — already remediated in `client.ts`).
- Globally-listening keyboard handlers without modal/input guards (see Issue 11).

## Error Handling

- Transport errors mapped via interceptors; `AxiosError` typed.
- Mutations → `onError` toasts via `sonner`.
- Route-level errors via React Router (consider `errorElement` per route — current `routes/index.tsx` does not declare any; opportunity).
- Page-level boundary: `src/components/common/PageErrorBoundary.tsx`.

