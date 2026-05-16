# Plan 03-PLAN-04 Summary — ProfilePage + Router Registration

**Executed:** 2026-05-16
**Status:** Complete — all verifications pass

## Objective

Implement the complete `/app/profile` page covering USER-01 through USER-04 (avatar upload, profile form, preferences, account deletion) and register the route in the router.

## Tasks Completed

### Task 1: Created `src/pages/ProfilePage.tsx`

Full-featured profile page implementing:

- **USER-01 — Avatar upload**: File input (hidden) triggered by clicking the Avatar component. Client-side 2 MB size guard with i18n error message. `uploadAvatar()` mutation with loading spinner overlay on the Avatar. Accepts `image/jpeg`, `image/png`, `image/webp`.
- **USER-02 — Profile form**: `react-hook-form` + `zodResolver` with `profileSchema`. Fields: `firstName`, `lastName` (nullable strings, max 100), read-only `email` display. `values` prop used to sync form with server state on first load.
- **USER-03 — Preferences**: `language` Select (`en`/`hu`) with `i18next.changeLanguage()` on save. `defaultPageSize` Select (A4/A5/Letter/none). `defaultInstrumentId` Select populated from `getInstruments()` with Skeleton loading state and disabled Input fallback on error.
- **USER-04 — Account deletion**: "Danger zone" section with Delete button opening a confirmation Dialog. Shows scheduled deletion warning banner (with Cancel Deletion) when `scheduledDeletionAt` is set. `requestDeletion` and `cancelDeletion` mutations wired to store.

**Pre-implementation adjustments made vs. plan template:**

| Issue | Resolution |
|---|---|
| `Camera` icon imported but unused in JSX | Removed from imports |
| `Avatar size` prop only supports `"default"/"sm"/"lg"` | Used `className="size-24"` for custom 24-unit size |
| `DialogDescription` — verified present | No change needed |
| `Form`, `FormField`, `FormControl`, `FormLabel`, `FormMessage` — verified present | No change needed |
| `values` prop on `useForm` — verified supported in react-hook-form 7.75.0 | Used as-is |

### Task 2: Updated `src/router.tsx`

Added ProfilePage import and `{ path: 'profile', element: <ProfilePage /> }` inside the AppLayout children alongside the existing `notebooks` route.

## Files Modified

- **Created**: `src/pages/ProfilePage.tsx`
- **Modified**: `src/router.tsx`

## TypeScript Errors Encountered

None. `pnpm tsc --noEmit` exited 0 with zero errors on both first run (after ProfilePage creation) and second run (after router update).

## Verification Results

| Check | Result |
|---|---|
| `pnpm tsc --noEmit` exits 0 | PASS |
| `src/pages/ProfilePage.tsx` exists | PASS |
| `grep "ProfilePage" src/router.tsx` — 2 matches | PASS (import + JSX) |
| `grep "'profile'" src/router.tsx` — 1 match | PASS |
| `grep "window.location" src/pages/ProfilePage.tsx` — 0 matches | PASS |
| `grep "dangerouslySetInnerHTML" src/pages/ProfilePage.tsx` — 0 matches | PASS |

## Constraint Compliance

- No `enum` or namespaces used — `as const` / `z.enum` only
- All type-only imports use `import type { … }`
- No `window.location.href` — navigation handled by React Query state + authStore
- No `dangerouslySetInnerHTML`
- Paste/file input reads `type="file"` only (no clipboard manipulation)
- Icons: Lucide React only (`Loader2`)
- No cross-feature sibling imports — `@/features/profile/api/profileApi` imported from page, not from another feature
