# Phase 4: US2 — Upload, Preview, and Remove Avatar

**Specification**: `003-user-profile-settings`
**Base branch**: `003-user-profile-settings`
**Branch to create**: `003-user-profile-settings/phase-4-us2-avatar`
**Depends on**: Phase 3 (T014 creates the AvatarUpload component that this phase extends)

## Context

Read all files in `specs/003-user-profile-settings/` and `.specify/memory/constitution.md` before starting implementation. Key details:
- Avatar upload uses `FormData` with field name `File` — see `contracts/api-contracts.md` for `PUT /users/me/avatar`
- Client-side validation: accept `image/jpeg`, `image/png`, `image/webp` only, max 2MB
- Inline preview via `URL.createObjectURL()` with Confirm/Cancel buttons
- Delete avatar shows shadcn AlertDialog confirmation before calling `DELETE /users/me/avatar`
- Both mutations invalidate `["user", "profile"]` on success

## Tasks

Implement the following tasks from `specs/003-user-profile-settings/tasks.md`:

- [ ] **T017** `[P]` `[US2]` — Create `useAvatarUpload` hook in `src/features/profile/hooks/useAvatarUpload.ts`. Exports two mutations: `useUploadAvatar` (calls `uploadAvatar()`, on success invalidate `["user", "profile"]`, show success toast) and `useDeleteAvatar` (calls `deleteAvatar()`, on success invalidate `["user", "profile"]`, show success toast). Both show error toast on failure with localized messages (400 avatar errors)
- [ ] **T018** `[US2]` — Extend `AvatarUpload` component in `src/features/profile/components/AvatarUpload.tsx`. Add hidden file input (`accept: image/jpeg, image/png, image/webp`). On click: open file picker. On file selected: validate client-side (type + size <= 2MB), if invalid show error toast and stop. If valid: create preview via `URL.createObjectURL`, replace avatar inline, show Confirm/Cancel buttons below. On confirm: call upload mutation, show spinner overlay during upload, revoke object URL on completion. On cancel: revoke object URL, revert to previous avatar. Add delete button (Trash2 icon) visible when user has custom avatar. On delete click: show shadcn AlertDialog confirmation prompt with i18n strings, on confirm call delete mutation

## Checkpoint

Full avatar lifecycle: upload with preview, delete with confirmation, client-side validation, error handling.

## Quality Gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked `[x]` in `tasks.md`
