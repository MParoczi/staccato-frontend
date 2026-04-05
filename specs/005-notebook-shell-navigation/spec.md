# Feature Specification: Notebook Shell & Navigation

**Feature Branch**: `005-notebook-shell-navigation`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "Notebook Shell & Navigation — Build the notebook view, the 'book' metaphor container that houses the cover page, index page, and lesson pages. This is the main workspace of the application."

## Clarifications

### Session 2026-04-05

- Q: Canvas area and page size relationship? → A: Fixed aspect ratio matching the notebook's page size (e.g., A4 portrait), centered in the viewport, scrollable/zoomable. The canvas renders as a virtual sheet of paper inside the viewport.
- Q: Sidebar close behavior on lesson navigation? → A: Sidebar stays open after clicking a lesson entry; user closes it manually via the toggle button. This allows quick multi-lesson jumping without reopening.

### Session 2026-04-05 (Checklist-driven)

- Q: Navigation arrows visibility? → A: Always visible at low contrast (subtle). No hover-reveal. Ensures discoverability for all users.
- Q: Post page-deletion landing? → A: Navigate to the previous page. If deleting page 1, go to the next page.
- Q: Style Editor and Export placeholder buttons? → A: Visible and enabled; clicking shows a "Coming soon" toast. Most discoverable for future features.
- Q: "Add Page" button position? → A: Both locations — in the notebook toolbar and as a smaller floating button on the canvas near the page indicator. Two entry points for discoverability.
- Q: 10+ page warning display format? → A: Toast notification, consistent with other warning/error patterns in the app.
- Q: Page deletion confirmation? → A: Yes, confirmation dialog required before deleting a page (consistent with lesson/notebook deletion).
- Q: Sidebar initial state on notebook open? → A: Closed by default. Maximizes canvas space; user opens when needed.
- Q: Mobile/tablet scope? → A: Desktop-only for now. Notebook shell optimized for larger viewports; mobile support deferred to a future feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Notebook Cover Page (Priority: P1)

A user clicks a notebook card on the dashboard and is taken to the notebook's cover page at `/app/notebooks/:notebookId`. The cover page fills the canvas area with the notebook's chosen cover color, presenting a book-like cover with the notebook title in a large, elegant font, the instrument name, the owner's display name, and the creation date — all centered. A prominent "Open Notebook" button invites them to enter the notebook, navigating to the index page. An edit button allows them to update the notebook title and cover color via a dialog. The cover should feel like opening a quality leather-bound or cloth-bound notebook.

Above the canvas, a slim, fixed toolbar provides navigation (breadcrumb: "My Notebooks > [Notebook Title]"), a sidebar toggle, zoom controls, a page indicator, and action buttons for style editing, export, and notebook deletion.

**Why this priority**: The cover page is the entry point to every notebook. It establishes the book metaphor that defines the product's identity and provides essential notebook-level actions (edit, delete). Without it, users cannot access any notebook content.

**Independent Test**: Can be fully tested by navigating to `/app/notebooks/:id`, verifying the cover displays correctly with all metadata, testing the "Open Notebook" navigation to the index, testing the edit dialog for title and cover color changes, and verifying the toolbar renders with all controls.

**Acceptance Scenarios**:

1. **Given** a user who clicks a notebook card on the dashboard, **When** the page loads, **Then** they see the notebook cover page at `/app/notebooks/:notebookId` with the notebook's cover color filling the canvas area.
2. **Given** a user viewing the cover page, **When** they look at the cover, **Then** they see the notebook title (large, elegant font), instrument name, owner's display name, and creation date centered on the cover.
3. **Given** a user viewing the cover page, **When** they click "Open Notebook" or click the cover area, **Then** they are navigated to the index page at `/app/notebooks/:notebookId/index`.
4. **Given** a user viewing the cover page, **When** they click the edit button, **Then** a dialog opens allowing them to change the notebook title and cover color.
5. **Given** a user in the edit dialog, **When** they change the title and/or cover color and save, **Then** the cover page updates to reflect the new values.
6. **Given** a user in the edit dialog, **When** they view the instrument and page size fields, **Then** those fields are displayed as read-only with a notice that they cannot be changed.
7. **Given** a user viewing the notebook toolbar, **When** they look at the breadcrumb, **Then** they see "My Notebooks > [Notebook Title]" with "My Notebooks" linking back to the dashboard.
8. **Given** a user viewing the notebook toolbar, **When** they click the delete button, **Then** a confirmation dialog appears warning that deletion is permanent and irreversible.
9. **Given** a user who confirms notebook deletion, **When** the deletion completes, **Then** they are redirected to the dashboard and the notebook is removed.

---

### User Story 2 - Browse Index Page and Navigate Between Pages (Priority: P1)

A user opens the notebook and arrives at the index page. The index is rendered on a dotted paper background with an "INDEX" heading at the top. Below, an auto-generated table of contents lists each lesson with a sequential number, lesson title, dotted leader line, and starting page number — styled like a printed book's table of contents. Clicking any entry navigates to that lesson's first page. The index page is read-only and displays "1" as its global page number.

The user can navigate sequentially through the entire notebook using previous/next arrows at the bottom of the canvas. The navigation flows linearly: Cover, Index, Lesson 1 Page 1, Lesson 1 Page 2, ..., Lesson 2 Page 1, and so on. Keyboard left/right arrow keys also work for navigation. Each page displays its global page number in the corner.

**Why this priority**: The index and page navigation together form the core reading/browsing experience. They transform the notebook from a static cover into a navigable, multi-page document. Without navigation, users cannot reach their lesson content.

**Independent Test**: Can be fully tested by opening a notebook, verifying the index page displays the correct table of contents from the backend, clicking an entry to navigate to the correct lesson page, and using prev/next arrows and keyboard shortcuts to traverse the full page sequence. Verify global page numbers are correct throughout.

**Acceptance Scenarios**:

1. **Given** a user who clicks "Open Notebook" on the cover, **When** the index page loads, **Then** they see a dotted paper background with "INDEX" as the heading and a table of contents listing all lessons.
2. **Given** a user viewing the index page, **When** they look at the table of contents, **Then** each entry shows a sequential number, lesson title, dotted leader line, and starting page number.
3. **Given** a user viewing the index page, **When** they click a lesson entry, **Then** they are navigated to that lesson's first page.
4. **Given** a user on any page (index or lesson page), **When** they click the "Next" arrow, **Then** they navigate to the next page in the linear sequence (Index -> Lesson 1 Page 1 -> Lesson 1 Page 2 -> ... -> Lesson 2 Page 1 -> ...).
5. **Given** a user on any page after the cover, **When** they click the "Previous" arrow, **Then** they navigate to the previous page in the linear sequence.
6. **Given** a user on the index page, **When** they click "Previous", **Then** they navigate back to the cover page.
7. **Given** a user on any page, **When** they press the right arrow key, **Then** they navigate to the next page (same as clicking "Next").
8. **Given** a user on any page, **When** they press the left arrow key, **Then** they navigate to the previous page (same as clicking "Previous").
9. **Given** a user on the last page of the last lesson, **When** they look at the "Next" arrow, **Then** the arrow is hidden or disabled.
10. **Given** a user on the cover page, **When** they look at the "Previous" arrow, **Then** the arrow is hidden or disabled.
11. **Given** a user on any page, **When** they look at the page corner, **Then** they see the correct global page number (index = 1, first lesson's first page = 2, etc.).

---

### User Story 3 - View Lesson Pages (Priority: P1)

A user navigates to a lesson page (via the index, sidebar, or page navigation). The lesson page renders a dotted paper background — the canvas where modules will be placed in a future feature. For now, a placeholder indicates the canvas area. The lesson title is displayed at the top, along with a page indicator showing the current page's position within the lesson (e.g., "Page 2 / 4"). The global page number is displayed in the corner.

**Why this priority**: Lesson pages are the actual workspace — the place where users will compose and view their music content. Even as a placeholder canvas, this page must exist to complete the navigation flow and establish the page structure for future features.

**Independent Test**: Can be fully tested by navigating to `/app/notebooks/:notebookId/lessons/:lessonId/pages/:pageId`, verifying the lesson title displays, the page indicator shows the correct position, the dotted paper background renders, and the global page number is correct.

**Acceptance Scenarios**:

1. **Given** a user who navigates to a lesson page, **When** the page loads, **Then** they see a dotted paper background with the lesson title at the top.
2. **Given** a user on a lesson page, **When** they look at the page indicator, **Then** it shows the current page position within the lesson (e.g., "Page 2 / 4").
3. **Given** a user on a lesson page, **When** they look at the page corner, **Then** the correct global page number is displayed.
4. **Given** a user on a lesson page, **When** they view the canvas area, **Then** they see a placeholder indicating that the canvas/module editor will be available in a future update.

---

### User Story 4 - Manage Lessons via Sidebar (Priority: P2)

A user clicks the bookmark icon in the toolbar to open a sidebar navigation drawer. The sidebar displays the notebook title and a list of all lessons with their titles and creation dates, ordered by creation date ascending. Clicking a lesson navigates to its first page. Each lesson entry supports inline title editing and has a delete button. An "Add Lesson" button at the bottom of the sidebar creates a new lesson via a title input dialog. Deleting a lesson shows a confirmation dialog before proceeding.

**Why this priority**: The sidebar is the primary structural navigation tool — it lets users jump directly to any lesson and manage the notebook's lesson structure. It's essential for notebooks with multiple lessons where sequential navigation alone would be slow.

**Independent Test**: Can be fully tested by toggling the sidebar open, verifying the lesson list matches the notebook's lessons, clicking a lesson to navigate, creating a new lesson via the add button, editing a lesson title inline, and deleting a lesson with confirmation.

**Acceptance Scenarios**:

1. **Given** a user in the notebook view, **When** they click the sidebar toggle (bookmark icon) in the toolbar, **Then** a sidebar drawer opens showing the notebook title and a list of all lessons.
2. **Given** a user viewing the sidebar, **When** they see the lesson list, **Then** each entry shows the lesson title and creation date, ordered by creation date ascending.
3. **Given** a user viewing the sidebar, **When** they click a lesson entry, **Then** they are navigated to that lesson's first page and the sidebar remains open.
4. **Given** a user viewing the sidebar, **When** they click "Add Lesson", **Then** a dialog appears prompting for a lesson title.
5. **Given** a user who enters a title in the add lesson dialog and submits, **When** the lesson is created, **Then** the new lesson appears in the sidebar list and the user is navigated to its first page (which is auto-created).
6. **Given** a user viewing the sidebar, **When** they click the edit action on a lesson entry, **Then** they can edit the lesson title inline.
7. **Given** a user who changes a lesson title inline, **When** they confirm the edit (blur or enter key), **Then** the updated title is saved and reflected in the sidebar and index.
8. **Given** a user viewing the sidebar, **When** they click the delete button on a lesson entry, **Then** a confirmation dialog appears warning that the lesson and its pages will be deleted.
9. **Given** a user who confirms lesson deletion, **When** the deletion completes, **Then** the lesson is removed from the sidebar and the user is navigated to the index page (or the nearest remaining lesson).

---

### User Story 5 - Manage Pages Within a Lesson (Priority: P2)

A user is viewing a lesson page and wants to add or remove pages. An "Add Page" button on the canvas toolbar creates a new page in the current lesson. If the lesson already has 10 or more pages, a warning message from the server response is displayed to the user. A delete button on the page allows removing the current page, unless it is the last remaining page in the lesson (in which case the system shows an error explaining that the last page cannot be deleted). Pages are numbered sequentially within the lesson.

**Why this priority**: Page management is necessary for building out lesson content, but is secondary to the core navigation and lesson management. Users need to be able to expand and trim their lessons, but this is a less frequent action than browsing.

**Independent Test**: Can be fully tested by adding pages to a lesson and verifying the page count increases, checking the 10+ page warning appears, attempting to delete the last page and verifying the error, and deleting a non-last page and verifying the page is removed.

**Acceptance Scenarios**:

1. **Given** a user on a lesson page, **When** they click "Add Page", **Then** a new page is added to the current lesson and the page count updates.
2. **Given** a user adding a page to a lesson that already has 10 or more pages, **When** the page is created, **Then** the warning message from the server response is displayed.
3. **Given** a user on a lesson page that is not the only page, **When** they click the delete page button, **Then** a confirmation appears and the page is removed upon confirmation.
4. **Given** a user on the only remaining page in a lesson, **When** they attempt to delete the page, **Then** the system shows an error message explaining that the last page cannot be deleted.
5. **Given** a user who deletes a page, **When** the deletion completes, **Then** page numbers within the lesson are recalculated and the user is navigated to the previous page (or the next page if page 1 was deleted).

---

### User Story 6 - Zoom Controls (Priority: P3)

A user wants to adjust the zoom level of the canvas area. The toolbar provides zoom in, zoom out, and reset buttons. These controls scale the canvas content (dotted paper and any future modules) without affecting the toolbar or sidebar chrome.

**Why this priority**: Zoom controls enhance the editing experience but are not required for basic navigation and content management. They become more important when the canvas module editor (Feature 7) is implemented.

**Independent Test**: Can be fully tested by clicking zoom in/out/reset buttons and verifying the canvas area scales appropriately while the toolbar and sidebar remain at their normal size.

**Acceptance Scenarios**:

1. **Given** a user in the notebook view, **When** they click the zoom in button, **Then** the canvas content scales up.
2. **Given** a user in the notebook view, **When** they click the zoom out button, **Then** the canvas content scales down.
3. **Given** a user who has changed the zoom level, **When** they click the reset button, **Then** the canvas returns to the default zoom level (100%).
4. **Given** a user adjusting zoom, **When** the canvas scales, **Then** the toolbar, sidebar, and navigation arrows remain at their normal size.

---

### Edge Cases

- What happens when a notebook has no lessons? The index page shows an empty table of contents with a message encouraging the user to create their first lesson. Navigation arrows from the index have no "Next" destination (disabled/hidden). The sidebar shows "No lessons yet" with the "Add Lesson" button.
- What happens when the index endpoint fails to load? The index page shows an error message with a retry button, replacing the table of contents.
- What happens when a user navigates to a lesson/page that no longer exists (stale URL)? The system shows a "Page not found" message within the notebook shell and offers navigation back to the index or cover.
- What happens when a lesson title is very long in the index or sidebar? Titles are truncated with ellipsis in both the index table of contents and the sidebar list.
- What happens when the user presses arrow keys while focused on an input field (e.g., inline edit in sidebar)? Keyboard navigation shortcuts are suppressed when focus is on an input element to avoid conflicting with text editing.
- What happens when page navigation crosses a lesson boundary? The prev/next arrows calculate the correct destination: the last page of the previous lesson or the first page of the next lesson.
- What happens when adding a page fails on the server? An error notification is shown and the page count remains unchanged.
- What happens when deleting a lesson that is currently being viewed? After deletion, the user is redirected to the index page.
- What happens when the user tries to delete a page and receives a LAST_PAGE_DELETION error? The system displays a user-friendly error message explaining that a lesson must have at least one page.
- What happens when multiple browser tabs have the same notebook open and a lesson is deleted in one? The other tab shows stale data until the next page load or refetch; no real-time sync is required.
- What happens when the notebook detail endpoint fails to load? The entire notebook shell shows a full-page error with a retry button and a link back to the dashboard.
- What happens when the user double-clicks a submit or confirm button in dialogs? Buttons are disabled while the mutation is pending, preventing duplicate requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the notebook cover page at `/app/notebooks/:notebookId` with the notebook's cover color filling the canvas area and displaying the title (large, elegant font), instrument name, owner's display name, and creation date centered on the cover.
- **FR-002**: System MUST provide an "Open Notebook" button on the cover page that navigates to the index page at `/app/notebooks/:notebookId/index`.
- **FR-003**: System MUST provide an edit dialog on the cover page for updating the notebook title and cover color. Instrument and page size MUST be displayed as read-only with an immutability notice.
- **FR-004**: The canvas area (cover, index, and lesson pages) MUST render at the fixed aspect ratio of the notebook's page size (e.g., A4 portrait), centered within the available viewport space. The canvas is scrollable and zoomable.
- **FR-005**: System MUST render the index page on a dotted paper background (5mm grid dots) with an "INDEX" heading and an auto-generated table of contents showing sequential numbers, lesson titles, dotted leader lines, and starting page numbers.
- **FR-006**: Clicking an index entry MUST navigate to that lesson's first page at the corresponding route.
- **FR-007**: The index page MUST be read-only with global page number 1 displayed in the corner.
- **FR-008**: System MUST render lesson pages on a dotted paper background with the lesson title at the top, an in-lesson page indicator (e.g., "Page 2 / 4"), and a global page number in the corner.
- **FR-009**: System MUST render a placeholder canvas area on lesson pages indicating future module editor functionality.
- **FR-010**: System MUST provide previous/next navigation arrows at the bottom of the canvas area, always visible at subtle low contrast. Navigation MUST follow the linear sequence: Cover, Index, Lesson 1 Page 1, Lesson 1 Page 2, ..., Lesson 2 Page 1, ..., crossing lesson boundaries correctly.
- **FR-011**: The previous arrow MUST be disabled (visually dimmed) on the cover page. The next arrow MUST be disabled on the last page of the last lesson.
- **FR-012**: System MUST support left/right arrow keyboard shortcuts for page navigation, suppressed when focus is on an input element.
- **FR-013**: System MUST provide a sidebar navigation drawer (toggled by a bookmark icon in the toolbar, closed by default on notebook entry) showing the notebook title and a list of all lessons with titles and creation dates, ordered by creation date ascending.
- **FR-014**: Clicking a lesson in the sidebar MUST navigate to that lesson's first page. The sidebar MUST remain open after navigation; the user closes it manually via the toggle button.
- **FR-015**: The sidebar MUST include an "Add Lesson" button that opens a title input dialog. On submission, a new lesson is created and the user is navigated to its first page (auto-created by the backend).
- **FR-016**: Each lesson in the sidebar MUST support inline title editing and have a delete button that triggers a confirmation dialog.
- **FR-017**: System MUST provide an "Add Page" button in both the notebook toolbar and as a floating button on the canvas near the page indicator. Adding a page to a lesson with 10+ pages MUST display the warning message from the server response as a toast notification.
- **FR-018**: System MUST provide a delete page button on each lesson page. Deletion MUST require a confirmation dialog. Deleting the last remaining page in a lesson MUST display an error message (handling the LAST_PAGE_DELETION error). After deletion, the user MUST be navigated to the previous page (or the next page if deleting page 1).
- **FR-019**: System MUST render a slim, fixed-top toolbar with: breadcrumb ("My Notebooks > [Notebook Title]"), sidebar toggle, zoom controls (in/out/reset), current page indicator with global page number, style editor button (enabled, shows "Coming soon" toast — placeholder for Feature 6), export button (enabled, shows "Coming soon" toast — placeholder for Feature 16), and delete notebook button.
- **FR-020**: Zoom controls MUST scale only the canvas area content, not the toolbar, sidebar, or navigation arrows.
- **FR-021**: The delete notebook button MUST trigger a confirmation dialog. On confirmation, the notebook is deleted and the user is redirected to the dashboard.
- **FR-022**: Lessons MUST be ordered by creation date ascending (fixed order, no reordering support).
- **FR-023**: Pages within a lesson MUST be numbered sequentially.
- **FR-024**: All user-facing strings MUST be localized. Date formatting MUST follow the user's locale conventions.

### Key Entities

- **Notebook (Detail)**: Full notebook representation including title, cover color, instrument, page size, owner display name, creation date, styles, and content references.
- **Notebook Index**: A generated table of contents for the notebook. Contains an ordered list of index entries, each with a lesson reference, lesson title, and starting page number.
- **Lesson (Summary)**: Compact lesson representation used in listings — includes identifier, title, and creation date.
- **Lesson (Detail)**: Full lesson representation including title, creation date, and an ordered array of pages.
- **Lesson Page**: A single page within a lesson. Key attributes: identifier, sequential order within the lesson. Pages are the fundamental unit of the notebook's linear navigation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate from the dashboard to a notebook's cover, index, and any lesson page within 3 clicks or fewer.
- **SC-002**: Users can traverse the entire notebook page-by-page using prev/next navigation or keyboard shortcuts without encountering dead ends or broken sequences.
- **SC-003**: Users can create a new lesson and begin working on its first page in under 30 seconds.
- **SC-004**: Users can locate and jump to any lesson via the sidebar within 5 seconds, regardless of notebook size up to 50 lessons.
- **SC-005**: The cover page, index page, and lesson pages each feel visually distinct yet part of a cohesive book metaphor — users perceive the notebook as a unified, premium reading/editing experience.
- **SC-006**: 90% of first-time users can navigate through the notebook (cover to index to lesson pages) without external guidance.
- **SC-007**: Page additions and deletions are reflected immediately in the page count and navigation sequence without requiring a manual refresh.
- **SC-008**: All text in the notebook shell is displayed in the user's selected language, and dates are formatted according to locale conventions.

## Assumptions

- Users are authenticated and have access to the notebook they are viewing (authentication from Feature 002 is in place).
- The Notebook Dashboard (Feature 004) exists and provides the entry point to notebook cover pages via `/app/notebooks/:id`.
- The backend endpoints (GET /notebooks/{id}, GET /notebooks/{id}/index, GET /notebooks/{id}/lessons, POST /notebooks/{id}/lessons, GET /lessons/{id}, PUT /lessons/{id}, DELETE /lessons/{id}, GET /lessons/{id}/pages, POST /lessons/{id}/pages, DELETE /lessons/{lessonId}/pages/{pageId}, PUT /notebooks/{id}) are available and return the data structures described in the feature description.
- The canvas/module editor (Feature 7) is a separate feature; lesson pages in this feature display a placeholder for the canvas area.
- The style editor (Feature 6) and export (Feature 16) toolbar buttons are placeholders in this feature, linking to future functionality.
- Global page numbering starts at 1 for the index page. The cover page is not numbered. Lesson pages are numbered sequentially after the index.
- Real-time synchronization across tabs/devices is out of scope; the notebook reflects data as of the last fetch.
- The notebook's lessons list is small enough (under 50 lessons) to fetch without pagination.
- Lesson deletion is permitted even when it is the only lesson in the notebook (the backend allows this). An empty notebook's index page simply shows an empty table of contents.
- The notebook shell is desktop-only for now. Mobile and tablet responsive layouts are out of scope and will be addressed in a future feature.
