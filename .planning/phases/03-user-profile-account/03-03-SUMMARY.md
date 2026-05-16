# Plan 03-PLAN-03 Summary — Profile API Layer & Locale Expansion

## What was done

### Task 1: Created `src/features/profile/api/profileApi.ts`
- Created the directory `src/features/profile/api/` (profile feature did not previously exist).
- Authored `profileApi.ts` with 6 exported async functions and 2 exported interfaces, all using the shared `client` from `@/api/client`.
- Functions: `getMe`, `updateMe`, `uploadAvatar`, `requestDeletion`, `cancelDeletion`, `getInstruments`.
- Interfaces: `UpdateProfilePayload`, `InstrumentOption`.

### Task 2: Expanded `public/locales/en/profile.json`
- Replaced the 7-key stub (title, firstNameLabel, lastNameLabel, languageLabel, saveButton, deleteAccount.button, deleteAccount.warning) with the full 25-key set required by ProfilePage.
- Added: personalInfo, preferences, firstNamePlaceholder, lastNamePlaceholder, emailLabel, languageEn, languageHu, pageSizeLabel, pageSizeNone, instrumentLabel, instrumentLoading, instrumentError, instrumentNone, saveSuccess, saveError, changePhoto, avatarSuccess, avatarError, avatarTooLarge, and the full deleteAccount nested block (sectionTitle, sectionDescription, dialogTitle, dialogDescription, confirmButton, warning with {{date}}, cancelButton, cancelSuccess, cancelError, error).

### Task 3: Expanded `public/locales/hu/profile.json`
- Replaced the 7-key stub with the matching 25-key structure using `__HU_TODO__` stubs, mirroring the EN shape exactly.

## Files Modified

- `src/features/profile/api/profileApi.ts` — created (new file)
- `public/locales/en/profile.json` — expanded from 7 to 25 top-level keys
- `public/locales/hu/profile.json` — expanded from 7 to 25 top-level keys (stubs)

## Verification Results

| Check | Result |
|---|---|
| `pnpm tsc --noEmit` | Pass (exit 0, zero errors) |
| EN locale: saveSuccess, dialogTitle, avatarTooLarge present | `true` |
| EN/HU top-level key count match | `en: 25  hu: 25  match: true` |
| `rawClient` not referenced in profileApi.ts | NOT FOUND (correct) |
| `grep saveSuccess` public/locales/en/profile.json | Match found |
| `grep avatarTooLarge` public/locales/en/profile.json | Match found |
| `grep cancelSuccess` public/locales/hu/profile.json | Match found |
| Exported function + interface count | 8 (6 functions + 2 interfaces) |
