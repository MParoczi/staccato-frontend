# Phase 6: US4 — Account Deletion and Cancellation

**Specification**: `003-user-profile-settings`
**Base branch**: `003-user-profile-settings`
**Branch to create**: `003-user-profile-settings/phase-6-us4-account-deletion`
**Depends on**: Phase 2 (independent of US1/US2/US3)

## Context

Read all files in `specs/003-user-profile-settings/` and `.specify/memory/constitution.md` before starting implementation. Key details:
- Delete account: simple confirm/cancel dialog (shadcn AlertDialog), not a type-to-confirm flow
- `DELETE /users/me` returns 200 with updated User (scheduledDeletionAt set). 409 if already scheduled
- `POST /users/me/cancel-deletion` returns 204 (no body). 400 if not scheduled
- DeletionBanner renders across ALL authenticated pages (lives in `src/components/common/`, rendered in AppLayout)
- Banner uses warm amber/gold color — add `--warning` CSS variable to `src/index.css` for both light and dark themes
- "Manage" link in banner navigates to `/app/profile`
- Deletion date formatted with `Intl.DateTimeFormat` using user's locale
- See `plan.md` section "Account Deletion Flow" and "DeletionBanner in AppLayout" for exact patterns
- See `contracts/api-contracts.md` for error response shapes

## Tasks

Implement the following tasks from `specs/003-user-profile-settings/tasks.md`:

- [ ] **T023** `[P]` `[US4]` — Create `useDeleteAccount` hook in `src/features/profile/hooks/useDeleteAccount.ts`. Exports two mutations: `useScheduleDeletion` (calls `deleteMe()`, on success invalidate `["user", "profile"]`, show success toast; on 409 error show localized "already scheduled" toast) and `useCancelDeletion` (calls `cancelDeletion()`, on success invalidate `["user", "profile"]`, show success toast; on 400 error show localized "not scheduled" toast)
- [ ] **T024** `[P]` `[US4]` — Create `DeleteAccountDialog` component in `src/features/profile/components/DeleteAccountDialog.tsx`. shadcn AlertDialog with title from i18n `profile.deletion.dialogTitle` and body from i18n `profile.deletion.dialogBody`. Confirm button uses destructive variant. Cancel button. On confirm: call `useScheduleDeletion` mutation, close dialog
- [ ] **T025** `[US4]` — Create `AccountDeletionSection` component in `src/features/profile/components/AccountDeletionSection.tsx`. Renders inside a Card at page bottom with destructive styling (muted terracotta-red border or accent). Two states based on `user.scheduledDeletionAt`: (1) null: shows "Delete Account" button (destructive variant) that opens DeleteAccountDialog. (2) set: shows warning text with formatted deletion date and "Cancel Deletion" button that calls `useCancelDeletion`
- [ ] **T026** `[US4]` — Create `DeletionBanner` component in `src/components/common/DeletionBanner.tsx`. Reads user from `useCurrentUser` hook. If `scheduledDeletionAt` is not null: renders a warm amber/gold banner with AlertTriangle icon, localized deletion message with formatted date, and "Manage" link (React Router Link to `/app/profile`). If null: renders nothing. Add `--warning` CSS variables to `src/index.css` for both light and dark themes if not already present
- [ ] **T027** `[US4]` — Update `src/routes/app-layout.tsx`. Import and render `DeletionBanner` between the header and the flex container (above `<Outlet />`), so it appears on every authenticated page

## Checkpoint

Full deletion lifecycle: schedule, banner across all pages, cancel. Error handling for 409/400.

## Quality Gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked `[x]` in `tasks.md`
