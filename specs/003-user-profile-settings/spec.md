# Feature Specification: User Profile & Settings

**Feature Branch**: `003-user-profile-settings`
**Created**: 2026-03-31
**Status**: Draft
**Input**: User description: "User Profile & Settings — Build the user profile and settings page where users manage their account, preferences, and avatar."

## Clarifications

### Session 2026-03-31

- Q: What confirmation method should the account deletion dialog use? → A: Simple confirm/cancel dialog with a warning message (no typed confirmation or password re-entry required).
- Q: Should page size and instrument preferences auto-save on selection or require an explicit Save button? → A: Auto-save on selection — all preferences (language, page size, instrument) save immediately on change, creating a consistent interaction pattern.
- Q: Should the persistent deletion warning banner on non-profile pages include a direct cancel action? → A: Banner includes a link to the profile page (e.g., "Manage" or "Go to settings") — not a direct Cancel Deletion button.

### Session 2026-04-04 (Checklist-driven)

- Q: Page layout and section separation? → A: Cards for each section (Profile Info, Preferences, Presets, Account Deletion). Name fields (firstName/lastName) side-by-side on desktop, stacked on mobile.
- Q: Avatar size? → A: 96px (size-24). Inline preview (replaces avatar in-place with Confirm/Cancel below). Confirmation prompt before avatar delete.
- Q: Language selector widget type? → A: Dropdown (consistent with page size and instrument selectors).
- Q: Auto-save visual feedback? → A: Brief inline checkmark icon next to the selector for ~1.5s, then fades.
- Q: Unsaved name changes on navigation? → A: Custom in-app confirmation dialog with styled UI warning about unsaved changes.
- Q: Presets display format? → A: Simple list rows with subtle border between items. "Manage presets" link at bottom (disabled until Styling feature ships).
- Q: Deletion dialog warning copy? → A: "Delete your account?" / "Your account and all your data will be permanently deleted after 30 days. You can cancel the deletion at any time during this period." Banner link text: "Manage".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Edit Profile Information (Priority: P1)

A logged-in user navigates to the profile page to view their current account details. They see their avatar (or initials if no custom avatar is set), first name, last name, and email address. The user edits their first name and last name, then saves the changes. The page confirms the update was successful.

**Why this priority**: Core identity management — users need to verify and correct their personal information before any other settings matter. This is the foundational interaction on the profile page.

**Independent Test**: Can be fully tested by navigating to `/app/profile`, verifying displayed user data, editing name fields, and saving. Delivers the primary value of self-service account management.

**Acceptance Scenarios**:

1. **Given** a logged-in user with existing profile data, **When** they navigate to `/app/profile`, **Then** they see their first name, last name, email (read-only), and avatar displayed correctly.
2. **Given** a user on the profile page, **When** they change their first name and click Save, **Then** the profile is updated and a success message is shown.
3. **Given** a user on the profile page, **When** they clear the first name field and attempt to save, **Then** a validation error is shown indicating the field is required.
4. **Given** a user with no custom avatar, **When** they view the profile page, **Then** a circular avatar displays their initials (first letter of first name + first letter of last name).

---

### User Story 2 - Upload, Preview, and Remove Avatar (Priority: P1)

A user wants to personalize their profile with a custom avatar photo. They click on their avatar area, select an image file, see a preview of the selected image, and confirm the upload. Alternatively, if they already have a custom avatar, they can remove it to revert to the default initials avatar.

**Why this priority**: Avatar management is a core part of profile identity. The upload/preview/delete flow is tightly coupled with the profile information section and represents a key visual interaction.

**Independent Test**: Can be tested by clicking the avatar area, selecting an image file, verifying the preview, confirming upload, and verifying the new avatar appears. Delete can be tested by removing the avatar and verifying initials appear.

**Acceptance Scenarios**:

1. **Given** a user on the profile page, **When** they click the avatar area, **Then** a file picker opens filtered to JPG, PNG, and WebP files.
2. **Given** a user selects a valid image under 2MB, **When** the file is chosen, **Then** a preview of the image is displayed before upload is confirmed.
3. **Given** a user confirms the avatar upload, **When** the upload completes, **Then** the new avatar image replaces the previous avatar or initials.
4. **Given** a user selects a file exceeding 2MB, **When** they attempt to upload, **Then** an error message is shown: "Invalid file type or file too large (max 2MB)."
5. **Given** a user selects a non-supported file type (e.g., GIF, BMP), **When** they attempt to upload, **Then** an error message is shown about invalid file type.
6. **Given** a user with a custom avatar, **When** they click the delete/remove avatar control, **Then** the avatar reverts to the default initials display.

---

### User Story 3 - Change Preferences (Language, Page Size, Instrument) (Priority: P2)

A user visits the preferences section to configure their default settings. They change their preferred language between English and Hungarian — the interface immediately switches locale. They set a default page size and default instrument, which will pre-fill future notebook creation forms.

**Why this priority**: Preferences personalize the overall app experience and reduce friction in notebook creation. Important for usability but not blocking core profile functionality.

**Independent Test**: Can be tested by changing the language selector and verifying the UI updates immediately, then changing page size and instrument and verifying they are saved.

**Acceptance Scenarios**:

1. **Given** a user with language set to English, **When** they switch the language to Hungarian, **Then** the UI immediately updates to Hungarian and the preference is saved to the server.
2. **Given** a user with language set to Hungarian, **When** they switch to English, **Then** the UI immediately updates to English and the preference is saved.
3. **Given** a user on the preferences section, **When** they select a default page size (e.g., A4), **Then** the preference is immediately saved to the server and will pre-fill notebook creation.
4. **Given** a user on the preferences section, **When** they select "None" as default page size, **Then** the preference is immediately cleared (set to null) and saved.
5. **Given** a user on the preferences section, **When** they open the default instrument dropdown, **Then** they see a list of available instruments fetched from the system.
6. **Given** a user selects a default instrument, **When** the selection is made, **Then** the preference is immediately saved to the server and will pre-fill notebook creation.

---

### User Story 4 - Account Deletion and Cancellation (Priority: P2)

A user who wants to leave the platform navigates to the account deletion section at the bottom of the profile page. They click "Delete Account," confirm through a dialog, and see a message that their account is scheduled for deletion in 30 days. During the grace period, a warning banner appears persistently across the entire application. The user can cancel the deletion at any time during the 30-day window.

**Why this priority**: Account deletion is a regulatory and trust requirement, but is a rare action. The persistent banner ensures users are always informed about pending deletion, which is critical for preventing accidental data loss.

**Independent Test**: Can be tested by clicking Delete Account, confirming the dialog, verifying the deletion banner appears both on the profile page and globally in the app layout, then canceling the deletion and verifying the banner disappears.

**Acceptance Scenarios**:

1. **Given** a user with no scheduled deletion, **When** they view the account deletion section, **Then** they see a "Delete Account" button styled as a danger action.
2. **Given** a user clicks "Delete Account," **When** the confirmation dialog appears, **Then** it clearly states that the account will be permanently deleted after 30 days.
3. **Given** a user confirms account deletion, **When** the request succeeds, **Then** a success message is shown and the deletion section updates to show the scheduled deletion date and a "Cancel Deletion" button.
4. **Given** a user with a scheduled deletion, **When** they view any page in the app, **Then** a persistent warning banner displays: "Your account is scheduled for deletion on [formatted date]. All your data will be permanently removed." with a link to the profile page (e.g., "Manage") for cancellation.
5. **Given** a user with a scheduled deletion, **When** they click "Cancel Deletion," **Then** the scheduled deletion is canceled, the warning banner disappears from all pages, and the "Delete Account" button reappears.
6. **Given** a user attempts to delete an already-scheduled account, **When** the request is made, **Then** an error message is shown: "Account is already scheduled for deletion."
7. **Given** a user attempts to cancel deletion when none is scheduled, **When** the request is made, **Then** an error message is shown: "No deletion is scheduled."

---

### User Story 5 - View Saved Style Presets (Priority: P3)

A user visits the profile page and scrolls to the presets section to see a read-only list of their saved style presets. This section is informational — full preset management is handled in the Styling feature.

**Why this priority**: This is a display-only section that depends on another feature for full functionality. It provides context but does not enable any critical action on the profile page.

**Independent Test**: Can be tested by navigating to the profile page and verifying the list of saved presets is displayed with their names. No editing or deletion actions should be available in this section.

**Acceptance Scenarios**:

1. **Given** a user with saved style presets, **When** they view the presets section on the profile page, **Then** they see a list of their saved presets by name.
2. **Given** a user with no saved presets, **When** they view the presets section, **Then** they see an empty state message (e.g., "No saved presets yet").

---

### Edge Cases

- What happens when the user's avatar upload fails mid-transfer (e.g., network error)? The previous avatar or initials remain unchanged and an error message is displayed.
- What happens when the instruments list fails to load? The instrument dropdown shows an error state or a retry option; other preferences remain functional.
- What happens when the user changes language but the save request fails? The UI reverts to the previous language and an error message is shown.
- What happens when the profile page is loaded while the user has a scheduled deletion? The deletion warning banner is visible on the profile page and on every other page in the app.
- What happens when the user has no first or last name set (e.g., initial OAuth registration)? The initials avatar gracefully handles missing names (e.g., displays a generic icon or single initial).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the user's profile information (first name, last name, email, avatar) on the profile page.
- **FR-002**: System MUST allow users to edit their first name and last name and save changes. Fields are required, 1-100 characters each, trimmed. A custom in-app confirmation dialog MUST warn users when navigating away with unsaved name changes.
- **FR-003**: System MUST display the email address as read-only (not editable).
- **FR-004**: System MUST display a 96px circular avatar showing either the user's custom image or auto-generated initials (first letter of first name + first letter of last name). If both names are empty, display a generic User icon. If the avatar URL fails to load, fall back to initials.
- **FR-005**: System MUST allow users to upload a custom avatar image (JPG, PNG, or WebP, max 2MB). After file selection, the selected image replaces the avatar inline with Confirm/Cancel buttons below. A loading spinner overlays the avatar during upload.
- **FR-006**: System MUST allow users to remove their custom avatar, showing a confirmation prompt before deletion, then reverting to the initials-based default.
- **FR-007**: System MUST provide a language dropdown selector (English / Hungarian) that immediately updates the application locale via optimistic update and saves the preference. On save failure, the UI reverts to the previous language and shows an error toast. A brief inline checkmark appears next to the selector for ~1.5s to confirm the save.
- **FR-008**: System MUST provide a default page size dropdown selector with options: A4, A5, A6, B5, B6, or None. Selection auto-saves immediately via optimistic update with brief inline checkmark confirmation. On failure, reverts to previous value and shows error toast.
- **FR-009**: System MUST provide a default instrument dropdown selector populated with available instruments from the system, with "None" as the first option. Selection auto-saves immediately via optimistic update with brief inline checkmark confirmation. On failure, reverts to previous value and shows error toast. If the instruments list fails to load, the dropdown shows an error state with a retry option. If the user's saved defaultInstrumentId no longer exists in the list, "None" is shown as selected.
- **FR-010**: System MUST display a "Delete Account" button when no deletion is scheduled.
- **FR-011**: System MUST show a simple confirm/cancel dialog before processing account deletion. Dialog title: "Delete your account?" Body: "Your account and all your data will be permanently deleted after 30 days. You can cancel the deletion at any time during this period." No typed confirmation or password re-entry required.
- **FR-012**: System MUST display a persistent warning banner across all application pages when account deletion is scheduled, showing the deletion date (locale-aware via Intl.DateTimeFormat) and a "Manage" link to the profile page (no direct cancel button on the banner).
- **FR-013**: System MUST allow users to cancel a scheduled account deletion.
- **FR-014**: System MUST display a read-only list of the user's saved style presets as simple rows with subtle borders between items. An empty state message is shown when no presets exist. A "Manage presets" link at the bottom of the section points to the Styling feature (disabled until that feature ships).
- **FR-015**: System MUST handle error responses with user-friendly, localized toast notifications (409 for duplicate deletion, 400 for invalid cancellation, 400 for avatar upload errors). Server-side field validation errors on name fields MUST be mapped to inline form errors via setError.
- **FR-016**: System MUST fetch and cache the user profile on login, and use the language preference to set the application locale and outgoing request headers.

### Key Entities

- **User Profile**: Represents the authenticated user's account. Key attributes: name, email, language preference, default page size, default instrument, avatar, scheduled deletion date.
- **Instrument**: Represents a musical instrument available in the system. Key attributes: identifier, name. Used to populate the default instrument preference.
- **User Saved Preset**: Represents a saved styling preset. Key attributes: name. Displayed as a read-only list on the profile page; managed in a separate feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view and update their profile information (name, avatar) in under 30 seconds.
- **SC-002**: Language switching takes effect immediately (under 1 second perceived delay) without requiring a page reload.
- **SC-003**: Avatar upload provides a preview and completes within 5 seconds on a standard connection.
- **SC-004**: 100% of account deletion requests show a confirmation dialog before proceeding.
- **SC-005**: The deletion warning banner is visible on every page of the application when deletion is scheduled, with zero pages missing the banner.
- **SC-006**: Users can cancel a scheduled deletion in a single click from the profile page.
- **SC-007**: All error states (upload failure, invalid deletion actions, network errors) display clear, localized feedback to the user.
- **SC-008**: Profile data is available immediately after login without additional loading screens on subsequent page navigations.

## Assumptions

- Users are authenticated before accessing the profile page; unauthenticated users are redirected to login.
- The backend enforces the 2MB file size limit and valid image type constraint on avatar uploads; the frontend also validates client-side for a better user experience.
- Instruments are a relatively small, stable list that changes infrequently; caching for 5 minutes is appropriate.
- The deletion grace period (30 days) is enforced entirely by the backend; the frontend displays the scheduled date as provided.
- The presets section is display-only in this feature; full CRUD operations on presets are handled in a separate Styling feature.
- Google OAuth users may already have an avatar from their Google profile; the upload/delete controls work the same way regardless of avatar origin.
- Both English and Hungarian translations are provided for all user-facing text on the profile page and the deletion warning banner.
