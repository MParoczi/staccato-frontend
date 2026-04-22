# Feature Specification: Module Styling System

**Feature Branch**: `007-module-styling-system`  
**Created**: 2026-04-20  
**Status**: Ready for implementation  
**Input**: User description: "Build the module styling system — the style editor, preset browser, preset application, and user-saved preset management."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Module Styles per Type (Priority: P1)

A notebook owner opens the style editor from the notebook toolbar using an icon-only paint brush trigger with tooltip `Styles` and customizes the visual appearance of individual module types. They navigate between module type tabs in a single horizontal scrollable row, adjust colors, borders, and fonts using intuitive controls, see a real-time preview of how the module will look, and save all changes at once.

**Why this priority**: This is the core value proposition — giving users direct control over how each of the 12 module types looks in their notebook. Without this, the entire styling system has no purpose.

**Independent Test**: Can be fully tested by opening the style editor, modifying style properties on any module type tab, confirming the live preview updates, and saving. Delivers immediate visual customization value.

**Acceptance Scenarios**:

1. **Given** a user is viewing their notebook, **When** they click the paint brush icon in the notebook toolbar, **Then** a right-side style editor drawer opens at approximately 480 px wide and shows the current saved styles for all 12 module types.
2. **Given** the style editor is open on the "Theory" tab, **When** the user changes the background color via the color picker, **Then** the live preview within the editor updates immediately to reflect the new color.
3. **Given** the style editor is open on the "Title" tab, **When** the user views the available controls, **Then** only bodyTextColor and fontFamily controls are shown, and saving from the editor preserves all other server-loaded Title properties unchanged.
4. **Given** the user has modified styles across multiple tabs, **When** they click "Save", **Then** all 12 module styles are persisted and the changes apply to every module of each type throughout the notebook.
5. **Given** the user modifies a style and clicks "Save", **When** the save completes, **Then** the notebook's modules visually reflect the updated styles without requiring a page refresh.
6. **Given** borderStyle is set to "None" for a non-Title/Subtitle module type, **When** the user views the border controls, **Then** borderColor, borderWidth, and borderRadius are disabled until a non-None border style is selected.
7. **Given** the style editor contains unsaved changes, **When** the user continues editing, **Then** the editor shows a subtle unsaved-changes indicator until the changes are saved or discarded.
8. **Given** the style editor is open on desktop, **When** the user navigates with the keyboard, **Then** they can tab through controls and use Enter/Escape for popovers.
9. **Given** the user opens the style editor and the 12 notebook styles are still loading, **When** the drawer appears, **Then** the editor shows loading skeletons for the tab bar, controls, and live preview, and the Save action remains disabled until the styles finish loading.
10. **Given** the user clicks "Save" and the bulk save request is in progress, **When** they continue viewing the drawer, **Then** the editor shows an in-progress state, prevents concurrent Save or Apply actions, and keeps the current form values visible until the request completes.
11. **Given** a style save request fails, **When** the server error is returned, **Then** the editor shows an error toast and preserves the user's unsaved edits so they can retry.
12. **Given** borderWidth is set to `0`, **When** the live preview renders, **Then** the border controls remain visible and enabled, and the preview shows no visible border until the width is increased above `0`.
13. **Given** the user opens a color picker popover, **When** they click a swatch, **Then** the new color value is applied immediately and the popover closes.
14. **Given** the user types a valid hex color into the color picker input, **When** they finish entering the value, **Then** the preview updates to the typed color.
15. **Given** the user types an invalid hex color into the color picker input, **When** the value does not match `#RRGGBB`, **Then** the editor rejects the invalid input and does not apply it to the preview.

---

### User Story 2 - Browse and Apply a Preset (Priority: P2)

A notebook owner browses available style presets — both system-provided and user-saved — previews their color schemes via visual thumbnails, and applies a chosen preset to instantly restyle all 12 module types in their notebook.

**Why this priority**: Presets provide the fastest path to a polished notebook appearance. Most users will start by choosing a preset before making fine-grained edits, making this the most common first interaction.

**Independent Test**: Can be fully tested by opening the preset browser, viewing system and user preset thumbnails, clicking "Apply" on a preset, and confirming all 12 module type styles update to match the preset.

**Acceptance Scenarios**:

1. **Given** the style editor is open, **When** the user views the preset browser section, **Then** 5 system presets are displayed as visual thumbnail cards showing representative color schemes.
2. **Given** the user has previously saved custom presets, **When** they view the preset browser, **Then** their user-saved presets appear in a separate section below the system presets, sorted newest first.
3. **Given** the user clicks "Apply" on a system preset while the editor has no unsaved changes, **When** the application completes, **Then** all 12 module styles are immediately saved to the server (auto-persist with optimistic update), all editor tabs refresh to show the preset's styles, and the notebook's modules update visually.
4. **Given** the user applies a preset, **When** viewing any module type tab afterwards, **Then** the style controls show the values from the applied preset.
5. **Given** the style editor contains unsaved changes, **When** the user clicks "Apply" on a preset, **Then** a confirmation prompt explains that applying the preset will replace the unsaved changes and immediately save the preset values, and the preset is applied only after the user confirms.
6. **Given** the preset browser is still loading system or user presets, **When** the drawer is open, **Then** the relevant preset sections show loading skeletons and Apply actions remain unavailable until their data has loaded.
7. **Given** the user has no saved presets, **When** they view the preset browser, **Then** the system presets still appear normally and the user presets section shows an explicit empty-state message instead of blank space.

---

### User Story 3 - Save Current Styles as a Preset (Priority: P3)

A notebook owner who has customized their styles wants to save the current configuration as a reusable preset so they can apply the same look to other notebooks in the future. User-saved presets are scoped globally per-user — visible and applicable from any notebook the user owns.

**Why this priority**: Saving presets enables cross-notebook consistency and protects the user's customization investment. It depends on the style editor (P1) being functional first.

**Independent Test**: Can be fully tested by customizing styles, clicking "Save as Preset", entering a name, confirming the preset appears in the user presets section, and then applying it to verify it reproduces the saved styles.

**Acceptance Scenarios**:

1. **Given** the user has customized notebook styles, **When** they click "Save as Preset", **Then** a name input dialog appears prompting them for a preset name.
2. **Given** the name input dialog is open, **When** the user enters a unique name and confirms, **Then** the preset is saved and immediately appears in the user-saved presets section.
3. **Given** the user enters a name that already exists, **When** they confirm, **Then** an error message "A preset with this name already exists" is displayed and the dialog remains open for correction.
4. **Given** a user preset name exceeds the visible card width, **When** it is rendered in the preset list, **Then** the name is truncated to a single line with an ellipsis and the full name remains available on hover or focus.
5. **Given** the current notebook styles are identical to an existing user preset, **When** the user enters a different unique preset name and confirms "Save as Preset", **Then** the system saves a separate new preset instead of blocking the action.

---

### User Story 4 - Manage User-Saved Presets (Priority: P4)

A notebook owner manages their collection of saved presets by renaming presets to better reflect their purpose or deleting presets they no longer need.

**Why this priority**: Preset management is a housekeeping feature that becomes important as users accumulate presets. It's lower priority than creating and using presets.

**Independent Test**: Can be fully tested by renaming an existing user preset and confirming the new name displays, and by deleting a preset after confirming the deletion prompt.

**Acceptance Scenarios**:

1. **Given** the user has saved presets, **When** they click the preset card's pencil icon, **Then** the preset name becomes editable inline.
2. **Given** the user edits a preset name, **When** they press Enter or move focus away after entering a unique new name, **Then** the updated name is persisted and displayed in the preset list.
3. **Given** the user edits a preset name, **When** they confirm a name already used by another one of their presets, **Then** an inline error message `A preset with this name already exists` is displayed and the rename remains uncommitted.
4. **Given** the user edits a preset name inline, **When** they press Escape before committing, **Then** the rename is cancelled and the previous preset name remains unchanged.
5. **Given** the user clicks delete on a preset, **When** a confirmation dialog appears and they confirm, **Then** the preset is removed from the list.
6. **Given** the user clicks delete on a preset, **When** the confirmation dialog appears and they cancel, **Then** the preset remains unchanged.

---

### Edge Cases

- What happens when the server fails during a style save? The user should see an error notification and their local edits should be preserved so they can retry.
- What happens when applying a preset fails? The notebook styles should revert to their previous state (rollback the optimistic update) and the user should see an error message.
- What happens when the user has no saved presets? The user-saved presets section should display an empty state message (e.g., "No saved presets yet") rather than an empty blank area.
- What happens when the user opens the style editor on a notebook with no existing custom styles? The editor loads the notebook's current 12 default style records from the server.
- What happens if the user navigates away from the style editor with unsaved changes? Changes are discarded when the editor closes, no confirmation dialog is shown in this version, and the subtle unsaved-changes indicator disappears.
- What happens when the user applies a preset while the form has unsaved changes? A confirmation prompt must appear before the preset replaces local edits and auto-persists.
- What happens when Title or Subtitle styles are saved after editing only their visible controls? All hidden properties remain unchanged from the server-loaded values.
- What happens when the user rapidly switches between module type tabs? The live preview follows last-tab-wins behavior and only the final active tab's state is rendered.
- What happens when the color picker popover would overflow the screen edge? The popover must shift or flip so its full contents remain visible inside the viewport.
- What happens when a system preset changes on the server while the drawer is already open? No live mid-session preset refresh is required in this version; updated system presets appear on the next refetch or next drawer open.
- What happens when two browser tabs edit styles simultaneously? Last-save-wins; no conflict resolution is required for this version.
- What happens when color picker receives an invalid hex value? The input should reject non-hex characters and not apply invalid values.
- What happens when the user has reached the maximum of 20 saved presets and tries to save another? The "Save as Preset" button should be disabled or show a message: "Preset limit reached (20). Delete an existing preset to save a new one."
- What happens when the current notebook styles are identical to an existing preset? Saving as a preset is still allowed if the user provides a different unique preset name; duplicate detection is name-based only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a style editor accessible from the notebook toolbar via an icon-only paint brush button with tooltip `Styles`.
- **FR-002**: System MUST open the style editor as a desktop-only right-side slide-in drawer approximately 480 px wide.
- **FR-003**: System MUST display 12 module type tabs in the style editor: Title, Breadcrumb, Subtitle, Theory, Practice, Example, Important, Tip, Homework, Question, ChordTablature, FreeText.
- **FR-004**: System MUST render the 12 module type tabs in a single horizontal scrollable row.
- **FR-005**: System MUST show only bodyTextColor and fontFamily controls for Title and Subtitle module type tabs.
- **FR-006**: System MUST preserve all hidden Title and Subtitle properties from the server-loaded values unchanged when the user saves from those tabs.
- **FR-007**: System MUST show all 9 style properties (backgroundColor, borderColor, borderStyle, borderWidth, borderRadius, headerBgColor, headerTextColor, bodyTextColor, fontFamily) for all non-Title/Subtitle module type tabs.
- **FR-008**: System MUST provide color picker controls with a popover containing hex input and curated color swatches for all color properties.
- **FR-009**: System MUST provide a dropdown for borderStyle with options: None, Solid, Dashed, Dotted.
- **FR-010**: System MUST disable borderColor, borderWidth, and borderRadius controls whenever borderStyle is set to `None`.
- **FR-011**: System MUST provide a number input for borderWidth constrained to 0–10 px.
- **FR-012**: System MUST provide a number input for borderRadius constrained to 0–20 px.
- **FR-013**: System MUST provide a dropdown for fontFamily with options: Default, Monospace, Serif.
- **FR-014**: System MUST support basic keyboard navigation within the desktop editor: Tab/Shift+Tab through controls, Enter for popover interaction, and Escape to close popovers.
- **FR-015**: System MUST display a live preview of a mock module card reflecting the current style settings for the active module type tab, rendered on a dotted-paper snippet background.
- **FR-016**: System MUST load the notebook's current 12 server-provisioned style records when the style editor opens, and the frontend MUST NOT generate fallback style records client-side.
- **FR-017**: System MUST save all 12 module styles in a single operation when the user clicks "Save".
- **FR-018**: System MUST apply optimistic updates so that style changes feel immediate in the notebook after saving.
- **FR-019**: System MUST display 5 system presets as visual thumbnail cards with color swatches rendered client-side from the preset's 12 style entries (no pre-generated images).
- **FR-020**: System MUST display user-saved presets (scoped globally per-user, across all notebooks) in a separate section below system presets, preserving the newest-first order returned by `GET /users/me/presets`.
- **FR-021**: System MUST allow applying any preset to the current notebook, which overwrites all 12 styles at once, immediately auto-persists the changes to the server with an optimistic update to the notebook, and refreshes all editor tabs. No separate "Save" click is required after applying a preset.
- **FR-022**: System MUST require a confirmation step before applying a preset when the editor contains unsaved changes because the preset application replaces the local edits and auto-persists immediately.
- **FR-023**: System MUST allow saving the current notebook's 12 styles as a new globally-scoped user preset with a user-provided name, even when the styles are identical to an existing preset, as long as the name is unique.
- **FR-024**: System MUST display an inline error message `A preset with this name already exists` when the user attempts to save a preset with a duplicate name (checked against all of the user's presets globally).
- **FR-025**: System MUST allow renaming a user-saved preset via inline editing initiated from a pencil icon, committing on Enter or blur and cancelling on Escape.
- **FR-026**: System MUST display an inline error message `A preset with this name already exists` when the user attempts to rename a preset to a duplicate user preset name.
- **FR-027**: System MUST allow deleting a user-saved preset after a confirmation prompt.
- **FR-028**: System MUST rollback optimistic updates and display an error notification when a server request fails.
- **FR-029**: System MUST validate color hex input to reject non-hex characters.
- **FR-030**: System MUST show an empty state message in the user-saved presets section when no user presets exist.
- **FR-031**: System MUST enforce a maximum of 20 user-saved presets per user. When the limit is reached, the "Save as Preset" action must be blocked with a message indicating the limit.
- **FR-032**: System MUST show a subtle unsaved-changes indicator whenever the editor contains local modifications that have not yet been saved or discarded.
- **FR-033**: System MUST show a loading state when notebook styles are being fetched on drawer open, including skeleton placeholders for tabs, controls, and live preview, and MUST disable Save until the initial 12 styles finish loading.
- **FR-034**: System MUST show independent loading states for the system presets section and user presets section while their data is being fetched, and MUST keep Apply actions disabled for any preset data that has not loaded yet.
- **FR-035**: System MUST render the curated color swatch palette as an evenly spaced 6×4 grid of approximately 24 swatches, grouped into neutrals, earthy tones, and vibrant accents.
- **FR-036**: System MUST render the live preview inside a fixed preview region centered within the drawer, with a mock module card approximately 320 px wide by 180 px tall so both header and body styling remain visible.
- **FR-037**: System MUST render the dotted-paper preview background as an off-white surface with subtle light-gray dots approximately 2 px in diameter spaced about 12 px apart.
- **FR-038**: System MUST animate the drawer using the app-standard right-side slide-in transition with a matching backdrop fade, targeting an approximately 200 ms open and close duration, and MUST allow closing via backdrop click or Escape.
- **FR-039**: System MUST provide operation feedback using brief success toasts for successful style save, preset apply, preset create, preset rename, and preset delete actions, while reserving inline messages for field-level validation errors.
- **FR-040**: System MUST map `Default` font family to the app's sans-serif stack (`font-sans` with system sans-serif fallbacks), while `Monospace` maps to `font-mono` and `Serif` maps to `font-serif`.
- **FR-041**: System MUST display server or mutation failures for this feature as destructive toasts in the app's standard toast stack, auto-dismissing after about 5 seconds and allowing manual dismissal.
- **FR-042**: System MUST block concurrent Save and Apply operations while a style save or preset apply request is already in progress, while keeping the drawer contents visible in a pending state.
- **FR-043**: System MUST treat system presets as static for the duration of an open editor session; mid-session background changes do not need to live-update the open preset browser.
- **FR-044**: System MUST keep border controls visible and enabled when `borderWidth` is `0`; the effective border simply renders with zero visible width until the user increases the value.
- **FR-045**: System MUST render user preset names as a single line with ellipsis truncation when they exceed the available card width and MUST expose the full name on hover or keyboard focus.
- **FR-046**: System MUST ensure rapid module-tab changes are safe by rendering the live preview according to the most recently active tab only.
- **FR-047**: System MUST keep color picker popovers fully visible within the viewport by shifting or flipping their placement when opened near screen edges.
- **FR-048**: System MUST open and close the color picker popover within approximately 150 milliseconds on supported target browsers.
- **FR-049**: System MUST treat notebook styles as immediately stale after mutation or focus changes, while system presets may be cached for up to 5 minutes because they are low-churn reference data.
- **FR-050**: System MUST route all user-facing strings for the styling feature through the existing internationalization system.
- **FR-051**: System MUST support the styling feature on the latest two desktop versions of Chrome, Firefox, Safari, and Edge.
- **FR-052**: System MUST use the following backend contracts for this feature: `GET /notebooks/{id}/styles`, `PUT /notebooks/{id}/styles`, `POST /notebooks/{id}/styles/apply-preset/{presetId}`, `GET /presets`, `GET /users/me/presets`, `POST /users/me/presets`, `PUT /users/me/presets/{id}`, and `DELETE /users/me/presets/{id}`.

**Traceability Note**: `FR-###` and `SC-###` identifiers are the only normative requirement IDs in this specification. User stories, acceptance scenarios, and edge cases are descriptive and intentionally do not use separate numeric IDs.

### Key Entities

- **NotebookModuleStyle**: Represents the visual styling for one module type within a notebook. Key attributes: module type, background color, border color, border style, border width, border radius, header background color, header text color, body text color, font family. A notebook always has exactly 12 of these (one per module type), provisioned by the backend.
- **SystemStylePreset**: A read-only, platform-provided preset containing a complete set of 12 styles. Identified by a preset ID. Thumbnail is rendered client-side from the preset's style data (color swatches generated dynamically). There are exactly 5 system presets.
- **UserSavedPreset**: A user-created preset containing a name and 12 style entries. Owned by the user and scoped globally per-user — visible and applicable from any notebook the user owns. Thumbnail is rendered client-side from the stored style data. User presets are displayed newest first. Can be renamed or deleted. Each user's preset names must be unique across all their presets (global uniqueness per user), but multiple presets may reuse identical style values if their names differ. Maximum 20 presets per user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the style editor from the notebook toolbar in under 2 seconds.
- **SC-002**: Live preview updates within 100 milliseconds of any style property change.
- **SC-003**: Users can apply a preset and see all notebook modules update within 3 seconds.
- **SC-004**: Users can complete a full style customization workflow (open editor → modify styles → save) in under 2 minutes.
- **SC-005**: In QA or UAT walkthroughs, at least 9 of 10 first-attempt preset applications succeed without facilitator intervention.
- **SC-006**: Saving styles or applying a preset succeeds with visible confirmation on the first attempt under normal conditions.
- **SC-007**: The desktop style editor displays correctly with all 12 module type tabs accessible in a single horizontal scrollable row and basic keyboard navigation working via Tab/Shift+Tab and Enter/Escape for popovers.
- **SC-008**: Optimistic updates feel instantaneous — users perceive no delay between clicking "Save" and seeing changes reflected in the notebook.

## Assumptions

- The backend contract guarantees that every notebook style fetch returns exactly 12 provisioned module style records (one per module type), so the frontend does not generate fallback records.
- The notebook toolbar and app shell chrome already exist and provide a mount point for the style editor trigger button.
- The 5 system presets are managed server-side and are read-only from the frontend perspective.
- User-saved presets are scoped globally per-user; a preset saved from one notebook is visible and applicable in all notebooks the user owns.
- Color picker swatches will include a curated set of earthy and vibrant colors appropriate for the app's design language; the exact swatch palette will be determined during implementation.
- The style editor opens as a desktop-only right-side slide-in drawer, approximately 480 px wide, that coexists alongside the notebook content so users can see their notebook while editing styles.
- Unsaved changes in the style editor are discarded if the user closes the editor without saving; no unsaved-changes confirmation is required for this version, but a subtle unsaved-changes indicator is shown while edits remain local.
- No real-time collaboration or conflict resolution is required; last-save-wins is acceptable.
- The existing authentication and notebook access control systems handle permissions — only notebook owners/editors can access the style editor.
- The 250-line component size guideline remains an implementation-plan constraint rather than a user-facing product requirement.

## Clarifications

### Session 2025-07-17

- Q: What is the scope of user-saved presets — global per-user (visible from any notebook) or per-notebook? → A: Global per-user — visible and applicable from any notebook the user owns.
- Q: What is the maximum number of user-saved presets allowed per user? → A: 20 presets maximum per user.
- Q: How are preset thumbnails rendered — client-side from style data or as pre-generated static images? → A: Client-side rendered dynamically from the 12 stored style entries (generate color swatches from style data).
- Q: What container type should the style editor use — a slide-in panel (drawer), a modal dialog, or a full-page view? → A: Slide-in side panel (drawer) that coexists alongside the notebook.
- Q: What should happen when a user applies a preset — auto-persist immediately to the server, or stage in the editor requiring a manual "Save"? → A: Auto-persist with optimistic update — applying a preset immediately saves all 12 styles to the server. No separate save step required.

### Session 2026-04-21

- Q: What accessibility and responsive behavior is required for the style editor in this feature? → A: Basic keyboard navigation only (Tab through controls, Enter/Escape for popovers); desktop-only drawer for now with no mobile-specific layout.
- Q: How should the module type tabs be laid out? → A: A single horizontal scrollable row.
- Q: Where should the drawer appear and how wide should it be? → A: Right side, approximately 480 px wide.
- Q: What should happen if a user applies a preset while the form has unsaved changes? → A: Show a confirmation first because applying a preset auto-persists and replaces the unsaved changes.
- Q: What happens to hidden Title and Subtitle properties when the user saves from those tabs? → A: Preserve the existing server-loaded values unchanged.
- Q: What should happen when borderStyle is set to None? → A: Disable the borderWidth, borderRadius, and borderColor controls.
- Q: Should the editor show a dirty-state visual indicator? → A: Yes — show a subtle unsaved-changes indicator.
- Q: What should the toolbar trigger look like? → A: Paint brush icon only, with tooltip `Styles`.
- Q: How should user-saved presets be sorted? → A: Newest first.
- Q: What should happen when renaming a preset to a duplicate name? → A: Show the inline error `A preset with this name already exists`.
- Q: How should SC-005 be measured without a usability-study dependency? → A: Use a QA/UAT proxy metric: at least 9 of 10 first-attempt preset applications succeed without facilitator intervention.
- Q: How should inline preset rename work? → A: Start from a pencil icon; confirm with Enter or blur; cancel with Escape.
- Q: What should happen when saving a preset whose styles are identical to an existing preset? → A: Allow the save as a separate preset if the new preset name is unique.
- Q: What backend guarantee applies to notebook style fetches? → A: Every fetch returns exactly 12 provisioned style records, so the frontend does not generate fallback records.
