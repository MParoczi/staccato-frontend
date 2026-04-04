# Research: 003-user-profile-settings

**Date**: 2026-03-31

## R-001: HTTP Method for Profile Update

**Decision**: Change existing `updateMe()` from `apiClient.patch` to `apiClient.put` to match backend documentation (`PUT /users/me`).

**Rationale**: The STACCATO_FRONTEND_DOCUMENTATION.md Section 8.2 specifies `PUT /users/me`. The existing `src/api/users.ts` uses `.patch()` which is incorrect. PUT requires all fields (`firstName`, `lastName`, `language` are required; `defaultPageSize` and `defaultInstrumentId` are optional). The mutation hooks must send the complete profile object on each update, not just changed fields.

**Alternatives considered**: Keeping PATCH (would diverge from documented API contract and may cause 405 errors).

## R-002: Avatar Upload with multipart/form-data

**Decision**: Add `uploadAvatar()` function to `src/api/users.ts` that constructs a `FormData` object and passes it to `apiClient.put()`. Axios automatically sets `Content-Type: multipart/form-data` with the correct boundary when the request body is a `FormData` instance — no manual header override needed.

**Rationale**: The existing Axios instance sets `Content-Type: application/json` as a default header. However, Axios detects `FormData` bodies and overrides this automatically. This is the standard Axios pattern for file uploads.

**Alternatives considered**: Creating a separate Axios instance for file uploads (unnecessary complexity; Axios handles FormData natively).

## R-003: Presets Endpoint Path

**Decision**: Use the existing `getUserPresets()` from `src/api/presets.ts` (which calls `/presets/user`) for the read-only presets list on the profile page. Do not create a duplicate API function for `/users/me/presets`.

**Rationale**: The existing presets API module is already functional and matches the backend. The profile page only needs a read-only list; reusing the existing function avoids duplication and stays consistent with the presets feature that will manage them.

**Alternatives considered**: Creating a new `getUserPresets()` in `users.ts` calling `/users/me/presets` (duplicates existing function; both endpoints return the same data).

## R-004: Optimistic Updates for Preferences

**Decision**: Use optimistic updates (TanStack Query `onMutate`/`onError`/`onSettled` pattern) for preference changes (language, page size, instrument) to provide instant feedback. For language specifically: update i18next locale optimistically before the API call, and rollback on error.

**Rationale**: All three preferences auto-save on selection. Without optimistic updates, the user would see a delay between selecting a value and the UI reflecting the change. Language switching must feel instant (SC-002: under 1 second perceived delay). The constitution mandates the `onMutate`/`onError`/`onSettled` pattern for optimistic updates (Principle II).

**Alternatives considered**: Waiting for server confirmation before updating UI (violates SC-002 for language switch; creates perceptible lag for page size and instrument).

## R-005: Client-Side Avatar Preview

**Decision**: Use `URL.createObjectURL(file)` for generating an immediate client-side preview of the selected avatar image before upload. Revoke the object URL after the upload completes or the preview is dismissed to prevent memory leaks.

**Rationale**: `URL.createObjectURL` is synchronous and produces a blob URL that can be used directly in an `<img>` tag. It's more performant than `FileReader.readAsDataURL()` which requires an async read and produces a larger base64 string.

**Alternatives considered**: `FileReader.readAsDataURL()` (async, larger memory footprint, no advantage for preview use case).

## R-006: Client-Side File Validation

**Decision**: Validate file type and size client-side before showing preview or initiating upload. Accept: `image/jpeg`, `image/png`, `image/webp`. Max size: 2MB (2 * 1024 * 1024 bytes). Display validation errors immediately using toast notifications.

**Rationale**: Client-side validation provides instant feedback (FR-005, FR-015). The backend also validates (assumption from spec), but client-side validation avoids unnecessary network round-trips for obviously invalid files.

**Alternatives considered**: Server-side only validation (poor UX — user waits for upload to complete before learning the file is invalid).

## R-007: DeletionBanner Placement

**Decision**: Place the `DeletionBanner` component in `src/components/common/` and render it inside `AppLayout` (above the `<Outlet />`). The banner reads `scheduledDeletionAt` from the cached user profile query (`["user", "profile"]`). It includes a link to `/app/profile` for cancellation management.

**Rationale**: The constitution places app-wide shared components in `src/components/common/` (Principle I). Rendering in `AppLayout` ensures visibility on every authenticated page (FR-012, SC-005). Using the TanStack Query cache avoids an extra API call.

**Alternatives considered**: Rendering the banner in each page component (violates DRY; risk of missing pages, violates SC-005).

## R-008: Query Key Structure

**Decision**: Follow constitution's hierarchical query key convention:
- User profile: `["user", "profile"]` (staleTime: 30_000ms per Principle XI)
- Instruments: `["instruments"]` (staleTime: 300_000ms per Principle XI)
- User presets: `["user", "presets"]` (staleTime: 0, default)

**Rationale**: The constitution (Principle II) defines these exact query keys. Using them ensures consistency across features and enables targeted invalidation.

**Alternatives considered**: None — constitution is prescriptive on this.
