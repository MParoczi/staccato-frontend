# Feature Specification: Module Styling System

**Feature Branch**: `007-module-styling-system`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "Build the module styling system — the style editor, preset browser, preset application, and user-saved preset management."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Module Styles per Type (Priority: P1)

A notebook owner opens the style editor from the notebook toolbar and customizes the visual appearance of individual module types. They navigate between module type tabs (e.g., Theory, Practice, Important), adjust colors, borders, and fonts using intuitive controls, see a real-time preview of how the module will look, and save all changes at once.

**Why this priority**: This is the core value proposition — giving users direct control over how each of the 12 module types looks in their notebook. Without this, the entire styling system has no purpose.

**Independent Test**: Can be fully tested by opening the style editor, modifying style properties on any module type tab, confirming the live preview updates, and saving. Delivers immediate visual customization value.

**Acceptance Scenarios**:

1. **Given** a user is viewing their notebook, **When** they click the style editor button in the toolbar, **Then** a style editor panel opens showing 12 module type tabs with the current saved styles loaded.
2. **Given** the style editor is open on the "Theory" tab, **When** the user changes the background color via the color picker, **Then** the live preview within the editor updates immediately to reflect the new color.
3. **Given** the style editor is open on the "Title" tab, **When** the user views the available controls, **Then** only bodyTextColor and fontFamily controls are shown (no background, border, or header controls).
4. **Given** the user has modified styles across multiple tabs, **When** they click "Save", **Then** all 12 module styles are persisted and the changes apply to every module of each type throughout the notebook.
5. **Given** the user modifies a style and clicks "Save", **When** the save completes, **Then** the notebook's modules visually reflect the updated styles without requiring a page refresh.

---

### User Story 2 - Browse and Apply a Preset (Priority: P2)

A notebook owner browses available style presets — both system-provided and user-saved — previews their color schemes via visual thumbnails, and applies a chosen preset to instantly restyle all 12 module types in their notebook.

**Why this priority**: Presets provide the fastest path to a polished notebook appearance. Most users will start by choosing a preset before making fine-grained edits, making this the most common first interaction.

**Independent Test**: Can be fully tested by opening the preset browser, viewing system and user preset thumbnails, clicking "Apply" on a preset, and confirming all 12 module type styles update to match the preset.

**Acceptance Scenarios**:

1. **Given** the style editor is open, **When** the user views the preset browser section, **Then** 5 system presets are displayed as visual thumbnail cards showing representative color schemes.
2. **Given** the user has previously saved custom presets, **When** they view the preset browser, **Then** their user-saved presets appear in a separate section below the system presets.
3. **Given** the user clicks "Apply" on a system preset, **When** the application completes, **Then** all 12 module style tabs refresh to show the preset's styles, and the notebook's modules update visually.
4. **Given** the user applies a preset, **When** viewing any module type tab afterwards, **Then** the style controls show the values from the applied preset.

---

### User Story 3 - Save Current Styles as a Preset (Priority: P3)

A notebook owner who has customized their styles wants to save the current configuration as a reusable preset so they can apply the same look to other notebooks in the future.

**Why this priority**: Saving presets enables cross-notebook consistency and protects the user's customization investment. It depends on the style editor (P1) being functional first.

**Independent Test**: Can be fully tested by customizing styles, clicking "Save as Preset", entering a name, confirming the preset appears in the user presets section, and then applying it to verify it reproduces the saved styles.

**Acceptance Scenarios**:

1. **Given** the user has customized notebook styles, **When** they click "Save as Preset", **Then** a name input dialog appears prompting them for a preset name.
2. **Given** the name input dialog is open, **When** the user enters a unique name and confirms, **Then** the preset is saved and immediately appears in the user-saved presets section.
3. **Given** the user enters a name that already exists, **When** they confirm, **Then** an error message "A preset with this name already exists" is displayed and the dialog remains open for correction.

---

### User Story 4 - Manage User-Saved Presets (Priority: P4)

A notebook owner manages their collection of saved presets by renaming presets to better reflect their purpose or deleting presets they no longer need.

**Why this priority**: Preset management is a housekeeping feature that becomes important as users accumulate presets. It's lower priority than creating and using presets.

**Independent Test**: Can be fully tested by renaming an existing user preset and confirming the new name displays, and by deleting a preset after confirming the deletion prompt.

**Acceptance Scenarios**:

1. **Given** the user has saved presets, **When** they initiate a rename on a preset, **Then** the preset name becomes editable inline.
2. **Given** the user edits a preset name, **When** they confirm the change, **Then** the updated name is persisted and displayed in the preset list.
3. **Given** the user clicks delete on a preset, **When** a confirmation dialog appears and they confirm, **Then** the preset is removed from the list.
4. **Given** the user clicks delete on a preset, **When** the confirmation dialog appears and they cancel, **Then** the preset remains unchanged.

---

### Edge Cases

- What happens when the server fails during a style save? The user should see an error notification and their local edits should be preserved so they can retry.
- What happens when applying a preset fails? The notebook styles should revert to their previous state (rollback the optimistic update) and the user should see an error message.
- What happens when the user has no saved presets? The user-saved presets section should display an empty state message (e.g., "No saved presets yet") rather than an empty blank area.
- What happens when the user opens the style editor on a notebook with no existing custom styles? The editor loads the notebook's current 12 default style records from the server.
- What happens if the user navigates away from the style editor with unsaved changes? Changes are discarded (no unsaved-changes warning needed for this version, since changes are per-session in the editor).
- What happens when two browser tabs edit styles simultaneously? Last-save-wins; no conflict resolution is required for this version.
- What happens when color picker receives an invalid hex value? The input should reject non-hex characters and not apply invalid values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a style editor accessible from the notebook toolbar via a paint brush icon or "Styles" button.
- **FR-002**: System MUST display 12 module type tabs in the style editor: Title, Breadcrumb, Subtitle, Theory, Practice, Example, Important, Tip, Homework, Question, ChordTablature, FreeText.
- **FR-003**: System MUST show only bodyTextColor and fontFamily controls for Title and Subtitle module type tabs.
- **FR-004**: System MUST show all 9 style properties (backgroundColor, borderColor, borderStyle, borderWidth, borderRadius, headerBgColor, headerTextColor, bodyTextColor, fontFamily) for all non-Title/Subtitle module type tabs.
- **FR-005**: System MUST provide color picker controls with a popover containing hex input and curated color swatches for all color properties.
- **FR-006**: System MUST provide a dropdown for borderStyle with options: None, Solid, Dashed, Dotted.
- **FR-007**: System MUST provide a number input for borderWidth constrained to 0–10 px.
- **FR-008**: System MUST provide a number input for borderRadius constrained to 0–20 px.
- **FR-009**: System MUST provide a dropdown for fontFamily with options: Default, Monospace, Serif.
- **FR-010**: System MUST display a live preview of a mock module card reflecting the current style settings for the active module type tab, rendered on a dotted-paper snippet background.
- **FR-011**: System MUST load the notebook's current 12 style records when the style editor opens.
- **FR-012**: System MUST save all 12 module styles in a single operation when the user clicks "Save".
- **FR-013**: System MUST apply optimistic updates so that style changes feel immediate in the notebook after saving.
- **FR-014**: System MUST display 5 system presets as visual thumbnail cards showing representative color schemes in the preset browser.
- **FR-015**: System MUST display user-saved presets in a separate section below system presets.
- **FR-016**: System MUST allow applying any preset to the current notebook, which overwrites all 12 styles at once and refreshes all editor tabs.
- **FR-017**: System MUST allow saving the current notebook's 12 styles as a new user preset with a user-provided name.
- **FR-018**: System MUST display a "A preset with this name already exists" error when the user attempts to save a preset with a duplicate name.
- **FR-019**: System MUST allow renaming a user-saved preset via inline editing.
- **FR-020**: System MUST allow deleting a user-saved preset after a confirmation prompt.
- **FR-021**: System MUST rollback optimistic updates and display an error notification when a server request fails.
- **FR-022**: System MUST validate color hex input to reject non-hex characters.
- **FR-023**: System MUST show an empty state message in the user-saved presets section when no user presets exist.

### Key Entities

- **NotebookModuleStyle**: Represents the visual styling for one module type within a notebook. Key attributes: module type, background color, border color, border style, border width, border radius, header background color, header text color, body text color, font family. A notebook always has exactly 12 of these (one per module type).
- **SystemStylePreset**: A read-only, platform-provided preset containing a complete set of 12 styles. Identified by a preset ID and displayed with a visual thumbnail. There are exactly 5 system presets.
- **UserSavedPreset**: A user-created preset containing a name and 12 style entries. Owned by the user, can be renamed or deleted. Each user's preset names must be unique.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the style editor from the notebook toolbar in under 2 seconds.
- **SC-002**: Live preview updates within 100 milliseconds of any style property change.
- **SC-003**: Users can apply a preset and see all notebook modules update within 3 seconds.
- **SC-004**: Users can complete a full style customization workflow (open editor → modify styles → save) in under 2 minutes.
- **SC-005**: 90% of users can successfully apply a preset on their first attempt without guidance.
- **SC-006**: Saving styles or applying a preset succeeds with visible confirmation on the first attempt under normal conditions.
- **SC-007**: The style editor displays correctly with all 12 module type tabs accessible and navigable.
- **SC-008**: Optimistic updates feel instantaneous — users perceive no delay between clicking "Save" and seeing changes reflected in the notebook.

## Assumptions

- Users have an existing notebook with 12 module style records already provisioned by the server (the server always ensures 12 records exist).
- The notebook toolbar and app shell chrome already exist and provide a mount point for the style editor trigger button.
- The 5 system presets are managed server-side and are read-only from the frontend perspective.
- Color picker swatches will include a curated set of earthy and vibrant colors appropriate for the app's design language; the exact swatch palette will be determined during implementation.
- The style editor opens as a slide-in panel or dialog — the exact presentation pattern will be determined during implementation to best fit the existing app shell layout.
- Unsaved changes in the style editor are discarded if the user closes the editor without saving; no unsaved-changes warning is required for this version.
- No real-time collaboration or conflict resolution is required; last-save-wins is acceptable.
- The existing authentication and notebook access control systems handle permissions — only notebook owners/editors can access the style editor.

