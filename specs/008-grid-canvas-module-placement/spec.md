# Feature Specification: Grid Canvas & Module Placement

**Feature Branch**: `008-grid-canvas-module-placement`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "Grid Canvas & Module Placement"

## Clarifications

### Session 2026-04-22

- Q: After a user picks a module type, how should initial placement work? → A: Create the module immediately at the first valid grid position.
- Q: Should plain mouse-wheel movement pan the canvas viewport? → A: Yes, plain mouse wheel vertically pans inside the canvas viewport as a normative feature behavior.
- Q: How should the notebook-metaphor styling be made reviewable? → A: Include representative visual tokens for page tone, dots, selection, conflict, and page shadow targets.
- Q: Which feedback surface should be used for validation, rollback, and success outcomes? → A: Use toast notifications only.
- Q: What happens if the user tries to zoom during an active drag or resize session? → A: Ignore zoom changes until the drag or resize session ends.
- Q: Is basic accessibility in scope for this canvas feature? → A: Yes—visible focus, keyboard access to zoom/add/context-menu actions, and proper labels are required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Select Modules on the Page Canvas (Priority: P1)

A notebook editor opens a lesson page and sees it rendered as a warm dotted-paper canvas at the correct page size. Existing modules appear in the right locations and sizes, use their configured visual styles, and can be selected for further actions.

**Why this priority**: The page canvas is the core workspace for notebook editing. If users cannot accurately see, interpret, and select modules on the page, none of the page-layout workflows are usable.

**Independent Test**: Can be fully tested by loading a page with existing modules, confirming the dotted paper renders at the correct aspect ratio, confirming modules appear in the expected positions and stacking order, and selecting and deselecting modules on the canvas.

**Acceptance Scenarios**:

1. **Given** a page has a defined page size and one or more saved modules, **When** the canvas loads, **Then** the page surface is rendered with the correct grid width and height for that page size and displays a warm off-white dotted-paper background.
2. **Given** the canvas is visible at any supported zoom level, **When** the page is rendered, **Then** dot spacing and page dimensions scale proportionally with zoom while preserving the same underlying grid coordinates.
3. **Given** a module exists on the page, **When** the canvas renders it, **Then** the module appears at the correct left, top, width, and height based on its saved grid position and size and uses its module-type styling.
4. **Given** multiple modules exist on the page, **When** they are rendered, **Then** their visual stacking order follows each module's saved z-index.
5. **Given** no module is currently selected, **When** the user clicks a module, **Then** that module becomes selected and shows an earthy selection outline, header drag area, and eight resize handles.
6. **Given** a module is selected, **When** the user clicks an empty area of the canvas, **Then** the module is deselected and the selection affordances disappear.

---

### User Story 2 - Reposition and Resize Modules Safely (Priority: P1)

A notebook editor rearranges page content by dragging modules by their header area and resizing them from any edge or corner. The canvas snaps movement to the page grid, previews the resulting placement, blocks invalid moves, and preserves the previous layout if a save fails.

**Why this priority**: Moving and resizing modules is the most important editing behavior on the canvas and directly determines whether the notebook can be laid out correctly.

**Independent Test**: Can be fully tested by selecting a module, dragging it to a new grid position, resizing it from different handles, verifying snapping and validation behavior, and confirming that successful changes persist while invalid or rejected changes revert.

**Acceptance Scenarios**:

1. **Given** a module is selected, **When** the user drags its header area, **Then** the canvas shows a semi-transparent snapped placement preview during the drag.
2. **Given** the user drags a module to a valid new position, **When** the drag ends, **Then** the module snaps to the nearest grid unit, the canvas updates immediately, and the change is saved after the configured short delay.
3. **Given** the user drags a module so part of it would leave the page, **When** the drag ends, **Then** the module returns to its original position and the user sees an error toast explaining that the module must remain within the page bounds.
4. **Given** the user drags or resizes a module so it would overlap another module, **When** the conflicting position is previewed, **Then** the conflicting module is highlighted in muted warm red and the attempted change is rejected when released.
5. **Given** the user resizes a module smaller than its allowed minimum size, **When** the resize ends, **Then** the module returns to its previous valid size and the user sees an error toast.
6. **Given** a valid drag or resize was applied optimistically, **When** the server later rejects the layout change, **Then** the module reverts to its prior saved layout and the server-provided error toast is shown to the user.

---

### User Story 3 - Add, Delete, and Layer Modules (Priority: P2)

A notebook editor adds new modules from a type picker, removes modules they no longer need, and adjusts visual stacking order for presentation while still respecting the no-overlap placement rules.

**Why this priority**: Page composition requires more than moving existing modules. Editors must be able to introduce new modules, remove obsolete ones, and manage which module visually appears above another when presentation requires it.

**Independent Test**: Can be fully tested by creating a new module from the picker, confirming it appears at a valid position and minimum size, deleting a selected module, and using context-menu actions to change visual layering without permitting overlap.

**Acceptance Scenarios**:

1. **Given** the editor is viewing the page canvas, **When** they activate the Add Module control, **Then** a styled module-type picker appears showing all 12 module types as labeled icons.
2. **Given** the user selects a module type, **When** at least one valid placement is available, **Then** the system immediately creates the new module at the first valid grid position using that type's minimum size and empty content.
3. **Given** the backend rejects a module creation request with a placement or title-related validation error, **When** the response is returned, **Then** the new module is not kept on the page and the matching error toast is shown.
4. **Given** a selected module contains no user content, **When** the user chooses delete, **Then** the module is removed immediately and the deletion is persisted.
5. **Given** a selected module contains content, **When** the user chooses delete, **Then** the user is asked to confirm before the module is removed.
6. **Given** a module is selected, **When** the user chooses Bring to Front from the context menu, **Then** that module moves above all others visually without allowing overlap.
7. **Given** a module is selected, **When** the user chooses Send to Back from the context menu, **Then** that module moves to the lowest visual layer without changing its occupied grid cells.
8. **Given** keyboard focus is on the Add Module control or a selected module action trigger, **When** the user invokes the control from the keyboard, **Then** the add flow or module context menu opens with visible focus and labeled actions.

---

### User Story 4 - Control Page Zoom and Viewport Pan While Preserving Layout Meaning (Priority: P3)

A notebook editor zooms the page in and out to inspect detail or gain more overview and vertically pans the viewport with the mouse wheel while keeping the same grid-based layout semantics and interaction behavior.

**Why this priority**: Zoom and pan are important for precision work and comfortable navigation, but they build on the already-functional canvas, rendering, and layout-management flows.

**Independent Test**: Can be fully tested by using the zoom buttons, keyboard shortcuts, and plain mouse wheel inside the canvas viewport, confirming zoom stays within the supported range, and verifying that dots, modules, selection affordances, and viewport movement behave correctly without changing saved layout values.

**Acceptance Scenarios**:

1. **Given** the canvas is open, **When** the user clicks zoom in or zoom out, **Then** the page surface, dot spacing, modules, and handles rescale together in 10% increments.
2. **Given** the user reaches the maximum or minimum supported zoom, **When** they try to zoom further in the same direction, **Then** the zoom value remains clamped to the supported range.
3. **Given** the user presses the reset shortcut, **When** the command is accepted, **Then** the zoom returns to the default 100% view.
4. **Given** the pointer is over the canvas viewport and no drag or resize session is active, **When** the user turns the plain mouse wheel, **Then** the viewport pans vertically without changing the zoom level.
5. **Given** the pointer is over the canvas viewport and no drag or resize session is active, **When** the user turns the mouse wheel while holding Control, **Then** the zoom level changes in 10% increments within the supported range instead of panning the viewport.
6. **Given** a drag or resize session is active, **When** the user attempts to zoom by control, shortcut, or wheel gesture, **Then** the zoom level does not change until the active manipulation ends.
7. **Given** the user changes zoom and continues editing, **When** they drag, resize, or select modules, **Then** those interactions still snap to the same logical grid coordinates.

---

### Edge Cases

- What happens when a page has no modules? The canvas should still render the dotted paper page, zoom controls, and Add Module control without empty-state glitches.
- What happens when two modules touch edges but do not intersect? The layout remains valid because shared borders without shared occupied cells are allowed.
- What happens when the user tries to place or resize a module so it exactly touches the page boundary? The layout remains valid as long as the entire module still fits within the page.
- What happens when the user drags rapidly across several invalid positions before releasing? The preview should keep snapping to the nearest grid position, show the latest conflict state, and only commit the final valid release position.
- What happens when a module delete request fails after optimistic removal? The module should be restored to its previous position and the user should see an error message.
- What happens when no valid starting position exists for a newly selected module type at its minimum size? The system should not create the module and should explain that no valid space is available on the current page.
- What happens when the server returns a newer or different z-index than the optimistic value? The canvas should reconcile to the saved server result after the request completes.
- What happens when the user changes zoom during an open selection? The selected module should remain selected and its outline and handles should rescale correctly.
- What happens when the user attempts to change zoom during an active drag or resize? The zoom request should be ignored until the active manipulation ends so the interaction state stays stable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render each lesson page as a dotted-paper canvas that reflects the page's configured physical size and grid dimensions.
- **FR-002**: System MUST treat one grid unit as 5 mm of physical page space for all layout calculations.
- **FR-003**: System MUST support the following page grid dimensions: A4 = 42×59, A5 = 29×42, A6 = 21×29, B5 = 35×50, and B6 = 25×35.
- **FR-004**: System MUST use a top-left origin where X increases to the right and Y increases downward.
- **FR-005**: System MUST treat a module as occupying all grid cells from `(gridX, gridY)` through `(gridX + gridWidth - 1, gridY + gridHeight - 1)`.
- **FR-006**: System MUST render the page surface in a warm off-white paper tone with subtle page-edge lift, using representative review targets of paper fill `#F7F1E3`, a 1 px border near `#E2D6C2`, and a soft page shadow comparable to `0 10px 30px rgba(92, 74, 52, 0.14)`.
- **FR-007**: System MUST render warm-gray dots at every grid intersection across the page surface, using a representative dot color near `#A79B8B`, and keep the dots visually crisp across the supported zoom range.
- **FR-008**: System MUST scale dot spacing, page dimensions, module dimensions, and interaction affordances in proportion to the current zoom level.
- **FR-009**: System MUST render each module as a positioned element inside the canvas using the saved grid coordinates, dimensions, and z-index.
- **FR-010**: System MUST apply the notebook's saved module style definition for each module's type when rendering the module.
- **FR-011**: System MUST show each module with a header area containing the module type label styled by the header colors and a body area styled by the body text color and font family.
- **FR-012**: System MUST load the current page's modules when the canvas opens and update the visible canvas when the page changes.
- **FR-013**: System MUST allow the user to select a module by clicking it.
- **FR-014**: System MUST allow the user to deselect the current module by clicking empty canvas space.
- **FR-015**: System MUST show the selected module with an earthy brown selection outline, a dedicated header drag handle area, and eight warm-toned resize handles positioned at the four corners and four edge midpoints, using representative review targets of outline `#8A6A43` and handles near `#B08968`.
- **FR-016**: System MUST allow dragging only from the selected module's header area.
- **FR-017**: System MUST show a semi-transparent placement preview with an earthy border while a module is being dragged or resized.
- **FR-018**: System MUST snap drag and resize outcomes to the nearest whole grid unit.
- **FR-019**: System MUST reject layout changes that place any part of a module outside the page bounds.
- **FR-020**: System MUST reject layout changes that make a module smaller than the minimum allowed size for its module type.
- **FR-021**: System MUST reject layout changes that cause the moved or resized module to overlap any other module on the same page.
- **FR-022**: System MUST treat overlap as any case where two module rectangles intersect; modules that only touch at an edge or corner MUST remain valid.
- **FR-023**: System MUST visually mark the conflicting module in muted terracotta whenever the current drag or resize preview would overlap it, using a representative highlight color near `#B85C4B`.
- **FR-024**: System MUST immediately show the new layout on the canvas after a valid drag or resize completes, before the server confirms the change.
- **FR-025**: System MUST persist a valid layout change after drag or resize using a short delayed save so repeated adjustments do not trigger an immediate request for every intermediate movement.
- **FR-026**: System MUST use a 500 ms delay before sending the layout persistence request after drag or resize completion.
- **FR-027**: System MUST restore the previous saved layout and show an error toast if a client-side validation fails or the server rejects the layout change.
- **FR-028**: System MUST surface the server-provided validation message in a toast when the server rejects a layout change.
- **FR-029**: System MUST provide an Add Module control styled consistently with the notebook's earthy interface language and place it where it remains discoverable while editing the canvas.
- **FR-030**: System MUST show a module-type picker containing these 12 types as labeled icon choices: Title, Breadcrumb, Subtitle, Theory, Practice, Example, Important, Tip, Homework, Question, ChordTablature, and FreeText.
- **FR-031**: System MUST create a new module with empty content and the selected type's minimum dimensions.
- **FR-032**: System MUST create a new module at the first available valid grid position for its minimum size, immediately after the user selects a module type from the picker.
- **FR-033**: System MUST prevent new-module creation when no valid in-bounds, non-overlapping starting position is available.
- **FR-034**: System MUST show user-facing error toasts when module creation is rejected for overlap, out-of-bounds placement, undersized dimensions, or a duplicate title-module rule.
- **FR-035**: System MUST allow deleting the selected module from a visible action or module context menu.
- **FR-036**: System MUST require confirmation before deleting a module that is not empty.
- **FR-037**: System MUST remove a module from the canvas immediately after a delete action is confirmed and restore it if the delete request fails.
- **FR-038**: System MUST provide a module context menu styled to match the notebook's earthy design language.
- **FR-039**: System MUST offer Bring to Front and Send to Back actions in the module context menu.
- **FR-040**: System MUST assign Bring to Front to one greater than the current highest z-index on the page and Send to Back to zero.
- **FR-041**: System MUST treat z-index changes as visual layering only and MUST NOT allow overlapping modules even when their z-index values differ.
- **FR-042**: System MUST provide zoom in, zoom out, and zoom reset controls in a subtle canvas-corner control group with visible focus treatment and accessible labels.
- **FR-043**: System MUST support the keyboard shortcuts Ctrl+Plus for zoom in, Ctrl+Minus for zoom out, and Ctrl+0 for zoom reset, and MUST zoom the canvas in 10% increments when the user performs `Ctrl+wheel` over the canvas viewport and no drag or resize session is active.
- **FR-044**: System MUST support zoom values from 50% through 200% in 10% increments.
- **FR-045**: System MUST preserve the zoom level as part of the existing UI preference state so the canvas can reuse it across interactions.
- **FR-046**: System MUST keep all user-facing canvas interactions consistent across the supported zoom range, including selection, drag, resize, add, delete, and context-menu actions.
- **FR-047**: System MUST use toast notifications as the only feedback surface for create, move, resize, delete, and layering validation, rollback, and success outcomes.
- **FR-048**: System MUST keep this feature scoped to page-canvas layout and module management; module content editing is outside the scope of this specification.
- **FR-049**: System MUST vertically pan the canvas viewport when the user turns the plain mouse wheel over the viewport without an active drag or resize session.
- **FR-050**: System MUST ignore zoom-change requests while a drag or resize session is active.
- **FR-051**: System MUST provide basic accessibility for canvas controls and actions, including visible focus indicators, keyboard access for zoom controls, Add Module, and module context-menu actions, and proper accessible labels for those interactive elements.

### External Dependencies

- The specification depends on the current backend module-management contracts remaining available: `GET /pages/{pageId}/modules`, `POST /pages/{pageId}/modules`, `PATCH /modules/{moduleId}/layout`, and `DELETE /modules/{moduleId}`.
- The layout-update contract currently carries `gridX`, `gridY`, `gridWidth`, `gridHeight`, and `zIndex`, and the canvas must reconcile to the saved module returned by the backend.
- The add-module flow must be prepared to handle the backend validation codes `MODULE_OVERLAP`, `MODULE_OUT_OF_BOUNDS`, `MODULE_TOO_SMALL`, and `DUPLICATE_TITLE_MODULE`.
- The overlap rule follows the current axis-aligned rectangle test from the source description: `NOT (a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)`.
- Module rendering depends on the notebook's existing `NotebookModuleStyle` definitions by module type, and resize validation depends on the existing `MODULE_MIN_SIZES` reference values.
- The source description specifies that drag behavior uses the existing dnd-kit interaction layer and that zoom level is stored in the current Zustand-backed UIStore.

### Key Entities

- **Page Canvas**: The notebook page editing surface for a single lesson page. Key attributes: page size, grid width, grid height, current zoom level, dotted paper appearance, and current module collection.
- **Module**: A rectangular content container placed on a page grid. Key attributes: module ID, module type, grid position, grid size, z-index, content presence, and rendered style.
- **Module Layout**: The placement definition for a module on the page. Key attributes: gridX, gridY, gridWidth, gridHeight, and z-index. Used for snapping, overlap checks, boundary checks, and persistence.
- **Module Style**: The visual presentation rules applied to a module type on the canvas. Key attributes: header colors, body text color, font family, and other appearance settings already defined elsewhere in the notebook.
- **Zoom Preference**: The user's current page magnification setting. Key attributes: current percentage, allowed range, increment size, and reset behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open a page and see the full dotted-paper canvas with existing modules rendered in the correct positions within 2 seconds under normal load conditions.
- **SC-002**: In QA validation using scripted drag and resize scenarios, at least 95% of completed actions persist to the exact snapped grid coordinates expected for the tested input sequence on the first attempt.
- **SC-003**: Users can add a new module from the picker and see it placed on the page within 3 seconds under normal conditions.
- **SC-004**: In QA validation, at least 9 out of 10 first-attempt layout changes that satisfy page rules complete successfully without client-side rejection, rollback, or a repeated user action.
- **SC-005**: Invalid drag, resize, or add actions provide visible corrective toast feedback in under 1 second so users understand why the change was not accepted.
- **SC-006**: Users can zoom from the minimum supported view to the maximum supported view and back without losing selection state or corrupting page layout data.
- **SC-007**: In walkthrough testing, users can identify the selected module, available resize handles, and Add Module control without facilitator explanation in at least 90% of sessions.

## Assumptions

- The current notebook shell already provides a page-level editing surface where the canvas, zoom controls, and add-module controls can be mounted.
- The notebook already has per-module-type style records available so modules can be rendered with the correct visual treatment from the moment they appear on the canvas.
- Only one editor is actively modifying a page layout at a time; real-time multi-user conflict resolution is out of scope.
- A module is considered non-empty for delete confirmation if it already contains visible content or derived content that the user would reasonably expect to lose.
- Selecting a module type from the Add Module picker immediately starts module creation, and the system chooses the first valid in-bounds, non-overlapping grid position that fits the type's minimum size.
