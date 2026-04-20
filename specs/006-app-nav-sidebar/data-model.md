# Phase 1 Data Model: App Navigation Sidebar

**Feature**: 006-app-nav-sidebar
**Date**: 2026-04-06

This feature introduces **no backend entities** and **no new persisted data**. It only defines two small frontend-local types used to render the sidebar chrome from the already-fetched user profile. The canonical server-side entity (`User`) already exists in `src/lib/types/auth.ts` and is reused unchanged.

## 1. Reused entity — `User` (existing, unchanged)

**Source**: `src/lib/types/auth.ts`
**TanStack Query cache key**: `['user', 'profile']` (already populated by `useCurrentUser()` in `src/features/profile/hooks/useCurrentUser.ts`)
**Endpoint**: `GET /users/me` (existing, unchanged)

Fields consumed by this feature:

| Field | Type | Sidebar use |
|---|---|---|
| `firstName` | `string` | Cascade tier 1 & 2: display name & initials |
| `lastName` | `string` | Cascade tier 1 & 2: display name & initials |
| `email` | `string` | Cascade tier 3: display name from local-part & first letter |
| `avatarUrl` | `string \| null` | Primary avatar image source (when non-null AND image loads) |
| `scheduledDeletionAt` | `string \| null` | Read by the existing `DeletionBanner`, NOT by the sidebar — listed here because the sidebar feature hoists the banner to full-viewport width in `AppLayout` |

Fields on `User` NOT consumed by this feature: `id`, `language`, `defaultPageSize`, `defaultInstrumentId` — these are only used by the profile feature and remain untouched.

No new fields are added to `User`. No new endpoint is introduced.

## 2. New frontend-local type — `UserDisplayProjection`

**Source (new file)**: `src/lib/utils/user-display.ts`
**Purpose**: The deterministic output of the FR-010 4-tier cascade. Produced by a pure function; consumed by `UserMenu` in a single render. Both the display-name slot and the avatar-fallback slot on the UI are driven from the same object, so they can never visually disagree (spec invariant).

**Shape (discriminated union keyed by `tier`)**:

```ts
export type UserDisplayProjection =
  | {
      tier: 1;
      displayName: string;          // "First Last"
      avatarFallback: string;       // two letters — first letter of firstName + first letter of lastName
    }
  | {
      tier: 2;
      displayName: string;          // the single present name
      avatarFallback: string;       // one letter — first letter of that name
    }
  | {
      tier: 3;
      displayName: string;          // email local-part (text before '@')
      avatarFallback: string;       // one letter — first letter of local-part
    }
  | {
      tier: 4;
      displayName: string;          // literal i18n-resolved "Account" label
      avatarFallback: 'icon';       // sentinel — UserMenu renders the <UserCircle /> Lucide icon
    };
```

**Validation rules** (enforced by the producer function, verified by unit tests):

| Rule | Source in spec |
|---|---|
| Tier is selected by the first matching rule, top-to-bottom | FR-010 |
| Tier 1 requires BOTH `firstName` and `lastName` to be non-empty strings after trimming | FR-010 #1 |
| Tier 2 requires EXACTLY ONE of `firstName` / `lastName` to be non-empty after trimming (the other is empty, null, or undefined) | FR-010 #2 |
| Tier 3 requires both name fields to be empty/missing AND `email` to be a non-empty string containing `@` | FR-010 #3 |
| Tier 4 applies when: (a) the query is still loading AND no cached `user` exists, OR (b) the query has errored AND no cached `user` exists, OR (c) the query has resolved but none of tiers 1–3 matched (e.g., user has no name AND no email, which should not happen in practice but is defended against) | FR-010 #4, FR-018 |
| **Background refetch with cached data does NOT promote to tier 4**: when a refetch is in flight but cached `user` data already exists, the caller MUST pass `isLoading: false` so the cascade evaluates against the cached data, not the loading flag. The cascade itself remains pure — the refetch-stability rule lives at the call site (`UserMenu`). | FR-018 |
| **Avatar image load failure does NOT change the cascade tier**: the cascade is determined ONLY by which user-profile fields are present (firstName, lastName, email) and whether the profile has resolved at all. A failed `<img>` load at runtime is handled by Radix's `<Avatar>` primitive's fallback slot — it does NOT call back into the cascade and does NOT promote the projection to tier 4. | FR-009, FR-018 |
| Avatar fallback letters are UPPERCASE | inferred from common avatar-initial conventions; tested |
| The email local-part is the substring BEFORE the first `@` — if the email contains no `@` (malformed), fall through to tier 4 | defensive; tested |
| The `displayName` for tier 4 is exactly the caller-supplied localized "Account" label — the util does not hardcode the English word | i18n (principle IX), FR-010, FR-032 |

**Important**: The function signature accepts the localized fallback label so that i18n stays in the component layer, and the pure util stays pure:

```ts
export function computeUserDisplayProjection(input: {
  user: User | null | undefined;
  isLoading: boolean;
  isError: boolean;
  fallbackLabel: string;   // e.g., i18n-resolved "Account"
}): UserDisplayProjection;
```

## 3. New frontend-local constant — `NAV_ITEMS`

**Source (new file)**: `src/components/layout/nav-items.ts`
**Purpose**: A single source of truth for the three top-level navigation entries. Consumed by `AppSidebar` to render the list of `<NavLink>`s.

**Shape**:

```ts
import { BookOpen, Music, Download, type LucideIcon } from 'lucide-react';

export interface NavItem {
  /** i18n key (under app.sidebar.nav.*) for the label */
  labelKey: 'notebooks' | 'chords' | 'exports';
  /** Lucide icon component */
  icon: LucideIcon;
  /** Destination path (prefix-matched by NavLink) */
  path: '/app/notebooks' | '/app/chords' | '/app/exports';
}

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'notebooks', icon: BookOpen, path: '/app/notebooks' },
  { labelKey: 'chords',    icon: Music,    path: '/app/chords' },
  { labelKey: 'exports',   icon: Download, path: '/app/exports' },
] as const;
```

**Validation rules**:

| Rule | Source in spec |
|---|---|
| Exactly 3 entries | FR-004 |
| Ordered as: Notebooks, Chord Library, Exports | FR-004 ("in this order") |
| Each entry MUST have a non-empty path and a valid `LucideIcon` | FR-005 |
| Paths MUST match the existing route definitions in `src/routes/index.tsx` | Constitution VIII |

The constant is `readonly` and frozen at the type level with `as const` so that downstream consumers cannot accidentally mutate it.

## 4. State transitions and stability rules

This feature has no stateful entities and therefore no persistent state transitions. The sidebar is fully driven by ephemeral, externally-owned state sources:

1. The router's current `location.pathname` (via `NavLink`'s internal subscription) — determines which nav entry is active.
2. The TanStack Query cache at `['user', 'profile']` — determines the tier of the user-display cascade.
3. The Radix `DropdownMenu.Root` internal open/closed state — local to that component, not global.
4. The Radix `Avatar` primitive's internal image-load state — local to that component, not global.
5. The Zustand `authStore.isLoggingOut` flag — already owned by the auth feature; this feature reads it to disable the logout menu item during the in-flight POST (FR-013c) and to short-circuit the silent token-refresh interceptor (FR-013a).

None of these are new — they are all existing mechanisms reused by this feature.

### Cascade tier stability rules (per FR-018)

The user-display cascade has four observable lifecycle states. The transitions between them are deterministic and are documented here so that an implementer can write the matching call-site logic in `UserMenu`.

| Lifecycle state | TanStack Query flags | Cached `user` | Cascade input | Resulting tier |
|---|---|---|---|---|
| First load (cold cache) | `isPending: true`, `isFetching: true`, `isError: false` | `undefined` | `isLoading: true`, `isError: false` | Tier 4 (placeholder) |
| First load failed (cold cache, network error) | `isPending: false`, `isFetching: false`, `isError: true` | `undefined` | `isLoading: false`, `isError: true` | Tier 4 (placeholder) |
| Resolved | `isPending: false`, `isFetching: false`, `isError: false` | `User` object | `isLoading: false`, `isError: false` | Tier 1 / 2 / 3 / 4 — picked by FR-010 cascade against `user` |
| Background refetch (warm cache, in-flight) | `isPending: false`, `isFetching: true`, `isError: false` | `User` object | `isLoading: false`, `isError: false` | **Same tier as before the refetch started** — the cached `user` still drives the cascade, so no flicker |
| Background refetch failed (warm cache, error) | `isPending: false`, `isFetching: false`, `isError: true` | `User` object (still cached) | `isLoading: false`, `isError: false` | **Same tier as before** — TanStack Query keeps the cached `user`, so the cascade still resolves against it; the error is silently logged but not surfaced in the sidebar |
| Refetch resolved with promoted/demoted data | `isPending: false`, `isFetching: false`, `isError: false` | New `User` object | `isLoading: false`, `isError: false` | **New tier** — re-evaluated on next render. If the user menu is open at this moment, the trigger row re-renders in place; the open menu's items are unaffected. |

The crucial implementation rule is at the call site: `isLoading` and `isError` MUST be derived from the *combination* of the query flags AND the presence of cached data, not from the flags alone.

```ts
const { data: user, isPending, isError } = useCurrentUser();

// Pass isLoading=true ONLY when we have nothing at all to show.
const isLoading = isPending && !user;
const isErrorWithoutData = isError && !user;
```

### Logout-flow state (consumed, not owned)

The Zustand `authStore` already exposes `startLogout()`, `clearAuth()`, and an `isLoggingOut: boolean` flag. This feature consumes them as follows (no new state added):

1. `UserMenu.handleLogout` reads `isLoggingOut` and returns early if it is `true` (FR-013c — guards against double-submission).
2. It then calls `startLogout()` (sets the flag), `await logout()` (POST), `clearAuth()` (always, in `finally`), and `navigate('/login', { replace: true })` (always).
3. The Axios refresh interceptor in `src/api/client.ts` MUST short-circuit when `isLoggingOut === true` so that an in-flight or queued silent refresh does not race with logout (FR-013a). If the interceptor does not already do this, this feature's implementation MUST add the guard.

## 5. Relationships

```text
                    ┌───────────────────────┐
                    │  AppLayout            │
                    │  (src/routes/         │
                    │   app-layout.tsx)     │
                    └───────────┬───────────┘
                                │ renders
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
     │DeletionBanner│   │  AppSidebar  │   │   <main>     │
     │  (existing)  │   │    (new)     │   │  <Outlet />  │
     └──────────────┘   └───────┬──────┘   └──────────────┘
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
                ┌────────────┐   ┌──────────────┐
                │ NAV_ITEMS  │   │  UserMenu    │
                │ (new const)│   │    (new)     │
                └────────────┘   └──────┬───────┘
                                        │ uses
                          ┌─────────────┼─────────────────┐
                          ▼             ▼                 ▼
                  ┌──────────────┐ ┌──────────┐ ┌────────────────────┐
                  │useCurrentUser│ │  Avatar  │ │computeUserDisplay  │
                  │   (existing) │ │  (new    │ │   Projection       │
                  │              │ │  shadcn) │ │   (new util)       │
                  └──────┬───────┘ └──────────┘ └────────────────────┘
                         │ uses
                         ▼
                  ┌────────────┐
                  │ User type  │
                  │ (existing) │
                  └────────────┘
```

Key constraints captured in the diagram:

- **`AppSidebar` is a child of `AppLayout`**, not a sibling. There is exactly one `AppSidebar` in the tree and it lives in `AppLayout`'s flex row, not inside `NotebookLayout`. When a notebook opens, `NotebookLayout` mounts inside `<main>` and has its own internal toolbar/sheet/canvas — the app sidebar stays exactly where it is in `AppLayout`.
- **`DeletionBanner` is a sibling of the flex row**, not a child of `<main>`. That placement is what makes it full-width per clarification Q2.
- **`UserMenu` is the only caller of `useCurrentUser()` inside the sidebar subtree**. `DeletionBanner` also calls `useCurrentUser()` separately — this is fine because TanStack Query deduplicates by query key.
- **`NAV_ITEMS` is imported directly by `AppSidebar`** — no indirection, no store, no hook.

## 6. Summary of new vs. existing

| Thing | New or existing? | Location |
|---|---|---|
| `User` interface | Existing | `src/lib/types/auth.ts` |
| `useCurrentUser()` hook | Existing | `src/features/profile/hooks/useCurrentUser.ts` |
| `GET /users/me` API call | Existing | `src/api/users.ts` (`getMe`) |
| `logout()` API call | Existing | `src/api/auth.ts` |
| `DropdownMenu` primitive | Existing | `src/components/ui/dropdown-menu.tsx` |
| `Avatar` primitive | **NEW** | `src/components/ui/avatar.tsx` |
| `UserDisplayProjection` type | **NEW** | `src/lib/utils/user-display.ts` |
| `computeUserDisplayProjection()` util | **NEW** | `src/lib/utils/user-display.ts` |
| `NAV_ITEMS` constant | **NEW** | `src/components/layout/nav-items.ts` |
| `AppSidebar` component | **NEW** | `src/components/layout/AppSidebar.tsx` |
| `UserMenu` component | **NEW** | `src/components/layout/UserMenu.tsx` |
| `--sidebar*` CSS variable values | **MODIFIED** (names unchanged) | `src/index.css` |
| `app.sidebar.*` i18n keys | **NEW** (under new `app.*` top-level namespace) | `src/i18n/en.json`, `src/i18n/hu.json` |
| `AppLayout` JSX structure | **MODIFIED** | `src/routes/app-layout.tsx` |
