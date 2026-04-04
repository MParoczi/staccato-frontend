# Phase 5: US3 — Change Preferences

**Specification**: `003-user-profile-settings`
**Base branch**: `003-user-profile-settings`
**Branch to create**: `003-user-profile-settings/phase-5-us3-preferences`
**Depends on**: Phase 2 (independent of US1/US2)

## Context

Read all files in `specs/003-user-profile-settings/` and `.specify/memory/constitution.md` before starting implementation. Key details:
- All preferences auto-save on selection (no Save button)
- Language switch is optimistic: update i18next locale immediately, then PUT to server. Roll back on error
- The Axios interceptor already reads `i18next.language` for `Accept-Language` header — updating i18next automatically updates future API call headers
- `updateMe()` uses PUT with full `UpdateProfileRequest` body (not PATCH) — merge changed field with current profile from cache
- Each selector shows a brief inline checkmark (Lucide `Check` icon, fades after ~1.5s) on successful save
- Instrument list comes from `useInstruments` hook. Show "None" if user's saved instrument ID is not in the list
- See `plan.md` sections "Language Switch Orchestration" and "Preferences Auto-Save" for the exact optimistic update pattern

## Tasks

Implement the following tasks from `specs/003-user-profile-settings/tasks.md`:

- [ ] **T019** `[P]` `[US3]` — Create `useLanguageSwitch` hook in `src/features/profile/hooks/useLanguageSwitch.ts`. Optimistic mutation: `onMutate` saves previous language, calls `i18next.changeLanguage()`, updates `["user", "profile"]` cache optimistically. `mutationFn` calls `updateMe()` with full profile + new language. `onError` rolls back i18next to previous language, restores cache, shows error toast. `onSettled` invalidates `["user", "profile"]`
- [ ] **T020** `[P]` `[US3]` — Create `useUpdatePreferences` hook in `src/features/profile/hooks/useUpdatePreferences.ts`. Generic optimistic mutation for page size and instrument changes. Accepts field name and new value, reads current profile from cache, merges changed field, calls `updateMe()` with full `UpdateProfileRequest`. `onMutate` updates cache optimistically. `onError` restores previous cache value, shows error toast. `onSettled` invalidates `["user", "profile"]`. Skips mutation if value unchanged (no-op)
- [ ] **T022** `[US3]` — Create `PreferencesSection` component in `src/features/profile/components/PreferencesSection.tsx`. Renders inside a Card with "Changes save automatically" subtitle note. Three shadcn Select dropdowns: Language (English/Hungarian, uses `useLanguageSwitch`), Page Size (None/A4/A5/A6/B5/B6, uses `useUpdatePreferences`), Instrument (None + instruments from `useInstruments`, uses `useUpdatePreferences`; shows error state with retry if instruments fail to load; shows "None" if user's saved instrument ID not in list). Each selector has a brief inline checkmark that appears on successful save and fades after ~1.5s

## Checkpoint

All three preferences auto-save with optimistic updates, inline confirmation, and error rollback.

## Quality Gates

- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes
- [ ] All tasks in this phase marked `[x]` in `tasks.md`
