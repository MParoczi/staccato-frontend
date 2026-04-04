# Phase 7: US5 — View Saved Style Presets

**Specification**: `003-user-profile-settings`
**Base branch**: `003-user-profile-settings`
**Branch to create**: `003-user-profile-settings/phase-7-us5-presets`
**Depends on**: Phase 2 (independent of other user stories)

## Context

Read all files in `specs/003-user-profile-settings/` and `.specify/memory/constitution.md` before starting implementation. Key details:
- This is a read-only section — no create/edit/delete functionality
- Uses `useUserPresets` hook (already created in Phase 1) with query key `["user", "presets"]`
- Preset names displayed as simple list rows with subtle `border-b` between items
- Empty state: localized "No saved presets yet" message with a muted Lucide icon
- "Manage presets" link at the bottom — rendered as disabled/muted link since Styling feature is not yet built
- Loading state: skeleton rows

## Tasks

Implement the following tasks from `specs/003-user-profile-settings/tasks.md`:

- [ ] **T028** `[US5]` — Create `PresetsSection` component in `src/features/profile/components/PresetsSection.tsx`. Renders inside a Card. Uses `useUserPresets` hook. Shows preset names as simple rows with subtle `border-b` between items. Empty state: localized "No saved presets yet" message with a muted icon. "Manage presets" link at the bottom pointing to the Styling feature page (rendered as a disabled/muted link since Styling feature is not yet built). Loading state: skeleton rows

## Checkpoint

Read-only preset list with empty state.

## Quality Gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked `[x]` in `tasks.md`
