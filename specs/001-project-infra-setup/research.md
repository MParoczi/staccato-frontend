# Research: Project Infrastructure Setup

**Date**: 2026-03-30
**Branch**: `001-project-infra-setup`

## R1. Tailwind CSS v4 + shadcn/ui Setup

### Decision: CSS-first configuration with two-layer variable system

Tailwind v4 eliminates `tailwind.config.js`. All configuration lives in the CSS entry file (`src/index.css`).

**Architecture (two layers):**

| Layer | Location | Purpose |
|-------|----------|---------|
| `:root` / `.dark` | Regular CSS selectors | Define raw color values; toggle with dark mode |
| `@theme inline` | Tailwind `@theme` directive | Map CSS vars into Tailwind's `--color-*` namespace for utility classes |
| `@custom-variant` | CSS directive | Enable class-based dark mode (`dark:` prefix) |

**How it works:**

1. `@import "tailwindcss";` replaces the old `@tailwind base/components/utilities`
2. Colors defined in `:root { --primary: oklch(...); }` (raw values)
3. `@theme inline { --color-primary: var(--primary); }` makes `bg-primary`, `text-primary` utilities work
4. `@custom-variant dark (&:where(.dark, .dark *));` enables class-based dark mode
5. `.dark { --primary: oklch(...); }` overrides values for dark mode

**Color format:** Tailwind v4 and shadcn/ui v2 use `oklch(L C H)` — NOT the old HSL format from shadcn v1.

### Rationale
This approach lets us define the earthy palette once in CSS variables, automatically theme all shadcn/ui components, and support dark mode with a single class toggle. No JavaScript config files needed.

### Alternatives Considered
- **tailwind.config.js (v3 approach):** Not compatible with Tailwind v4. Would require downgrade.
- **Hardcoded Tailwind classes (no CSS variables):** Prevents runtime theming and dark mode.

---

## R2. shadcn/ui Initialization

### Decision: Use `default` style, `stone` base color, CSS variables enabled

**Init command:**
```bash
npx shadcn@latest init
```

Interactive options:
- **Style:** `default` (spacious, clean — matches "generous whitespace" requirement)
- **Base color:** `stone` (closest warm neutral; we override all values anyway)
- **CSS variables:** Yes (required for theming)

**What init creates:**
1. `components.json` — shadcn configuration
2. `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
3. CSS variables block in `src/index.css` (`:root`, `.dark`, `@theme inline`)
4. Installs: `tailwind-merge`, `clsx`, `class-variance-authority`, `lucide-react`

**shadcn/ui CSS variables (complete list):**

Core semantic (each has `-foreground` pair):
- `--background`, `--foreground` — page background and default text
- `--card`, `--card-foreground` — card surfaces
- `--popover`, `--popover-foreground` — dropdown/popover surfaces
- `--primary`, `--primary-foreground` — primary buttons, links
- `--secondary`, `--secondary-foreground` — secondary buttons
- `--muted`, `--muted-foreground` — muted/disabled elements
- `--accent`, `--accent-foreground` — hover states, highlights
- `--destructive`, `--destructive-foreground` — error/delete actions

Utility (no foreground pair):
- `--border` — default border color
- `--input` — form input borders
- `--ring` — focus ring color

Sidebar:
- `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`
- `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`

Charts: `--chart-1` through `--chart-5`

Layout: `--radius` (sm/md/lg/xl derived from this)

**Components to install upfront** (per user requirement):
```bash
npx shadcn@latest add button card dialog dropdown-menu input label popover select sheet tabs toast tooltip command separator badge checkbox table scroll-area
```

Also need `form` component (React Hook Form integration):
```bash
npx shadcn@latest add form
```

### Rationale
Installing the full set upfront avoids repeated init overhead during feature development. The `default` style with generous spacing matches the "clean lines, generous whitespace" design requirement. The `stone` base gives warm neutrals as a starting point before we override with the full earthy palette.

### Alternatives Considered
- **`new-york` style:** Tighter, more compact. Rejected because the spec calls for "generous whitespace."
- **On-demand component installation:** Would work but adds friction for every feature. The 19 components listed are all used across the planned features.

---

## R3. Earthy Theme — Color Mapping Strategy

### Decision: Override all shadcn CSS variables with earthy oklch values

**Mapping from spec requirements to shadcn variables:**

| Spec Color | shadcn Variable | Role |
|------------|----------------|------|
| Primary (warm brown/terracotta) | `--primary` | Buttons, links, active states |
| Secondary (olive/sage green) | `--secondary` | Accents, badges, success states |
| Accent (muted gold/amber) | `--accent` | Highlights, focus rings, hover |
| Neutral (warm grays/charcoal) | `--muted` | Muted text, disabled states |
| Background (cream/off-white) | `--background` | Page background |
| Surface (warm white) | `--card`, `--popover` | Cards, panels, popovers |
| Destructive (muted terracotta-red) | `--destructive` | Delete, error actions |
| Warm charcoal | `--foreground` | Default text color |
| Warm gray | `--border`, `--input` | Borders, input outlines |
| Primary brown | `--ring` | Focus rings |
| Sidebar variants | `--sidebar-*` | Sidebar-specific colors |

**Notebook canvas subset** (custom variables, not shadcn):
- `--notebook-paper` — warm paper-white background
- `--notebook-dot` — dot grid color
- `--notebook-selection` — module selection highlight
- `--notebook-hover` — drag hover indicator

These are defined in `:root` alongside shadcn variables and used directly via `var()` in canvas components.

**Dark mode:** Define deeper, warmer earthy tones (not cold blue-gray). Dark terracotta, dark olive, dark amber — maintaining the warm temperature across both modes.

### Rationale
Direct mapping to shadcn's variable system means all 20+ shadcn components automatically render in earthy tones without any per-component overrides. The notebook canvas variables are separate because they serve a distinct visual zone (Constitution Principle V).

---

## R4. Axios 401 Interceptor Architecture

### Decision: Separate Axios instance for refresh + shared promise for concurrent dedup

**Architecture:**

1. **Two Axios instances:**
   - `api` — main instance with all interceptors (auth header, language, 401 handling)
   - `rawApi` — bare instance (base URL + credentials only) used exclusively for `POST /auth/refresh`

2. **Shared promise pattern for concurrent 401s:**
   ```
   Module-level state:
     isRefreshing = false
     refreshPromise = null

   On 401 response:
     if (!isRefreshing):
       isRefreshing = true
       refreshPromise = rawApi.post('/auth/refresh')
         .then(token => { store.setAccessToken(token); return token })
         .finally(() => { isRefreshing = false; refreshPromise = null })

     newToken = await refreshPromise
     retry original request with newToken

   On refresh failure:
     store.clearAuth()
     redirect to /login
     reject all queued promises
   ```

3. **TanStack Query integration:**
   - 401 handling lives entirely in Axios interceptor (transport layer)
   - TanStack Query `retry` configured to NOT retry 401s (interceptor already handles it)
   - `QueryCache` `onError` callback detects terminal auth failures for global error handling

### Rationale
The separate instance makes infinite loops **structurally impossible** — the refresh call never passes through the 401 interceptor. The shared promise ensures only one refresh fires even when 10 requests fail simultaneously. TanStack Query stays decoupled from auth concerns.

### Alternatives Considered
- **`_retry` flag on request config:** Works but fragile — edge cases can still cause loops.
- **Subscriber array (failedQueue):** More complex than shared promise for equivalent behavior.
- **Auth logic in TanStack Query `onError`:** Creates coupling and scattered refresh logic.

---

## R5. ProtectedRoute Pattern

### Decision: Route guard with silent refresh attempt on mount

**Pattern:**

```
ProtectedRoute renders one of three states:
  1. Token exists in Zustand → render children immediately
  2. No token, refresh not attempted → show loading spinner, call silentRefresh()
  3. No token, refresh attempted and failed → redirect to /login
```

**Key behaviors:**
- `silentRefresh()` is exported from `api/auth.ts` and calls `POST /auth/refresh` via the raw Axios instance
- Uses the same shared-promise dedup as the interceptor (so nested ProtectedRoutes don't double-refresh)
- Shows a loading state during refresh — never flashes the login page (Constitution Principle VIII)
- On success: token populates store, component re-renders, children render
- On failure: redirect to `/login`

**Why route guard, not app root:**
- App root refresh would block public pages (`/login`, `/register`) while refreshing
- Route guard only blocks protected routes, letting public routes render immediately
- Handles deep-link scenarios naturally (user bookmarks `/app/notebooks/123`)

### Rationale
Page reload clears the in-memory Zustand token. The route guard must attempt recovery via the HttpOnly cookie before assuming unauthenticated. This matches the constitution requirement (Principle VIII) that ProtectedRoute "MUST attempt a silent token refresh on mount if no access token exists."

---

## R6. TypeScript Types Organization

### Decision: Split by domain in `src/lib/types/`

**File structure:**
```
src/lib/types/
  index.ts      — barrel re-exports
  common.ts     — shared enums (ModuleType, BuildingBlockType, BorderStyle, FontFamily, PageSize, InstrumentKey, Language)
  auth.ts       — User
  notebooks.ts  — NotebookSummary, NotebookDetail, NotebookModuleStyle, NotebookIndex, NotebookIndexEntry
  lessons.ts    — LessonSummary, LessonDetail, LessonPage
  modules.ts    — Module (+ BuildingBlock discriminated union types if needed later)
  chords.ts     — ChordSummary, ChordDetail, ChordPosition, ChordString, ChordBarre, Instrument
  exports.ts    — PdfExport
  styles.ts     — SystemStylePreset, UserSavedPreset, StyleEntry
```

**Barrel export (`index.ts`):** Re-exports everything so consumers can do `import { NotebookSummary, ModuleType } from '@/lib/types'`.

### Rationale
Domain-split files keep individual files small and navigable. The barrel export preserves ergonomic imports. Matches Constitution Principle X: "Type files MUST be organized per domain."

### Alternatives Considered
- **Single `types.ts`:** Would grow to 300+ lines quickly. Harder to find types, harder to review changes.
- **Colocated with API modules:** Would scatter types across `src/api/`, making them harder to share.

---

## R7. TanStack Query Defaults

### Decision: Follow constitution-specified staleTime values

Per Constitution Principle XI:
- **Chords and instruments:** `staleTime: 300_000` (5 minutes)
- **User profile:** `staleTime: 30_000` (30 seconds)
- **Notebooks/lessons/modules:** `staleTime: 0` (always refetch on window focus)

**Global QueryClient defaults:**
- `staleTime: 0` (default — most data needs fresh fetches)
- `retry`: 3 for non-401 errors, 0 for 401s (handled by Axios interceptor)
- `refetchOnWindowFocus: true`
- `gcTime: 300_000` (5 minutes garbage collection — TanStack Query v5 renamed `cacheTime`)

Per-query overrides for chords/instruments/profile set their specific staleTime values.

### Rationale
Constitution is explicit about cache durations. The global default of 0 ensures safety — stale data is the worst-case failure mode for a real-time collaborative app. Specific queries opt in to longer staleness where appropriate.
