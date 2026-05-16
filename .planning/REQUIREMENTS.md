# Requirements: v0.3 User Profile & Account

**Milestone:** v0.3 User Profile & Account
**Phase:** 3
**Generated:** 2026-05-16
**Status:** Active

---

## Scope

Phase 3 delivers user profile management and introduces the persistent app navigation chrome (AppLayout + navbar). This is the first authenticated feature beyond login — it establishes the layout structure all subsequent phases will inherit.

**Requirements covered:** USER-01, USER-02, USER-03, USER-04 + NAV-01 (structural prerequisite)

---

## Requirements

### NAV-01 — AppLayout with Navbar

A persistent `AppLayout` component wraps all authenticated routes. The top navbar displays the Staccato logo and a user avatar button that opens a dropdown menu.

**Behavior:**
- Avatar button renders `avatarUrl` image when available; falls back to shadcn `Avatar` initials (first char of `firstName` + first char of `lastName`, or first char of `displayName` when names are not set)
- Dropdown options: "My Profile" → `navigate('/app/profile')`, "Sign out" → existing logout flow (`clearAuth` + navigate to `/login`)
- `AppLayout` replaces the current bare `ProtectedRoute` child structure — all `/app/*` routes render inside it
- `avatar.tsx` shadcn component is already installed; `dropdown-menu.tsx` is already installed

**API:** No new endpoints — avatar URL sourced from `authStore.user.avatarUrl`

---

### USER-01 — Profile View & Edit

User can view and edit their profile fields: `firstName`, `lastName`, `language`, `defaultPageSize`, `defaultInstrumentId`.

**Route:** `GET /app/profile`

**API:**
- `GET /users/me` → `UserResponse` (drives initial form values on mount)
- `PATCH /users/me` → updated `UserResponse` (persists changes; updates `authStore.user`)

**UserResponse shape (backend):**
```ts
{
  id: Guid
  email: string
  firstName: string
  lastName: string
  language: string           // "en" | "hu"
  defaultPageSize: string?   // "A4" | "A5" | "Letter" | null
  defaultInstrumentId: Guid?
  avatarUrl: string?
  scheduledDeletionAt: DateTime?
}
```

**Behavior:**
- Form pre-populated from `authStore.user` on mount; re-fetches via `GET /users/me` to ensure freshness
- On successful PATCH: update `authStore.user` with returned `UserResponse`, show Sonner success toast
- Language change: call `i18next.changeLanguage(newLang)` immediately on save — no page reload required
- `defaultPageSize` options: `A4`, `A5`, `Letter` (or "Not set" / null option)
- `defaultInstrumentId` options: list from instruments endpoint (currently 6-string guitar only)
- Email field displayed as read-only (not editable via this form)
- Validation: `firstName`/`lastName` ≤ 100 chars; `language` must be `en` or `hu`

**Frontend type note:** `UserProfile` in `src/types/index.ts` has `defaultInstrument: string` — this should be reconciled to `defaultInstrumentId: string | null` during planning to match the backend `Guid?`.

---

### USER-02 — Avatar Upload

User can upload a custom avatar (JPG/PNG/WebP, ≤ 2 MB). Google OAuth users see their Google photo by default (`avatarUrl` set at OAuth login). Local users with no avatar see initials fallback.

**API:**
- `POST /users/me/avatar` (multipart/form-data, field `file`) → `{ avatarUrl: string }` (or full `UserResponse`)
- On success: update `authStore.user.avatarUrl` with the returned URL

**Behavior:**
- File picker accepts `image/jpeg`, `image/png`, `image/webp` only
- Client-side validation: reject files > 2 MB before upload with inline error message
- Optimistic update: show new avatar in navbar immediately after successful upload response
- Upload progress: show loading state on the avatar area during upload
- Error: file too large → inline error (no toast); server error → Sonner error toast

---

### USER-03 — Request Account Deletion

User can initiate a 30-day account deletion grace period from the profile page.

**API:**
- `POST /users/me/deletion` → updated `UserResponse` (with `scheduledDeletionAt` set ~30 days out)

**Behavior:**
- Destructive action button labeled "Delete Account" on profile page
- Opens confirmation `Dialog` (shadcn `dialog.tsx` installed): "Your account will be permanently deleted on [date]. This can be cancelled within 30 days." with Confirm / Cancel buttons
- After confirmation: update `authStore.user.scheduledDeletionDate` with returned date; show deletion-pending warning banner on profile page
- Warning banner: "Your account is scheduled for deletion on [formatted date]." with a "Cancel deletion" button
- Banner persists across page reloads (driven by `scheduledDeletionDate` from `GET /users/me`)

---

### USER-04 — Cancel Account Deletion

User can cancel a pending account deletion from the warning banner on the profile page.

**API:**
- `DELETE /users/me/deletion` → updated `UserResponse` (`scheduledDeletionAt: null`)

**Behavior:**
- "Cancel deletion" button inside the warning banner
- On success: clear `authStore.user.scheduledDeletionDate`; banner disappears; show Sonner success toast "Account deletion cancelled"
- No confirmation dialog required for cancellation (it's a recovery action)

---

## User Stories

1. As a musician, I want to set my first and last name so my profile reflects who I am
2. As a musician, I want to upload a photo so I recognize my account at a glance
3. As a musician, I want to set my language to Hungarian so the app speaks my language
4. As a musician, I want to set default page size so new notebooks match my preferred paper format
5. As a musician, I want to delete my account if I stop using Staccato, with a 30-day window to change my mind
6. As a musician, I want to easily navigate to my profile from anywhere in the app

---

## Success Criteria (Phase 3 UAT)

1. Navbar renders with Staccato logo and avatar button; clicking the avatar opens a dropdown with "My Profile" and "Sign out"; "Sign out" triggers logout and redirects to `/login`
2. User can navigate to `/app/profile` via the navbar dropdown; the form is pre-populated with their current profile data (firstName, lastName, language, defaultPageSize)
3. User can update firstName, lastName, language, defaultPageSize and the changes persist after page reload; changing language to Hungarian updates all visible UI strings immediately
4. User can upload a JPG/PNG/WebP avatar ≤ 2 MB; the new avatar appears in the navbar immediately; a file > 2 MB is rejected with a client-side error before any upload begins
5. User can click "Delete Account", confirm in the dialog, and see a warning banner with the scheduled deletion date (30 days from now)
6. User can click "Cancel deletion" in the warning banner; the banner disappears and a success toast confirms cancellation

---

## Dependencies & Constraints

| Constraint | Detail |
|------------|--------|
| `authStore` in-memory only | No persist middleware — profile data flows through `authStore.user`; rehydrated from `GET /users/me` on mount |
| Single Axios instance | All profile API calls use `src/api/client.ts` (authenticated); avatar upload uses same instance |
| Navigation | `navigate()` from React Router only — no `window.location` |
| shadcn components in use | `Avatar`, `DropdownMenu`, `Dialog`, `Sonner`, `Form`, `Input`, `Select`, `Button` — all installed |
| Cross-feature imports | `features/profile/` must not import from `features/auth/` siblings — shared types via `src/types/` |
| TypeScript | No `enum`, no parameter properties; `import type` for type-only imports |

---

## Known Open Questions

| # | Question | Impact |
|---|----------|--------|
| Q1 | Is avatar upload `POST /users/me/avatar` or `PATCH /users/me/avatar`? Clarify during planning from spec. | Low — endpoint name only |
| Q2 | Does `GET /instruments` exist as a separate endpoint, or is instrument list static? | Medium — affects `defaultInstrumentId` select options |
| Q3 | `UserProfile.defaultInstrument: string` in types — needs reconciling with backend `defaultInstrumentId: Guid?` | High — type alignment required in Plan 1 |

---

*Last updated: 2026-05-16 — generated for v0.3 milestone*
