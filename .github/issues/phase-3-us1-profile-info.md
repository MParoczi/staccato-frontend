# Phase 3: US1 — View and Edit Profile Information

**Specification**: `003-user-profile-settings`
**Base branch**: `003-user-profile-settings`
**Branch to create**: `003-user-profile-settings/phase-3-us1-profile-info`
**Depends on**: Phase 2 (must be merged first)

## Context

Read all files in `specs/003-user-profile-settings/` and `.specify/memory/constitution.md` before starting implementation. Key details:
- Avatar is 96px circular with initials fallback (see `spec.md` clarification sessions)
- Name fields are side-by-side on desktop (`grid-cols-2`), stacked on mobile
- Unsaved changes guard uses a custom styled dialog (shadcn AlertDialog), not browser `confirm()`
- Save button uses explicit submit, not auto-save
- Zod schema must mirror backend validation: firstName/lastName min 1, max 100, trimmed

## Tasks

Implement the following tasks from `specs/003-user-profile-settings/tasks.md`:

- [ ] **T012** `[P]` `[US1]` — Create Zod schema in `src/features/profile/schemas/profile-schema.ts`. `profileSchema` with firstName (string, min 1, max 100, trimmed) and lastName (string, min 1, max 100, trimmed). Export schema and inferred type
- [ ] **T013** `[P]` `[US1]` — Create `useUpdateProfile` mutation hook in `src/features/profile/hooks/useUpdateProfile.ts`. Calls `updateMe()` with full `UpdateProfileRequest` (merging current cached profile with form values). On success: invalidate `["user", "profile"]`, show success toast. On error: map server field errors via `setError`, show error toast for business errors
- [ ] **T014** `[US1]` — Create `AvatarUpload` component in `src/features/profile/components/AvatarUpload.tsx` (initial display-only version, upload functionality added in Phase 4/US2). Renders 96px circular avatar: shows user image if `avatarUrl` is set (with `onError` fallback to initials), shows initials (first letter of firstName + lastName) if no avatarUrl, shows generic User icon if both names empty. Camera icon overlay on hover. No upload/delete functionality yet
- [ ] **T015** `[US1]` — Create `ProfileInfoSection` component in `src/features/profile/components/ProfileInfoSection.tsx`. Renders inside a Card: AvatarUpload (display-only), React Hook Form with firstName/lastName fields side-by-side on desktop and stacked on mobile, read-only email display with text truncation, Save button. Uses `profileSchema` for Zod validation via zodResolver. On submit: calls `useUpdateProfile` mutation. Shows inline validation errors. Maps server field errors via `setError`
- [ ] **T016** `[US1]` — Create unsaved changes guard. Use `useBlocker` from React Router v7 in `ProfileInfoSection`. When form `isDirty` and user navigates away, show a custom styled confirmation dialog (shadcn AlertDialog) with title/body from i18n keys `profile.unsaved.*`, "Leave"/"Stay" buttons

## Checkpoint

User can view profile info, edit name fields with validation, save changes, and gets warned about unsaved changes.

## Quality Gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked `[x]` in `tasks.md`
