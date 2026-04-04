# Phase 2: Foundational — Translations, Page Shell, Routing

**Specification**: `003-user-profile-settings`
**Base branch**: `003-user-profile-settings`
**Branch to create**: `003-user-profile-settings/phase-2-foundational`
**Depends on**: Phase 1 (already merged into base branch)

## Context

Read all files in `specs/003-user-profile-settings/` and `.specify/memory/constitution.md` before starting implementation. Pay special attention to `plan.md` (component hierarchy, source code structure) and `spec.md` (clarification sessions with UI decisions).

## Tasks

Implement the following tasks from `specs/003-user-profile-settings/tasks.md`:

- [ ] **T007** — Add `profile.*` translation keys to `src/i18n/en.json`. Include keys for: section titles (`profile.info.title`, `profile.preferences.title`, `profile.deletion.title`, `profile.presets.title`), field labels (`profile.info.firstName`, `profile.info.lastName`, `profile.info.email`, `profile.info.save`), avatar labels (`profile.avatar.upload`, `profile.avatar.delete`, `profile.avatar.confirm`, `profile.avatar.cancel`, `profile.avatar.deleteConfirm`, `profile.avatar.deleteConfirmTitle`), preference labels (`profile.preferences.language`, `profile.preferences.pageSize`, `profile.preferences.instrument`, `profile.preferences.none`, `profile.preferences.saved`), deletion strings (`profile.deletion.deleteButton`, `profile.deletion.dialogTitle`, `profile.deletion.dialogBody`, `profile.deletion.cancelButton`, `profile.deletion.scheduledMessage`, `profile.deletion.manage`), preset strings (`profile.presets.empty`, `profile.presets.manageLink`), error messages (`profile.errors.avatarInvalid`, `profile.errors.avatarTooLarge`, `profile.errors.deletionAlreadyScheduled`, `profile.errors.deletionNotScheduled`, `profile.errors.saveFailed`, `profile.errors.uploadFailed`), success messages (`profile.success.saved`, `profile.success.avatarUploaded`, `profile.success.avatarDeleted`, `profile.success.deletionScheduled`, `profile.success.deletionCanceled`), unsaved changes dialog (`profile.unsaved.title`, `profile.unsaved.message`, `profile.unsaved.leave`, `profile.unsaved.stay`), auto-save feedback (`profile.preferences.autoSaveNote`)
- [ ] **T008** `[P]` — Add matching Hungarian translations to `src/i18n/hu.json` for all `profile.*` keys added in T007
- [ ] **T009** — Create `ProfilePage` container component in `src/features/profile/components/ProfilePage.tsx`. Renders page title, four Card sections (ProfileInfoSection, PreferencesSection, PresetsSection, AccountDeletionSection) in a single-column layout with vertical spacing. Use `useCurrentUser` hook to fetch profile. Show skeleton loading state while data loads. Each section is a shadcn Card
- [ ] **T010** — Update `src/routes/index.tsx`. Replace the `ProfilePage` placeholder import from `./placeholders` with the real `ProfilePage` from `@/features/profile/components/ProfilePage`
- [ ] **T011** — Update `src/routes/app-layout.tsx`. Call `useCurrentUser()` to ensure profile is cached early for all child routes. No visual changes yet (DeletionBanner added in US4)

## Checkpoint

Profile page shell renders with loading state. Route is connected. Translations are in place.

## Quality Gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked `[x]` in `tasks.md`
