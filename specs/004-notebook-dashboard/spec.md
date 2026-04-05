# Feature Specification: Notebook Dashboard

**Feature Branch**: `004-notebook-dashboard`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "Notebook Dashboard — Build the main dashboard page where users view, create, and delete their notebooks."

## Clarifications

### Session 2026-04-04

- Q: Wizard navigation & close behavior? → A: Back button on Step 2 preserves entered data; closing the dialog at any point discards silently (no confirmation needed).
- Q: Sort preference persistence? → A: Reset to "last updated" (default) on each page visit; sort selection is not persisted across sessions.
- Q: Delete trigger widget? → A: Three-dot overflow menu on each card; "Delete" as a menu item. Keeps card surface clean and scales for future actions.
- Q: Default cover color selection? → A: Leather brown pre-selected as default. Classic notebook aesthetic, anchors the earthy design language.
- Q: Dashboard loading state? → A: Skeleton card placeholders (gray shimmer shapes matching card layout) while notebooks load.

### Session 2026-04-05 (Checklist-driven)

- Q: Create notebook trigger? → A: Both a "Create Notebook" button in the page header AND a dashed-border add card as the last item in the grid. Two entry points for maximum discoverability.
- Q: Card coverColor layout? → A: Top stripe (~35-40% of card height) filled with coverColor. Title and metadata sit below on a warm white surface.
- Q: Preset count if API returns >5? → A: Show first 5 sorted by displayOrder. Frontend caps at 5 to keep the wizard compact.
- Q: Page size selector labels? → A: Grid dimensions from PAGE_SIZE_DIMENSIONS (e.g., "A4 — 42 × 59 grid"). Directly meaningful for the notebook editor.
- Q: Long title truncation on cards? → A: Truncate with ellipsis after 2 lines. Max 200 chars stored but card shows truncated.
- Q: Lesson count when zero? → A: Display "0 lessons" (not hidden).
- Q: Date display format? → A: Absolute dates via Intl.DateTimeFormat with user locale. No relative dates.
- Q: Card click vs menu click? → A: Three-dot menu click stops event propagation; clicking the menu does not navigate.
- Q: Skeleton count during loading? → A: Show 6 skeleton cards as placeholder (matches a typical 3×2 grid).
- Q: Wizard loading state for instruments/presets? → A: Show inline skeleton/spinner inside the dialog fields while data is fetching. Disable "Next" until instruments load.
- Q: Submit button during API call? → A: Disabled with a loading spinner. Re-enabled on error.
- Q: Creation failure (POST /notebooks)? → A: Show error toast. Dialog stays open; form data preserved. User can retry.
- Q: Custom hex input — 3-digit shorthand? → A: Reject. Only 6-digit hex (with or without #) accepted.
- Q: Hex input validation feedback? → A: Inline error message below the input field.
- Q: Deletion error notification format? → A: Toast notification (consistent with other feature error patterns).
- Q: Double-click prevention on confirm buttons? → A: Confirm/submit buttons disabled while mutation is pending.
- Q: Form state on wizard reopen? → A: Fresh/reset form every time the dialog opens. React Hook Form resets on dialog mount.
- Q: Browser back from /app/notebooks/new? → A: Browser navigates away from the dashboard; dialog closes naturally via route change.
- Q: Duplicate notebook titles? → A: Allowed. No uniqueness constraint on titles.
- Q: Invalid/missing coverColor on existing cards? → A: Fallback to default leather brown (#8B4513).
- Q: Long instrument names on cards? → A: Truncate with ellipsis if too long for the card width.
- Q: Keyboard navigation? → A: Tab through cards, Enter/Space to open. shadcn components provide built-in keyboard support for menus, dialogs, selects, and popovers.
- Q: Focus management for dialogs? → A: shadcn Dialog provides built-in focus trap and return-focus-on-close.
- Q: Cover color accessibility? → A: Each color swatch has an aria-label with the localized color name.
- Q: Reduced motion preference? → A: Hover animations respect prefers-reduced-motion media query.
- Q: Touch target sizes? → A: Minimum 44px for all interactive elements on mobile.
- Q: Pluralization in i18n? → A: react-i18next ICU pluralization for lesson count and other countable strings.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Notebook Collection (Priority: P1)

A logged-in user navigates to the dashboard at `/app/notebooks` — the application's home screen. They see their collection of notebooks displayed as visual cards in a responsive grid layout. Each card evokes a physical notebook cover: the user's chosen cover color fills a prominent area, with the notebook title, instrument name, page size badge, lesson count, and last-updated date displayed on a warm surface. The user can sort their collection by last updated (default), creation date, or title alphabetically. If the user has no notebooks yet, they see a warm, inviting empty state with an encouraging message and a single call-to-action to create their first notebook.

**Why this priority**: The notebook list is the primary surface of the entire application. Without it, users cannot discover, access, or manage their work. Every other dashboard action depends on this view existing.

**Independent Test**: Can be fully tested by navigating to `/app/notebooks` with existing notebook data, verifying all card fields render correctly, testing sort options, and verifying the empty state when no notebooks exist. Delivers the core value of organizing and accessing the user's notebook library.

**Acceptance Scenarios**:

1. **Given** a logged-in user with multiple notebooks, **When** they navigate to `/app/notebooks`, **Then** they see a responsive grid of notebook cards, each showing cover color, title, instrument name, page size badge, lesson count, and last-updated date.
2. **Given** a user on the dashboard, **When** they click a notebook card, **Then** they are navigated to `/app/notebooks/:id` (notebook cover view).
3. **Given** a user on the dashboard with the default sort, **When** the page loads, **Then** notebooks are ordered by last-updated date (most recent first).
4. **Given** a user on the dashboard, **When** they change the sort to "Title (A–Z)", **Then** notebooks re-order alphabetically by title.
5. **Given** a user on the dashboard, **When** they change the sort to "Created date", **Then** notebooks re-order by creation date (newest first).
6. **Given** a logged-in user with no notebooks, **When** they navigate to `/app/notebooks`, **Then** they see an empty state with an illustration, the message "No notebooks yet. Create your first notebook!", and a single button to create a notebook.
7. **Given** a user viewing the dashboard on a narrow screen, **When** they resize the browser, **Then** the card grid adapts responsively (fewer columns on smaller viewports).
8. **Given** a logged-in user, **When** they navigate to `/app/notebooks` and data is loading, **Then** they see skeleton card placeholders (gray shimmer shapes matching the card layout) until the notebooks are loaded.

---

### User Story 2 - Create a New Notebook (Priority: P1)

A user wants to create a new notebook. They click the "Create Notebook" button (or the dashed-border add card in the grid) or navigate directly to `/app/notebooks/new`. A dialog opens with a clean multi-step wizard. In Step 1 (Basics), the user enters a title (required, max 200 characters), selects an instrument from a dropdown populated with available instruments, and picks a page size from a visual selector displaying paper formats (A4, A5, A6, B5, B6) with their physical dimension labels at correct aspect ratios. The instrument and page size fields are pre-filled from the user's profile defaults if set. A clear warning states that instrument and page size cannot be changed after creation.

In Step 2 (Appearance), the user picks a cover color from a curated palette of earthy/rich book-cover colors (leather brown, navy, forest green, burgundy, etc.) with an option for custom hex input. Leather brown is pre-selected as the default. They may also select a style preset from up to 5 system presets shown as visual thumbnails. If no preset is selected, "Colorful" is applied as the default.

On submission, the notebook is created and the user is redirected to the new notebook's cover view.

**Why this priority**: Creating notebooks is the gateway to all content creation in the application. Without this, the dashboard is read-only and the product cannot grow.

**Independent Test**: Can be fully tested by opening the create dialog, completing both steps with valid data, submitting, and verifying the notebook appears in the list and the redirect occurs. Also test validation errors (empty title, no instrument, no page size) and profile default pre-filling.

**Acceptance Scenarios**:

1. **Given** a user on the dashboard, **When** they click "Create Notebook" (button or add card), **Then** a dialog opens with the notebook creation wizard at Step 1 (Basics).
2. **Given** a user on Step 1, **When** they leave the title empty and attempt to proceed, **Then** a validation error indicates the title is required.
3. **Given** a user on Step 1, **When** they type a title exceeding 200 characters, **Then** the input is limited to 200 characters or a validation error is shown.
4. **Given** a user on Step 1, **When** the page loads, **Then** the instrument dropdown is populated with instruments from the system and the page size selector shows A4, A5, A6, B5, B6 with physical dimension labels.
5. **Given** a user whose profile has default instrument and page size set, **When** they open the creation wizard, **Then** the instrument and page size are pre-filled with those defaults.
6. **Given** a user on Step 1, **When** they view the instrument and page size fields, **Then** a visible warning reads "These cannot be changed later."
7. **Given** a user who has completed Step 1 with valid data, **When** they proceed to Step 2, **Then** they see a cover color picker (curated palette + custom hex input) and a style preset selector showing system presets as visual thumbnails.
8. **Given** a user on Step 2, **When** they click the Back button, **Then** they return to Step 1 with all previously entered data preserved.
9. **Given** a user on any step of the wizard, **When** they close the dialog (X button or overlay click), **Then** the dialog closes and all entered data is discarded silently (no confirmation prompt).
10. **Given** a user on Step 2 who does not select any style preset, **When** they submit the form, **Then** the "Colorful" preset is applied as the default style.
11. **Given** a user who has completed all required fields, **When** they submit the form, **Then** a new notebook is created and the user is redirected to `/app/notebooks/:id`.
12. **Given** a user who navigates directly to `/app/notebooks/new`, **When** the page loads, **Then** the creation wizard opens (same behavior as the button-triggered dialog).

---

### User Story 3 - Delete a Notebook (Priority: P2)

A user decides to delete a notebook they no longer need. From the dashboard, they click the three-dot overflow menu on the notebook card and select "Delete." A confirmation dialog appears with the notebook's title and a clear warning: "Delete [notebook title]? This will permanently delete all lessons and content. This action cannot be undone." On confirmation, the notebook is immediately removed from the grid (optimistic update). If the deletion fails on the server, the notebook reappears with an error notification.

**Why this priority**: Deletion is essential for collection management but is secondary to viewing and creating. Users need to be able to clean up their library, but this is a less frequent action than browsing or creating.

**Independent Test**: Can be fully tested by triggering delete on a notebook card, verifying the confirmation dialog text, confirming, and verifying the card is removed. Also test cancellation (card remains) and server error rollback.

**Acceptance Scenarios**:

1. **Given** a user on the dashboard, **When** they click the three-dot menu on a notebook card and select "Delete", **Then** a confirmation dialog appears with the text "Delete [notebook title]? This will permanently delete all lessons and content. This action cannot be undone."
2. **Given** a user viewing the deletion confirmation dialog, **When** they confirm the deletion, **Then** the notebook card is immediately removed from the grid (optimistic update) and a deletion request is sent to the server.
3. **Given** a user viewing the deletion confirmation dialog, **When** they cancel, **Then** the dialog closes and the notebook remains unchanged.
4. **Given** a notebook deletion that fails on the server, **When** the error response is received, **Then** the notebook card reappears in the grid and an error notification is shown to the user.

---

### Edge Cases

- What happens when the instruments list fails to load during notebook creation? → The instrument dropdown shows an error state with a retry option; the user cannot proceed to submit without selecting an instrument.
- What happens when a user tries to create a notebook with a title that is only whitespace? → Validation treats whitespace-only titles as empty and shows the "title required" error.
- What happens when two browser tabs are open and a notebook is deleted in one? → The other tab shows stale data until the next page load or refetch; no real-time sync is required.
- What happens when the style presets endpoint fails to load? → The preset selector shows a fallback message; the user can still create a notebook with just a cover color (the "Colorful" default is applied without a visual selection).
- What happens when the cover color picker receives an invalid hex value? → Input validation prevents submission of malformed hex values; only valid 6-digit hex codes (with or without #) are accepted.
- What happens when a user's profile default instrument no longer exists in the instruments list? → The instrument field falls back to unselected and the user must choose one manually.
- What happens when the notebook list fails to load? → The skeleton placeholders are replaced with an error message and a retry button.
- What happens when a notebook has an invalid or missing coverColor? → The card falls back to the default leather brown (#8B4513).
- What happens when both instruments and presets fail to load simultaneously in the wizard? → Instrument dropdown shows error with retry; preset selector shows fallback message. User cannot proceed past Step 1 without a valid instrument selection.
- What happens when the user double-clicks the submit or confirm button? → Buttons are disabled while the mutation is pending, preventing duplicate API calls.
- What happens when notebook creation (POST /notebooks) fails? → An error toast is shown. The dialog stays open with form data preserved so the user can retry.
- What happens when a notebook title or instrument name is very long on the card? → Titles truncate with ellipsis after 2 lines. Instrument names truncate with ellipsis if they exceed the available card width.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the user's notebooks as cards in a responsive grid on the `/app/notebooks` page.
- **FR-002**: While notebooks are loading, the dashboard MUST display skeleton card placeholders (gray shimmer shapes matching the card layout) to indicate content is being fetched.
- **FR-003**: Each notebook card MUST show the notebook's cover color, title, instrument name, page size badge, lesson count, and last-updated date.
- **FR-004**: Each notebook card MUST be clickable and navigate to `/app/notebooks/:id`.
- **FR-005**: System MUST display an empty state with an illustration, encouraging message, and a create-notebook call-to-action when the user has no notebooks.
- **FR-006**: System MUST support sorting notebooks by last-updated date (default), creation date, and title (alphabetical). The sort selection resets to the default on each page visit and is not persisted across sessions.
- **FR-007**: Notebook cards MUST visually evoke a physical notebook cover. The coverColor fills a top stripe (~35-40% of card height). Title and metadata are displayed below on a warm white surface. Long titles truncate with ellipsis after 2 lines.
- **FR-008**: Notebook cards MUST display a hover effect (subtle lift shadow and slight scale) for interactivity feedback.
- **FR-009**: System MUST provide a notebook creation flow accessible via a "Create Notebook" button in the page header, a dashed-border add card as the last item in the grid, and via the `/app/notebooks/new` route.
- **FR-010**: The creation wizard MUST collect: title (required, max 200 characters), instrument (required, from system instrument list), and page size (required, visual selector showing A4/A5/A6/B5/B6 with grid dimension subtitles, e.g., "A4 — 42 × 59 grid").
- **FR-011**: The creation wizard MUST provide a Back button on Step 2 that returns to Step 1 with all entered data preserved. Closing the dialog at any step MUST discard form data silently without a confirmation prompt.
- **FR-012**: The creation wizard MUST display a clear warning that instrument and page size cannot be changed after creation.
- **FR-013**: The creation wizard MUST pre-fill instrument and page size from the user's profile defaults (defaultInstrumentId, defaultPageSize) when available.
- **FR-014**: The creation wizard MUST provide a cover color picker with a curated palette of earthy/rich book-cover colors and a custom hex input option. Leather brown MUST be pre-selected as the default.
- **FR-015**: The creation wizard MUST display up to 5 system style presets (sorted by displayOrder, capped at 5) as visual thumbnails for optional selection.
- **FR-016**: If no style preset is selected during creation, the system MUST apply "Colorful" as the default style.
- **FR-017**: On successful notebook creation, the system MUST redirect the user to the new notebook's page at `/app/notebooks/:id`.
- **FR-018**: Each notebook card MUST have a three-dot overflow menu containing a "Delete" action that triggers a confirmation dialog.
- **FR-019**: The deletion confirmation dialog MUST display: "Delete [notebook title]? This will permanently delete all lessons and content. This action cannot be undone."
- **FR-020**: On confirmed deletion, the system MUST remove the notebook card immediately (optimistic update) and revert if the server request fails.
- **FR-021**: All user-facing strings MUST be localized. Date formatting MUST follow the user's locale (e.g., "March 15, 2026" for English, "2026. március 15." for Hungarian).

### Key Entities

- **Notebook (Summary)**: Represents a notebook in the list view. Key attributes: unique identifier, title, cover color (hex), instrument reference, page size, lesson count, creation date, last-updated date.
- **Notebook (Detail)**: Full notebook representation returned after creation. Includes all summary fields plus styles and full content references.
- **Instrument**: A musical instrument that a notebook is associated with. Key attributes: unique identifier, name. The instruments list is public and cacheable.
- **System Style Preset**: A predefined visual style that can be applied to a notebook at creation. Key attributes: unique identifier, name, visual preview/thumbnail. The presets list is public.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their full notebook collection on a single dashboard page without navigating multiple screens.
- **SC-002**: Users can create a new notebook from scratch — including selecting instrument, page size, cover color, and optional style preset — in under 2 minutes.
- **SC-003**: Users can locate a specific notebook by using sort controls within 10 seconds, regardless of collection size up to 100 notebooks.
- **SC-004**: Users can delete a notebook and see it removed from the dashboard within 1 second of confirming deletion (optimistic update).
- **SC-005**: 90% of first-time users can successfully create their first notebook without external guidance, guided by the empty state and intuitive creation wizard.
- **SC-006**: The dashboard feels spacious, organized, and inviting — users perceive it as the polished home screen of the application, not a utilitarian list.
- **SC-007**: All text on the dashboard is displayed in the user's selected language, and dates are formatted according to the user's locale conventions.

## Assumptions

- Users are authenticated before accessing the dashboard; the authentication system from feature 002 is in place.
- The user profile (feature 003) provides `defaultInstrumentId` and `defaultPageSize` fields that can be read to pre-fill the creation wizard.
- The backend endpoints (GET /notebooks, POST /notebooks, DELETE /notebooks/{id}, GET /instruments, GET /presets) are available and follow standard REST conventions with JSON responses.
- The instruments and presets lists are relatively small (tens of items, not thousands) and can be fetched in full without pagination.
- Notebook list pagination is not needed in v1 — the dashboard displays all notebooks. If the user accumulates more than 100 notebooks, this may need revisiting.
- The "Colorful" default preset is a well-known identifier in the presets system; if no preset matches "Colorful," the system omits the styles field from the creation request.
- Real-time synchronization across tabs/devices is out of scope; the dashboard reflects data as of the last fetch.
- The notebook cover view page (`/app/notebooks/:id`) is part of a separate feature; this feature only handles navigation to that route.
