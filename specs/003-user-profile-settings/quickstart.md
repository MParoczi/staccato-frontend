# Quickstart: 003-user-profile-settings

**Date**: 2026-03-31

## Prerequisites

- Node.js LTS installed
- pnpm installed
- Backend API running (or `.env` configured with `VITE_API_BASE_URL`)

## Setup

```bash
pnpm install
cp .env.example .env  # if not already done
pnpm dev
```

## What This Feature Adds

### New Files

```
src/features/profile/
├── components/
│   ├── ProfilePage.tsx              # Main profile page (container)
│   ├── ProfileInfoSection.tsx       # Avatar, name fields, email display, Save button
│   ├── AvatarUpload.tsx             # Circular avatar with upload/delete overlay
│   ├── PreferencesSection.tsx       # Language, page size, instrument selectors
│   ├── AccountDeletionSection.tsx   # Delete account / cancel deletion
│   ├── DeleteAccountDialog.tsx      # Confirmation dialog for account deletion
│   └── PresetsSection.tsx           # Read-only saved presets list
├── hooks/
│   ├── useCurrentUser.ts            # TanStack Query hook: GET /users/me
│   ├── useUpdateProfile.ts          # Mutation hook: PUT /users/me (profile info)
│   ├── useUpdatePreferences.ts      # Mutation hook: PUT /users/me (preferences with optimistic update)
│   ├── useAvatarUpload.ts           # Mutation hooks: PUT/DELETE avatar
│   ├── useDeleteAccount.ts          # Mutation hooks: DELETE account, POST cancel
│   ├── useInstruments.ts            # TanStack Query hook: GET /instruments (shared)
│   ├── useUserPresets.ts            # TanStack Query hook: user presets (read-only)
│   └── useLanguageSwitch.ts         # Orchestrates i18n + Axios header + API persist
└── schemas/
    └── profile-schema.ts            # Zod schema: firstName, lastName validation

src/components/common/
└── DeletionBanner.tsx               # Persistent warning banner for scheduled deletion
```

### Modified Files

```
src/api/users.ts           # Add uploadAvatar(), deleteAvatar(); fix PATCH → PUT
src/routes/app-layout.tsx  # Add DeletionBanner to layout
src/routes/index.tsx       # Replace ProfilePage placeholder with real component
src/i18n/en.json           # Add profile.* translation keys
src/i18n/hu.json           # Add profile.* translation keys
```

## Key Patterns

### useCurrentUser Hook
Wraps `useQuery` with key `["user", "profile"]` and `staleTime: 30_000`. Should be called in `AppLayout` to ensure profile is cached early. Other components consume via the same query key — TanStack Query deduplicates.

### Language Switch Flow
1. User selects language → `useLanguageSwitch` hook fires
2. Optimistically: update i18next locale + Axios `Accept-Language` header
3. Call `PUT /users/me` with full profile (updated language)
4. On success: invalidate `["user", "profile"]` cache
5. On error: rollback i18next locale + Axios header, show error toast

### Preferences Auto-Save
Page size and instrument selectors trigger `PUT /users/me` immediately on change using optimistic updates. The mutation sends the complete `UpdateProfileRequest` (not a partial), merging the current cached profile with the changed field.

### Avatar Upload
1. User clicks avatar → hidden file input opens (accept: image/jpeg, image/png, image/webp)
2. Client-side validation: check MIME type + file size ≤ 2MB
3. Show preview via `URL.createObjectURL(file)`
4. On confirm: POST `FormData` to `PUT /users/me/avatar`
5. On success: invalidate `["user", "profile"]` → new `avatarUrl` appears
6. Revoke object URL to free memory

### DeletionBanner
Reads from the `["user", "profile"]` cache. If `scheduledDeletionAt !== null`, renders a warm amber banner with the formatted date and a "Manage" link to `/app/profile`. Placed in `AppLayout` above `<Outlet />`.

## Testing

```bash
pnpm test                # Run all tests
pnpm test -- --run       # Run tests once (no watch)
```

Test files are colocated:
- `src/features/profile/schemas/profile-schema.test.ts`
- `src/features/profile/hooks/useCurrentUser.test.ts` (etc.)
- `src/components/common/DeletionBanner.test.tsx`
