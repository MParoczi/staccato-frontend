# Implementation Plan: User Profile & Settings

**Branch**: `003-user-profile-settings` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-user-profile-settings/spec.md`

## Summary

Build the user profile and settings page at `/app/profile` with four sections: profile information (avatar + name editing), preferences (language/page size/instrument with auto-save), account deletion/cancellation with a persistent app-wide warning banner, and a read-only presets list. The user profile is fetched via TanStack Query (`["user", "profile"]`) and cached with 30s staleTime. Language switching orchestrates i18next locale, Axios `Accept-Language` header, and `PUT /users/me` in a single optimistic flow. Avatar upload uses multipart/form-data with client-side preview via `URL.createObjectURL`.

## Technical Context

**Language/Version**: TypeScript 5.9+ with strict mode enabled
**Primary Dependencies**: React 19, Vite 8, Tailwind CSS v4, shadcn/ui (Radix), Zustand 5, TanStack Query v5, React Router v7, Axios, React Hook Form, Zod, react-i18next, Lucide React
**Storage**: N/A (frontend-only; server state via TanStack Query cache, auth token in Zustand memory)
**Testing**: Vitest + React Testing Library + MSW
**Target Platform**: Modern browsers (Chrome/Firefox/Safari/Edge latest 2)
**Project Type**: Web application (SPA frontend)
**Performance Goals**: Language switch <1s perceived delay, avatar upload <5s, profile data available immediately from cache after login
**Constraints**: Max 250 LOC per component, no emojis (Lucide icons only), earthy-modern design system (Zone 1)
**Scale/Scope**: Single-user settings page, 4 interactive sections + 1 read-only section

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Folder Structure | PASS | Feature code in `src/features/profile/`, shared banner in `src/components/common/`, API in `src/api/users.ts` |
| II. State Management | PASS | All server state via TanStack Query (`["user", "profile"]`, `["instruments"]`, `["user", "presets"]`). No Zustand duplication of server data. Optimistic updates use `onMutate`/`onError`/`onSettled` |
| III. API Integration | PASS | All calls through centralized `apiClient`. Avatar upload sends `FormData` (Axios auto-sets Content-Type). No raw Axios calls outside `src/api/` |
| IV. Component Architecture | PASS | ProfilePage = container, section components = presentational/container mix, AvatarUpload = presentational. All function components with hooks. No component exceeds 250 lines |
| V. Design System | PASS | Zone 1 (App Shell) — earthy-modern palette. DeletionBanner uses warm amber/gold. Account deletion uses destructive color (muted terracotta-red). shadcn/ui components throughout |
| VI. No Emojis | PASS | All icons via Lucide React (User, Camera, Trash2, AlertTriangle, Check, Settings, etc.) |
| VII. Form Handling | PASS | Profile edit form uses React Hook Form + Zod schema. Server errors mapped via `setError`. Business errors (409/400) displayed as toast notifications |
| VIII. Routing | PASS | `/app/profile` route already exists in router. No new routes needed |
| IX. Internationalization | PASS | All strings via i18next with `profile.*` namespace. Date formatting via `Intl.DateTimeFormat`. Language change updates i18next + Axios header + API |
| X. Type Safety | PASS | `User`, `Instrument`, `UserSavedPreset`, `PageSize`, `Language` types already exist. New `UpdateProfileRequest` type added to `src/lib/types/auth.ts`. No `any` usage |
| XI. Performance | PASS | User profile staleTime: 30,000ms. Instruments staleTime: 300,000ms. Query keys follow hierarchical convention |
| XII. Testing | PASS | Colocated tests. Zod schema tests (100% branch coverage). Hook tests with MSW mocks. Component tests for critical interactions |

**Post-Phase 1 re-check**: All gates still pass. No violations introduced during design phase.

## Project Structure

### Documentation (this feature)

```text
specs/003-user-profile-settings/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity and cache design
├── quickstart.md        # Phase 1: setup and patterns guide
├── contracts/
│   └── api-contracts.md # Phase 1: API endpoint contracts
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── users.ts                          # MODIFY: add uploadAvatar(), deleteAvatar(); fix PATCH → PUT
├── components/
│   └── common/
│       └── DeletionBanner.tsx             # NEW: persistent app-wide deletion warning
├── features/
│   └── profile/
│       ├── components/
│       │   ├── ProfilePage.tsx            # NEW: main page container
│       │   ├── ProfileInfoSection.tsx     # NEW: avatar + name fields + email + Save
│       │   ├── AvatarUpload.tsx           # NEW: circular avatar with upload/delete
│       │   ├── PreferencesSection.tsx     # NEW: language, page size, instrument
│       │   ├── AccountDeletionSection.tsx # NEW: delete/cancel deletion UI
│       │   ├── DeleteAccountDialog.tsx    # NEW: confirm/cancel dialog
│       │   └── PresetsSection.tsx         # NEW: read-only preset list
│       ├── hooks/
│       │   ├── useCurrentUser.ts          # NEW: query hook for GET /users/me
│       │   ├── useUpdateProfile.ts        # NEW: mutation for profile info save
│       │   ├── useUpdatePreferences.ts    # NEW: mutation for preferences (optimistic)
│       │   ├── useAvatarUpload.ts         # NEW: mutations for avatar upload/delete
│       │   ├── useDeleteAccount.ts        # NEW: mutations for delete/cancel deletion
│       │   ├── useInstruments.ts          # NEW: shared query for GET /instruments
│       │   ├── useUserPresets.ts          # NEW: query for user presets
│       │   └── useLanguageSwitch.ts       # NEW: language switch orchestrator
│       └── schemas/
│           └── profile-schema.ts          # NEW: Zod validation for name fields
├── i18n/
│   ├── en.json                            # MODIFY: add profile.* keys
│   └── hu.json                            # MODIFY: add profile.* keys
├── lib/
│   └── types/
│       └── auth.ts                        # MODIFY: add UpdateProfileRequest
└── routes/
    ├── app-layout.tsx                     # MODIFY: add DeletionBanner + useCurrentUser
    └── index.tsx                          # MODIFY: replace ProfilePage placeholder import
```

**Structure Decision**: Follows the existing single-project frontend structure established by the constitution. Feature-specific code lives in `src/features/profile/` (components, hooks, schemas). The `DeletionBanner` is a shared component in `src/components/common/` since it renders in the app layout, not the profile page. API functions extend the existing `src/api/users.ts` module.

## Component Hierarchy

```
AppLayout (MODIFY)
├── DeletionBanner (NEW — reads from ["user", "profile"] cache)
└── <Outlet />
    └── ProfilePage (NEW — container)
        ├── ProfileInfoSection (NEW)
        │   ├── AvatarUpload (NEW)
        │   └── [React Hook Form: firstName, lastName fields + Save button]
        ├── PreferencesSection (NEW)
        │   ├── Language selector (auto-save)
        │   ├── Page size selector (auto-save)
        │   └── Instrument selector (auto-save)
        ├── AccountDeletionSection (NEW)
        │   ├── Delete Account button → DeleteAccountDialog (NEW)
        │   └── Deletion info + Cancel Deletion button (when scheduled)
        └── PresetsSection (NEW — read-only list)
```

## Key Implementation Patterns

### 1. useCurrentUser Hook

```
Query key: ["user", "profile"]
staleTime: 30_000ms
Fetcher: getMe() from src/api/users.ts
Usage: AppLayout (ensures early cache), ProfilePage sections, DeletionBanner
```

Called in `AppLayout` to ensure the profile is cached immediately for all child routes. Other consumers (profile sections, DeletionBanner) use the same query key — TanStack Query deduplicates and serves from cache.

### 2. Language Switch Orchestration

```
1. User selects new language
2. onMutate: save previous language, update i18next.changeLanguage(), update cache optimistically
3. mutationFn: PUT /users/me with full profile (merged current + new language)
4. onError: rollback i18next to previous language, restore cache
5. onSettled: invalidate ["user", "profile"]
```

The Axios interceptor already reads `i18next.language` for the `Accept-Language` header on every request, so updating i18next automatically updates future API call headers.

### 3. Preferences Auto-Save (Page Size, Instrument)

Same optimistic mutation pattern as language. Each selector change:
1. Reads current profile from cache
2. Merges the changed field
3. Sends full `UpdateProfileRequest` via `PUT /users/me`
4. Optimistically updates `["user", "profile"]` cache

### 4. Avatar Upload Flow

```
1. Click avatar → hidden <input type="file" accept="image/jpeg,image/png,image/webp">
2. onChange: validate file (type + size ≤ 2MB client-side)
3. If invalid: show error toast, stop
4. If valid: create preview URL via URL.createObjectURL(file)
5. Show preview in avatar circle with Confirm/Cancel overlay
6. On confirm: construct FormData, call PUT /users/me/avatar
7. On success: invalidate ["user", "profile"], revoke object URL
8. On error: show error toast, revoke object URL, revert to previous avatar
```

### 5. Account Deletion Flow

```
Delete:
1. Click "Delete Account" → open DeleteAccountDialog (shadcn AlertDialog)
2. Dialog shows warning text + Confirm/Cancel buttons
3. On confirm: DELETE /users/me → success toast + invalidate ["user", "profile"]
4. Cache updates: scheduledDeletionAt now set → DeletionBanner appears globally

Cancel:
1. Click "Cancel Deletion" on profile page
2. POST /users/me/cancel-deletion → success toast + invalidate ["user", "profile"]
3. Cache updates: scheduledDeletionAt now null → DeletionBanner disappears
```

### 6. DeletionBanner in AppLayout

```
Reads user from ["user", "profile"] cache
If user.scheduledDeletionAt !== null:
  Render amber/gold banner with:
    - AlertTriangle icon
    - "Your account is scheduled for deletion on {formatted date}..."
    - "Manage" link to /app/profile
Else: render nothing
```

## Complexity Tracking

No constitution violations. No complexity justifications needed.
