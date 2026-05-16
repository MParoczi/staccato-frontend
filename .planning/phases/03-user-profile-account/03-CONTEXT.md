# Phase 3: User Profile & Account - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the persistent app navigation chrome (AppLayout + Navbar) and all user profile management: view/edit personal info and preferences, upload an avatar, and exercise the 30-day account deletion grace period.

This is the first phase with real authenticated server state. It establishes the TanStack Query pattern (useQuery + useMutation) that all subsequent phases inherit, and the AppLayout/Navbar structure that every authenticated page will render inside.

</domain>

<decisions>
## Implementation Decisions

### AppLayout Architecture

- **D-01:** Use nested router layout — `ProtectedRoute` (auth guard, unchanged) > `AppLayout` (layout element, no `path`) > individual page components. ProtectedRoute stays a pure auth guard rendering `<Outlet />`. AppLayout is a separate nested layout route.
- **D-02:** Router structure: `{ path: '/app', element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [{ path: 'notebooks', ... }, { path: 'profile', ... }] }] }`
- **D-03:** Navbar contains: Staccato logo (left) + avatar button (right). Nothing else at Phase 3. Future phases extend Navbar without touching AppLayout.
- **D-04:** Navbar is a standalone component at `src/components/Navbar.tsx` (not colocated in AppLayout.tsx).

### Data Fetching Strategy

- **D-05:** Phase 3 introduces TanStack Query. Do not defer to Phase 4. `QueryClient` is already configured in `main.tsx` (staleTime: 60s, 4xx no-retry).
- **D-06:** Profile page uses `useQuery(['user', 'me'], ...)` to fetch `GET /users/me`. Query key: `['user', 'me']`.
- **D-07:** Profile mutations (PATCH, avatar upload, deletion request/cancel) use `useMutation` with `onSuccess` calling `authStore.updateUser()`.
- **D-08:** Add `updateUser(user: UserProfile)` action to `src/stores/authStore.ts`. Updates `store.user` without changing `accessToken`. This separates profile mutations from token management.
- **D-09:** All profile API functions live in `src/features/profile/api/profileApi.ts`, calling the shared `client` from `src/api/client.ts`.

### Instrument Options

- **D-10:** `defaultInstrumentId` select options are fetched via `GET /instruments` using `useQuery(['instruments'])`. Not hardcoded (backend Guids are database IDs, not stable constants).
- **D-11:** If the instruments query is loading: show a skeleton/disabled select. If it errors: show disabled select with error label ("Could not load instruments"). The rest of the profile form remains saveable — exclude `defaultInstrumentId` from the PATCH payload when the value is null/unchanged.

### Profile Page Visual Layout

- **D-12:** Avatar sits above the form as a header element (not an inline form row). Large avatar (size="lg" or custom larger size), clickable to open file picker. "Change photo" label appears on hover or below the avatar.
- **D-13:** Form is sectioned with visual dividers:
  1. Avatar header (upload target)
  2. "Personal information" section: `firstName`, `lastName`
  3. "Preferences" section: `language`, `defaultPageSize`, `defaultInstrumentId`
  4. `[Save changes]` button (covers Personal + Preferences)
  5. "Danger Zone" section: delete account trigger
- **D-14:** Danger Zone uses subtle destructive styling: section heading in destructive/muted color, short description text ("Deleting your account is permanent. You have 30 days to cancel."), then a ghost/outline button in destructive color. No red-bordered card.
- **D-15:** When `scheduledDeletionAt` is set (from `authStore.user` or fresh query), a warning banner appears above the form showing the scheduled date and a "Cancel deletion" button.

### TypeScript Alignment

- **D-16:** `UserProfile` in `src/types/index.ts` has `defaultInstrument: string` — this must be reconciled to `defaultInstrumentId: string | null` to match the backend `Guid?`. Plan 1 must include this type update and any callsites that use `defaultInstrument`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Constraints (pnpm, erasableSyntaxOnly, no persist on authStore, single Axios instance, no window.location, cross-feature import ban), Key Decisions table
- `.planning/REQUIREMENTS.md` — Full requirement specs for USER-01–04 and NAV-01; UserResponse shape; success criteria; open questions

### Phase Scope
- `.planning/ROADMAP.md` §Phase 3 — Goal, requirements list, success criteria
- `.planning/STATE.md` — Current milestone state and key decisions already made

### Existing Code (must read before implementing)
- `src/types/index.ts` — `UserProfile` interface (needs `defaultInstrument` → `defaultInstrumentId: string | null` update)
- `src/stores/authStore.ts` — Current auth state; `updateUser` action to add
- `src/api/client.ts` — Authenticated Axios instance (single shared instance; DO NOT create ad-hoc)
- `src/api/rawClient.ts` — Unauthenticated client (for auth calls only)
- `src/router.tsx` — Current route structure (needs AppLayout nested layout added)
- `src/components/ui/ProtectedRoute.tsx` — Pure auth guard; MUST NOT be modified for layout concerns
- `src/features/auth/api/authApi.ts` — Pattern to follow for `src/features/profile/api/profileApi.ts`
- `src/main.tsx` — QueryClient configuration (staleTime, retry logic)
- `src/i18n.ts` — i18next setup; `profile` namespace already registered; `i18next.changeLanguage()` for language updates
- `src/components/ui/avatar.tsx` — Available: Avatar, AvatarImage, AvatarFallback, AvatarBadge (size: sm/default/lg)
- `src/components/ui/dropdown-menu.tsx` — Available for Navbar avatar dropdown
- `src/components/ui/dialog.tsx` — Available for account deletion confirmation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Avatar` / `AvatarImage` / `AvatarFallback` (`src/components/ui/avatar.tsx`): size="lg" for profile header; size="default" for navbar button; AvatarFallback renders initials text automatically
- `DropdownMenu` family (`src/components/ui/dropdown-menu.tsx`): for Navbar avatar dropdown
- `Dialog` family (`src/components/ui/dialog.tsx`): for account deletion confirmation modal
- `Form` / `Input` / `Select` / `Button` / `Sonner`: all installed; Form + react-hook-form + zod is the established auth-page pattern to replicate
- `useAuthStore` (`src/stores/authStore.ts`): `user`, `status`, `setAuth`, `clearAuth` — add `updateUser` here

### Established Patterns
- **Feature API module:** `src/features/{feature}/api/{feature}Api.ts` exports typed async functions calling the shared `client`
- **Form validation:** react-hook-form + zod resolver + shadcn Form (see LoginPage.tsx, RegisterPage.tsx)
- **Toast errors:** `toast.error(...)` from sonner
- **Navigation:** `useNavigate()` always — never `window.location`
- **Auth refresh:** `rawClient` for unauthenticated calls; `client` for authenticated
- **QueryClient:** Already initialized in `main.tsx` — import `useQuery`/`useMutation` from `@tanstack/react-query`

### Integration Points
- `src/router.tsx`: Add AppLayout as nested layout. ProtectedRoute stays `{ path: '/app', element: <ProtectedRoute /> }`. Insert `{ element: <AppLayout />, children: [...] }` inside.
- `src/stores/authStore.ts`: Add `updateUser(user: UserProfile): void` action — called by all profile mutations on success.
- `src/main.tsx`: `QueryClient` already configured; no changes needed.
- `public/locales/en/profile.json` + `public/locales/hu/profile.json`: Profile namespace already registered in i18next; strings go here.
- `src/components/Navbar.tsx` (new): Reads `authStore.user.avatarUrl` for avatar; `authStore.user.displayName` / `firstName` for initials fallback.

</code_context>

<specifics>
## Specific Ideas

- **Avatar click-to-upload:** User clicks the avatar image/fallback directly (not a separate button) to trigger the hidden `<input type="file" accept="image/jpeg,image/png,image/webp">`. "Change photo" text label below/on hover. No upload dialog — direct file picker.
- **Form layout mockup (selected during discussion):**
  ```
  [ Profile ]

        [  👤  ]  ← click to upload
      Change photo

  --- Personal information ---
  First name:  [ ................ ]
  Last name:   [ ................ ]

  --- Preferences ---
  Language:    [ English    ▾ ]
  Page size:   [ A4         ▾ ]
  Instrument:  [ Guitar     ▾ ]

  [ Save changes ]

  --- Danger zone ---
  Deleting your account is permanent. You have 30 days to cancel.
  [ Delete account ]  ← outline button, destructive color
  ```
- **Deletion banner (when scheduledDeletionAt is set):**
  Appears above the form sections. Shows: "Your account is scheduled for deletion on [date]. [Cancel deletion]" as a callout-style alert (not a modal).

</specifics>

<deferred>
## Deferred Ideas

- **Sidebar navigation** — User confirmed navbar = logo + avatar only. Sidebar (for notebook/lesson nav) is Phase 4+.
- **Breadcrumbs in Navbar** — Reserved for Phase 4+ when notebook context exists.
- **Notification bell** — Not in scope; future phase if needed.
- **Password change** — Not in Phase 3 spec; future consideration.
- **Email change** — Not in Phase 3 spec; future consideration.

</deferred>

---

*Phase: 3-user-profile-account*
*Context gathered: 2026-05-16*
