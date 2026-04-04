# Phase 8: Polish & Cross-Cutting Concerns

**Specification**: `003-user-profile-settings`
**Base branch**: `003-user-profile-settings`
**Branch to create**: `003-user-profile-settings/phase-8-polish`
**Depends on**: All previous phases (2-7) must be merged first

## Context

Read all files in `specs/003-user-profile-settings/` and `.specify/memory/constitution.md` before starting implementation. Key details:
- This is the final integration phase — all section components already exist from Phases 3-7
- ProfilePage should render sections in order: ProfileInfoSection, PreferencesSection, PresetsSection, AccountDeletionSection
- Add a page-level error boundary
- Verify Card styling, spacing, and responsive layout across all sections
- See `plan.md` component hierarchy for the exact composition structure

## Tasks

Implement the following tasks from `specs/003-user-profile-settings/tasks.md`:

- [ ] **T029** — Wire all section components into `ProfilePage` in `src/features/profile/components/ProfilePage.tsx`. Ensure all four sections render in correct order (ProfileInfoSection, PreferencesSection, PresetsSection, AccountDeletionSection). Verify Card styling, spacing, and responsive layout. Add page-level error boundary
- [ ] **T030** `[P]` — Run `pnpm run lint` and fix any linting errors across all new and modified files
- [ ] **T031** `[P]` — Run `pnpm test` to verify no existing tests are broken by the changes (PATCH to PUT in users.ts, AppLayout changes)
- [ ] **T032** — Verify full feature flow end-to-end: navigate to `/app/profile`, view/edit profile info, upload/delete avatar, switch language, change preferences, trigger deletion + banner + cancel, view presets. Confirm all i18n strings render in both English and Hungarian

## Checkpoint

Full feature is integrated, lint-clean, tests pass, and all user stories work end-to-end.

## Quality Gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked `[x]` in `tasks.md`
- [ ] All 32 tasks across all phases marked `[x]` in `tasks.md`
