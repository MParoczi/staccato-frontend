# Tasks: User Profile & Settings

**Input**: Design documents from `/specs/003-user-profile-settings/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted. Tests can be added later via a separate checklist.

**Organization**: Tasks grouped by user story. Each story is independently implementable and testable after the foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Types, API functions, and shared hooks that all user stories depend on

- [x] T001 Add `UpdateProfileRequest` interface to `src/lib/types/auth.ts` with fields: firstName (string), lastName (string), language (Language), defaultPageSize (PageSize | null), defaultInstrumentId (string | null)
- [x] T002 Update `src/api/users.ts`: (a) change `updateMe()` from `apiClient.patch` to `apiClient.put` and change parameter type from `Partial<{...}>` to `UpdateProfileRequest`; (b) fix `cancelDeletion()` return type from `Promise<User>` to `Promise<void>` and remove `return res.data` (API returns 204 with no body)
- [x] T003 [P] Add `uploadAvatar(file: File)` function to `src/api/users.ts` — construct FormData with field name `File`, call `apiClient.put<User>('/users/me/avatar', formData)`
- [x] T004 Add `deleteAvatar()` function to `src/api/users.ts` — call `apiClient.delete('/users/me/avatar')`
- [x] T005 [P] Create `useCurrentUser` hook in `src/features/profile/hooks/useCurrentUser.ts` — wraps `useQuery` with key `["user", "profile"]`, fetcher `getMe()`, staleTime 30_000ms. Export the hook and its query key constant
- [x] T006 [P] Create `useInstruments` hook in `src/features/profile/hooks/useInstruments.ts` — wraps `useQuery` with key `["instruments"]`, fetcher `getInstruments()`, staleTime 300_000ms
- [x] T006b [P] Create `useUserPresets` hook in `src/features/profile/hooks/useUserPresets.ts` — wraps `useQuery` with key `["user", "presets"]`, fetcher `getUserPresets()` from `src/api/presets.ts`, default staleTime (0)

**Checkpoint**: Types, API layer, and shared query hooks are ready. User story implementation can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Profile page shell, routing, and i18n translations that all stories render within

- [x] T007 Add `profile.*` translation keys to `src/i18n/en.json` — include keys for: section titles (profile.info.title, profile.preferences.title, profile.deletion.title, profile.presets.title), field labels (profile.info.firstName, profile.info.lastName, profile.info.email, profile.info.save), avatar labels (profile.avatar.upload, profile.avatar.delete, profile.avatar.confirm, profile.avatar.cancel, profile.avatar.deleteConfirm, profile.avatar.deleteConfirmTitle), preference labels (profile.preferences.language, profile.preferences.pageSize, profile.preferences.instrument, profile.preferences.none, profile.preferences.saved), deletion strings (profile.deletion.deleteButton, profile.deletion.dialogTitle, profile.deletion.dialogBody, profile.deletion.cancelButton, profile.deletion.scheduledMessage, profile.deletion.manage), preset strings (profile.presets.empty, profile.presets.manageLink), error messages (profile.errors.avatarInvalid, profile.errors.avatarTooLarge, profile.errors.deletionAlreadyScheduled, profile.errors.deletionNotScheduled, profile.errors.saveFailed, profile.errors.uploadFailed), success messages (profile.success.saved, profile.success.avatarUploaded, profile.success.avatarDeleted, profile.success.deletionScheduled, profile.success.deletionCanceled), unsaved changes dialog (profile.unsaved.title, profile.unsaved.message, profile.unsaved.leave, profile.unsaved.stay), auto-save feedback (profile.preferences.autoSaveNote)
- [x] T008 [P] Add matching Hungarian translations to `src/i18n/hu.json` for all `profile.*` keys added in T007
- [x] T009 Create `ProfilePage` container component in `src/features/profile/components/ProfilePage.tsx` — renders page title, four Card sections (ProfileInfoSection, PreferencesSection, PresetsSection, AccountDeletionSection) in a single-column layout with vertical spacing. Use `useCurrentUser` hook to fetch profile. Show skeleton loading state while data loads. Each section is a shadcn Card
- [x] T010 Update `src/routes/index.tsx` — replace the `ProfilePage` placeholder import from `./placeholders` with the real `ProfilePage` from `@/features/profile/components/ProfilePage`
- [x] T011 Update `src/routes/app-layout.tsx` — call `useCurrentUser()` to ensure profile is cached early for all child routes. No visual changes yet (DeletionBanner added in US4)

**Checkpoint**: Profile page shell renders with loading state. Route is connected. Translations are in place.

---

## Phase 3: User Story 1 — View and Edit Profile Information (Priority: P1)

**Goal**: User can view their profile (avatar, name, email) and edit firstName/lastName with validation and save.

**Independent Test**: Navigate to `/app/profile`, see profile data, edit name fields, save, see success toast. Clear a field, see validation error.

### Implementation for User Story 1

- [x] T012 [P] [US1] Create Zod schema in `src/features/profile/schemas/profile-schema.ts` — `profileSchema` with firstName (string, min 1, max 100, trimmed) and lastName (string, min 1, max 100, trimmed). Export schema and inferred type
- [x] T013 [P] [US1] Create `useUpdateProfile` mutation hook in `src/features/profile/hooks/useUpdateProfile.ts` — calls `updateMe()` with full `UpdateProfileRequest` (merging current cached profile with form values). On success: invalidate `["user", "profile"]`, show success toast. On error: map server field errors via `setError`, show error toast for business errors
- [x] T014 [US1] Create `AvatarUpload` component in `src/features/profile/components/AvatarUpload.tsx` — (initial version, upload functionality in US2). Renders 96px circular avatar: shows user image if `avatarUrl` is set (with onError fallback to initials), shows initials (first letter of firstName + lastName) if no avatarUrl, shows generic User icon if both names empty. Camera icon overlay on hover. No upload/delete functionality yet — just display
- [x] T015 [US1] Create `ProfileInfoSection` component in `src/features/profile/components/ProfileInfoSection.tsx` — renders inside a Card: AvatarUpload (display-only), React Hook Form with firstName/lastName fields side-by-side on desktop (grid-cols-2) and stacked on mobile, read-only email display with text truncation, Save button. Uses `profileSchema` for Zod validation via zodResolver. On submit: calls `useUpdateProfile` mutation. Shows inline validation errors. Maps server field errors via setError
- [x] T016 [US1] Create unsaved changes guard — use `useBlocker` from React Router v7 in `ProfileInfoSection`. When form `isDirty` and user navigates away, show a custom styled confirmation dialog (shadcn AlertDialog) with title/body from i18n keys profile.unsaved.*, "Leave"/"Stay" buttons

**Checkpoint**: User Story 1 complete. User can view profile info, edit name fields with validation, save changes, and gets warned about unsaved changes.

---

## Phase 4: User Story 2 — Upload, Preview, and Remove Avatar (Priority: P1)

**Goal**: User can upload a custom avatar with client-side preview, and delete an existing avatar with confirmation.

**Independent Test**: Click avatar, select image, see inline preview with Confirm/Cancel, confirm upload, see new avatar. Click delete, confirm prompt, see initials.

### Implementation for User Story 2

- [x] T017 [P] [US2] Create `useAvatarUpload` hook in `src/features/profile/hooks/useAvatarUpload.ts` — exports two mutations: `useUploadAvatar` (calls `uploadAvatar()`, on success invalidate `["user", "profile"]`, show success toast) and `useDeleteAvatar` (calls `deleteAvatar()`, on success invalidate `["user", "profile"]`, show success toast). Both show error toast on failure with localized messages (400 avatar errors)
- [x] T018 [US2] Extend `AvatarUpload` component in `src/features/profile/components/AvatarUpload.tsx` — add hidden file input (accept: image/jpeg, image/png, image/webp). On click: open file picker. On file selected: validate client-side (type + size <= 2MB), if invalid show error toast and stop. If valid: create preview via URL.createObjectURL, replace avatar inline, show Confirm/Cancel buttons below. On confirm: call upload mutation, show spinner overlay during upload, revoke object URL on completion. On cancel: revoke object URL, revert to previous avatar. Add delete button (Trash2 icon) visible when user has custom avatar. On delete click: show shadcn AlertDialog confirmation prompt with i18n strings, on confirm call delete mutation

**Checkpoint**: User Story 2 complete. Full avatar lifecycle: upload with preview, delete with confirmation, client-side validation, error handling.

---

## Phase 5: User Story 3 — Change Preferences (Priority: P2)

**Goal**: User can change language (immediate UI switch), default page size, and default instrument, all with auto-save.

**Independent Test**: Switch language, see UI update instantly. Change page size, see checkmark confirmation. Select instrument from dropdown, see checkmark.

### Implementation for User Story 3

- [x] T019 [P] [US3] Create `useLanguageSwitch` hook in `src/features/profile/hooks/useLanguageSwitch.ts` — optimistic mutation: onMutate saves previous language, calls `i18next.changeLanguage()`, updates `["user", "profile"]` cache optimistically. mutationFn calls `updateMe()` with full profile + new language. onError rolls back i18next to previous language, restores cache, shows error toast. onSettled invalidates `["user", "profile"]`
- [x] T020 [P] [US3] Create `useUpdatePreferences` hook in `src/features/profile/hooks/useUpdatePreferences.ts` — generic optimistic mutation for page size and instrument changes. Accepts field name and new value, reads current profile from cache, merges changed field, calls `updateMe()` with full UpdateProfileRequest. onMutate updates cache optimistically. onError restores previous cache value, shows error toast. onSettled invalidates `["user", "profile"]`. Skips mutation if value unchanged (no-op)
- [x] T022 [US3] Create `PreferencesSection` component in `src/features/profile/components/PreferencesSection.tsx` — renders inside a Card with "Changes save automatically" subtitle note. Three shadcn Select dropdowns: Language (options: English, Hungarian; uses `useLanguageSwitch`), Page Size (options: None, A4, A5, A6, B5, B6; uses `useUpdatePreferences`), Instrument (options: None + instruments from `useInstruments`; uses `useUpdatePreferences`; shows error state with retry if instruments fail to load; shows "None" if user's saved instrument ID not in list). Each selector has a brief inline checkmark (Check icon, fades after ~1.5s via CSS animation or setTimeout) that appears on successful save

**Checkpoint**: User Story 3 complete. All three preferences auto-save with optimistic updates, inline confirmation, and error rollback.

---

## Phase 6: User Story 4 — Account Deletion and Cancellation (Priority: P2)

**Goal**: User can delete their account (with confirmation dialog), see a persistent warning banner across all pages, and cancel the deletion.

**Independent Test**: Click Delete Account, confirm dialog, see scheduled date + Cancel Deletion button. Navigate to another page, see amber banner with "Manage" link. Click Cancel Deletion, banner disappears.

### Implementation for User Story 4

- [ ] T023 [P] [US4] Create `useDeleteAccount` hook in `src/features/profile/hooks/useDeleteAccount.ts` — exports two mutations: `useScheduleDeletion` (calls `deleteMe()`, on success invalidate `["user", "profile"]`, show success toast; on 409 error show localized "already scheduled" toast) and `useCancelDeletion` (calls `cancelDeletion()`, on success invalidate `["user", "profile"]`, show success toast; on 400 error show localized "not scheduled" toast)
- [ ] T024 [P] [US4] Create `DeleteAccountDialog` component in `src/features/profile/components/DeleteAccountDialog.tsx` — shadcn AlertDialog with title "Delete your account?" (from i18n profile.deletion.dialogTitle) and body text (from i18n profile.deletion.dialogBody). Confirm button uses destructive variant. Cancel button. On confirm: call `useScheduleDeletion` mutation, close dialog
- [ ] T025 [US4] Create `AccountDeletionSection` component in `src/features/profile/components/AccountDeletionSection.tsx` — renders inside a Card at page bottom with destructive styling (muted terracotta-red border or accent). Two states based on `user.scheduledDeletionAt`: (1) null: shows "Delete Account" button (destructive variant) that opens DeleteAccountDialog. (2) set: shows warning text with formatted deletion date (Intl.DateTimeFormat with user locale) and "Cancel Deletion" button that calls `useCancelDeletion`
- [ ] T026 [US4] Create `DeletionBanner` component in `src/components/common/DeletionBanner.tsx` — reads user from `useCurrentUser` hook. If `scheduledDeletionAt` is not null: renders a warm amber/gold banner (new `--warning` CSS variable or inline oklch color matching earthy theme hue ~85) with AlertTriangle icon, localized deletion message with formatted date, and "Manage" link (React Router Link to `/app/profile`). If null: renders nothing. Add the `--warning` CSS variables to `src/index.css` for both light and dark themes if not already present
- [ ] T027 [US4] Update `src/routes/app-layout.tsx` — import and render `DeletionBanner` between the header and the flex container (above `<Outlet />`), so it appears on every authenticated page

**Checkpoint**: User Story 4 complete. Full deletion lifecycle: schedule, banner across all pages, cancel. Error handling for 409/400.

---

## Phase 7: User Story 5 — View Saved Style Presets (Priority: P3)

**Goal**: User can see a read-only list of their saved style presets on the profile page.

**Independent Test**: Navigate to `/app/profile`, scroll to presets section, see list of preset names. With no presets, see empty state message.

### Implementation for User Story 5

- [ ] T028 [US5] Create `PresetsSection` component in `src/features/profile/components/PresetsSection.tsx` — renders inside a Card. Uses `useUserPresets` hook. Shows preset names as simple rows with subtle border-b between items. Empty state: localized "No saved presets yet" message with a muted icon. "Manage presets" link at the bottom pointing to the Styling feature page (rendered as a disabled/muted link since Styling feature is not yet built). Loading state: skeleton rows

**Checkpoint**: User Story 5 complete. Read-only preset list with empty state.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, consistency, and cleanup

- [ ] T029 Wire all section components into `ProfilePage` in `src/features/profile/components/ProfilePage.tsx` — ensure all four sections render in correct order (ProfileInfoSection, PreferencesSection, PresetsSection, AccountDeletionSection). Verify Card styling, spacing, and responsive layout. Add page-level error boundary
- [ ] T030 [P] Run `pnpm run lint` and fix any linting errors across all new and modified files
- [ ] T031 [P] Run `pnpm test` to verify no existing tests are broken by the changes (PATCH→PUT in users.ts, AppLayout changes)
- [ ] T032 Verify full feature flow end-to-end: navigate to `/app/profile`, view/edit profile info, upload/delete avatar, switch language, change preferences, trigger deletion + banner + cancel, view presets. Confirm all i18n strings render in both English and Hungarian

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001, T002, T005 from Phase 1
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on T014 (AvatarUpload initial version from US1)
- **Phase 5 (US3)**: Depends on Phase 2 completion (independent of US1/US2)
- **Phase 6 (US4)**: Depends on Phase 2 completion (independent of US1/US2/US3)
- **Phase 7 (US5)**: Depends on T006b (useUserPresets from Phase 1) and Phase 2 completion
- **Phase 8 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no story dependencies
- **US2 (P1)**: After US1 T014 (extends the AvatarUpload component created in US1)
- **US3 (P2)**: After Phase 2 — independent of US1/US2
- **US4 (P2)**: After Phase 2 — independent of US1/US2/US3
- **US5 (P3)**: After Phase 2 + T006b — independent of other stories

### Within Each User Story

- Hooks before components (hooks are consumed by components)
- Schemas before components that use them (zodResolver)
- Core component before extensions (e.g., AvatarUpload display before upload logic)

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006 can all run in parallel (different files)
- **Phase 2**: T007 and T008 (en.json/hu.json) in parallel
- **Phase 3 (US1)**: T012 and T013 in parallel (schema + hook, different files)
- **Phase 4 (US2)**: T017 in parallel with T018 (hook before component, but hook is in separate file)
- **Phase 5 (US3)**: T019 and T020 in parallel (two independent hooks)
- **Phase 6 (US4)**: T023 and T024 in parallel (hook + dialog component)
- **Phase 8**: T030 and T031 in parallel

---

## Parallel Example: Phase 1 Setup

```
# Launch these four tasks in parallel (all different files):
T003: Add uploadAvatar() to src/api/users.ts
T004: Add deleteAvatar() to src/api/users.ts
T005: Create useCurrentUser hook in src/features/profile/hooks/useCurrentUser.ts
T006: Create useInstruments hook in src/features/profile/hooks/useInstruments.ts
```

## Parallel Example: Phase 5 (US3 Hooks)

```
# Launch these two hooks in parallel (independent files):
T019: Create useLanguageSwitch in src/features/profile/hooks/useLanguageSwitch.ts
T020: Create useUpdatePreferences in src/features/profile/hooks/useUpdatePreferences.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types, API, hooks)
2. Complete Phase 2: Foundational (translations, page shell, routing)
3. Complete Phase 3: User Story 1 (profile info view/edit)
4. **STOP and VALIDATE**: Navigate to `/app/profile`, edit names, save, verify
5. Deploy/demo if ready — core profile page is functional

### Incremental Delivery

1. Setup + Foundational → page shell renders
2. Add US1 → profile info with name editing (MVP)
3. Add US2 → avatar upload/delete extends the profile section
4. Add US3 → preferences with auto-save (can parallel with US4)
5. Add US4 → account deletion with global banner (can parallel with US3)
6. Add US5 → presets read-only list (lightweight final addition)
7. Polish → lint, test, end-to-end validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T003/T004 modify the same file (users.ts) — run sequentially or combine
- T007/T008 are the largest tasks (many i18n keys) — consider splitting if needed
- Avatar component (T014) is created in US1 as display-only, then extended in US2 (T018) with upload/delete
- useUserPresets hook (T006b) is in Phase 1 Setup — shared query hook consumed by US5
- All optimistic mutation hooks follow the same pattern: onMutate (update cache + save rollback), onError (restore + toast), onSettled (invalidate)
