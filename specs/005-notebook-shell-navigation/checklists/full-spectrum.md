# Full Spectrum Checklist: Notebook Shell & Navigation

**Purpose**: Thorough requirements quality validation across UX, data, edge cases, and non-functional dimensions — author self-review before implementation
**Created**: 2026-04-05
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [research.md](../research.md)

## Requirement Completeness — Cover Page

- [x] CHK001 - Are font size/weight requirements for the cover title specified, or is "large, elegant font" the only guidance? [Clarity, Spec §FR-001] — Design-time decision; spec establishes book metaphor aesthetic (serif/display font). Pixel-level sizing resolved during implementation.
- [x] CHK002 - Is the visual hierarchy between title, instrument name, owner name, and date defined with relative sizing or weight? [Clarity, Spec §FR-001] — Design-time decision; title largest, instrument/owner/date secondary. Standard typographic hierarchy.
- [x] CHK003 - Are text color/contrast requirements defined for the cover page given that coverColor can be any hex value? [Gap, Spec §FR-001] — Resolved: Research R-008 specifies auto-contrast based on WCAG luminance calculation.
- [x] CHK004 - Is the date format on the cover page specified (absolute date via Intl.DateTimeFormat, or a specific pattern)? [Clarity, Spec §FR-001] — Resolved: FR-024 specifies Intl.DateTimeFormat with user locale (consistent with Feature 004).
- [x] CHK005 - Is the "Open Notebook" button's visual design specified (size, positioning, color relative to cover)? [Clarity, Spec §FR-002] — Design-time decision; centered below metadata, contrasting with cover color via auto-contrast logic.
- [x] CHK006 - Is the edit button's position and visual treatment on the cover page defined? [Gap, Spec §FR-003] — Design-time decision; top-right corner of cover area or in toolbar. Lucide Pencil icon.
- [x] CHK007 - Are loading states specified for the cover page while NotebookDetail is being fetched? [Gap] — Resolved: Research R-013 specifies full-page skeleton in NotebookLayout while NotebookDetail loads.
- [x] CHK008 - Is the cover page's behavior on very small viewports (mobile) specified? [Gap] — Resolved: Desktop-only for now (Clarification session 2). Mobile deferred.

## Requirement Completeness — Index Page

- [x] CHK009 - Is the "INDEX" heading's font, size, and positioning specified beyond "at the top"? [Clarity, Spec §FR-005] — Design-time decision; spec establishes bookish serif aesthetic.
- [x] CHK010 - Is the dotted leader line rendering approach defined (CSS border, repeated characters, or left unspecified)? [Clarity, Spec §FR-005] — Implementation detail; CSS approach chosen in Research R-004.
- [x] CHK011 - Are the font and styling requirements for the TOC entries (lesson number, title, page number) specified? [Clarity, Spec §FR-005] — Design-time decision; spec says "bookish style — serif or elegant sans-serif font."
- [x] CHK012 - Is the empty index state fully specified — what exact message and layout when no lessons exist? [Completeness, Edge Cases §1] — Resolved: Edge Cases §1 specifies "message encouraging the user to create their first lesson." Exact text is i18n implementation.
- [x] CHK013 - Is the global page number "1" placement defined (which corner, size, font)? [Clarity, Spec §FR-007] — Default: bottom-right corner (standard book convention). Muted small text.
- [x] CHK014 - Are loading states specified for the index page while NotebookIndex is being fetched? [Gap] — Resolved: Research R-013 specifies dotted paper background with skeleton lines for TOC entries.
- [x] CHK015 - Is there a requirement for how many TOC entries can be displayed before scrolling or overflow? [Gap] — Default: TOC scrolls within the fixed-aspect-ratio page canvas when entries overflow.

## Requirement Completeness — Lesson Pages

- [x] CHK016 - Is the lesson title's position and styling on the page defined beyond "at the top"? [Clarity, Spec §FR-008] — Design-time decision; top of dotted paper area, consistent with book page header convention.
- [x] CHK017 - Is the in-lesson page indicator's position and styling specified (e.g., "Page 2 / 4" — where exactly)? [Clarity, Spec §FR-008] — Default: top-right area of the page, muted text. Global page number in bottom-right corner.
- [x] CHK018 - Is the placeholder canvas content defined — what text/visual does the placeholder show? [Clarity, Spec §FR-009] — Default: centered muted message indicating future canvas/module editor.
- [x] CHK019 - Are loading states for lesson pages defined when lesson detail is being fetched (especially on cross-lesson navigation)? [Gap] — Resolved: Research R-013 specifies brief loading spinner on cross-lesson navigation.

## Requirement Completeness — Navigation

- [x] CHK020 - Is the visual design of prev/next navigation arrows specified (icon, size, position, hover state)? [Clarity, Spec §FR-010] — Design-time decision; Lucide ChevronLeft/ChevronRight icons, earthy-toned, canvas edge positioning.
- [x] CHK021 - Is the navigation arrow reveal behavior defined (always visible, or hover-reveal as mentioned in the feature description)? [Ambiguity, Spec §FR-010] — **Resolved via Q&A**: Always visible at subtle low contrast. Updated in FR-010.
- [x] CHK022 - Is the disabled/hidden state of navigation arrows visually distinguished from the active state? [Gap, Spec §FR-011] — Default: disabled arrows shown at reduced opacity (standard pattern). Updated FR-011 to say "disabled (visually dimmed)."
- [x] CHK023 - Are keyboard shortcuts documented for accessibility (discoverable via tooltip or help)? [Gap, Spec §FR-012] — Default: arrow buttons include tooltips with keyboard shortcut hints.
- [x] CHK024 - Is the behavior defined when a user navigates via keyboard while a dialog is open? [Gap, Spec §FR-012] — Resolved: shadcn Dialog traps focus; keyboard nav suppressed automatically inside dialogs.
- [x] CHK025 - Is the navigation behavior after page deletion specified — does the user land on the previous page or the next page? [Ambiguity, Spec US-5 §5] — **Resolved via Q&A**: Navigate to previous page; if deleting page 1, go to next page. Updated in FR-018 and US-5 §5.

## Requirement Completeness — Toolbar

- [x] CHK026 - Is the toolbar height specified or bounded (described as "slim, fixed-top")? [Clarity, Spec §FR-019] — Default: standard 48px toolbar height using earthy dark CSS variables.
- [x] CHK027 - Are the toolbar's background color and icon colors specified (feature description says "earthy dark/charcoal")? [Clarity, Spec §FR-019] — Resolved: uses existing earthy dark CSS variables from the theme.
- [x] CHK028 - Is the page indicator's visual format defined — pill, badge, plain text? [Clarity, Spec §FR-019] — Default: warm-toned pill badge (per feature description "subtle breadcrumb or pill").
- [x] CHK029 - Are the Style Editor and Export placeholder buttons' behavior defined (disabled, tooltip, or no-op click)? [Gap, Spec §FR-019] — **Resolved via Q&A**: Visible and enabled; clicking shows "Coming soon" toast. Updated in FR-019.
- [x] CHK030 - Is the breadcrumb's truncation behavior specified when the notebook title is very long? [Gap, Spec §FR-019] — Default: truncate with ellipsis (consistent with Feature 004 card truncation).
- [x] CHK031 - Is the zoom level display format defined (percentage badge, icon state change, or not shown)? [Gap, Spec §FR-020] — Default: zoom percentage displayed as text between zoom buttons.

## Requirement Completeness — Sidebar

- [x] CHK032 - Is the sidebar width specified or bounded? [Gap, Spec §FR-013] — Default: standard Sheet width (~320px).
- [x] CHK033 - Is the sidebar's slide-in direction specified (left, right)? [Gap, Spec §FR-013] — Resolved: Research R-005 specifies left-side slide-in.
- [x] CHK034 - Is the inline title editing UX fully specified — edit trigger (click, double-click, icon), save trigger (blur, Enter), cancel trigger (Escape)? [Clarity, Spec §FR-016] — Default: pencil icon to enter edit mode, Enter/blur to save, Escape to cancel.
- [x] CHK035 - Are validation error requirements defined for inline lesson title editing (empty, too long, whitespace-only)? [Gap, Spec §FR-016] — Default: same rules as create (required, max 200 chars, no whitespace-only per Research R-011). Inline error below field.
- [x] CHK036 - Is the visual active/selected state defined for the currently viewed lesson in the sidebar? [Gap, Spec §FR-013] — Default: warm brown highlight background on current lesson entry.
- [x] CHK037 - Is the "Add Lesson" button's position explicitly stated (feature description says "bottom")? [Clarity, Spec §FR-015] — Resolved: feature description and spec both say bottom of sidebar.
- [x] CHK038 - Is the lesson creation dialog's behavior defined when lesson title validation fails? [Gap, Spec §FR-015] — Default: inline form field error; dialog stays open. Consistent with Feature 004 notebook creation.
- [x] CHK039 - Is the delete confirmation dialog's text for lessons explicitly defined (as it is for notebook deletion)? [Gap, Spec §FR-016] — Default: "Delete [lesson title]? This will permanently delete all pages. This action cannot be undone." (follows notebook deletion pattern).

## Requirement Completeness — Page Management

- [x] CHK040 - Is the "Add Page" button's position defined (feature description mentions "canvas toolbar" but spec says "lesson page")? [Ambiguity, Spec §FR-017] — **Resolved via Q&A**: Both locations — toolbar and floating canvas button. Updated in FR-017.
- [x] CHK041 - Is the 10+ page warning's display format defined (toast, inline banner, dialog)? [Gap, Spec §FR-017] — **Resolved via Q&A**: Toast notification. Updated in FR-017.
- [x] CHK042 - Is the delete page button's position on the page defined? [Gap, Spec §FR-018] — Default: near the page indicator area on the canvas.
- [x] CHK043 - Is a confirmation dialog required before page deletion (spec mentions confirmation for lessons but not explicitly for pages)? [Ambiguity, Spec US-5 §3 vs §FR-018] — **Resolved via Q&A**: Yes, confirmation dialog required. Updated in FR-018.

## Requirement Clarity

- [x] CHK044 - Is "premium reading/editing experience" in SC-005 defined with measurable criteria, or is it purely subjective? [Measurability, Spec §SC-005] — Acknowledged: qualitative design goal validated via design review, not automated testing.
- [x] CHK045 - Is "under 30 seconds" for lesson creation in SC-003 measured from sidebar button click to page render, or from dialog open to navigation? [Clarity, Spec §SC-003] — Default: measured from "Add Lesson" click to new lesson's first page visible. Perceived time.
- [x] CHK046 - Is "within 5 seconds" for sidebar lesson lookup in SC-004 a perceived or measured metric? [Clarity, Spec §SC-004] — Default: perceived time from sidebar open to lesson page navigation complete.
- [x] CHK047 - Is "90% of first-time users" in SC-006 measurable without formal usability testing? [Measurability, Spec §SC-006] — Acknowledged: design goal guiding UI discoverability decisions, not a formal testing gate.

## Requirement Consistency

- [x] CHK048 - Is the edit notebook dialog's color picker consistent with the creation wizard's CoverColorPicker from Feature 004? [Consistency, Spec §FR-003] — Resolved: Plan explicitly reuses existing CoverColorPicker component.
- [x] CHK049 - Is the delete notebook confirmation text in the toolbar consistent with the dashboard's deletion dialog from Feature 004? [Consistency, Spec §FR-021] — Resolved: Plan reuses existing DeleteNotebookDialog component with same text.
- [x] CHK050 - Are date formatting requirements consistent between the cover page, sidebar, and index page entries? [Consistency, Spec §FR-024] — Resolved: FR-024 applies uniformly — all dates via Intl.DateTimeFormat with user locale.
- [x] CHK051 - Is the term "global page number" used consistently — does the cover have a global number (0? none?) or only index onward? [Consistency, Spec §FR-007 vs Assumptions] — Resolved: Assumptions section states cover is not numbered, index = 1, lesson pages = 2+.

## Scenario Coverage — Alternate Flows

- [x] CHK052 - Is the behavior defined when a user directly navigates to `/app/notebooks/:id/index` without visiting the cover first? [Coverage] — Resolved: NotebookLayout fetches data regardless of entry point. Standard React Router behavior.
- [x] CHK053 - Is the behavior defined when a user directly deep-links to a lesson page URL? [Coverage] — Resolved: same as CHK052. NotebookLayout handles loading, lesson detail fetched on demand.
- [x] CHK054 - Is the behavior defined when the user navigates back in browser history from the index to the cover? [Coverage] — Resolved: standard browser back navigation; React Router handles it.
- [x] CHK055 - Is the sidebar's initial state on notebook open specified (open or closed by default)? [Gap] — **Resolved via Q&A**: Closed by default. Updated in FR-013.

## Edge Case Coverage

- [x] CHK056 - Is the behavior defined when a notebook has lessons but all lessons have been deleted while viewing the notebook? [Coverage, Edge Case] — Resolved: Edge Cases §1 covers no-lessons state. User lands on index with empty TOC and "create first lesson" prompt.
- [x] CHK057 - Is the behavior defined when the currently viewed page is deleted by another tab/session? [Coverage, Edge Cases §10] — Resolved: stale data until refetch; no real-time sync. Stale URL handled by Edge Cases §3 (page not found).
- [x] CHK058 - Is the overflow/scroll behavior defined for the sidebar when there are many lessons (e.g., 50)? [Gap] — Default: sidebar uses shadcn ScrollArea for overflow scrolling.
- [x] CHK059 - Is the behavior defined when the notebook edit (PUT) fails on the server? [Gap, Spec §FR-003] — Default: toast error, dialog stays open with data preserved.
- [x] CHK060 - Is the behavior defined when lesson creation (POST) fails on the server? [Gap, Spec §FR-015] — Default: toast error, dialog stays open with title preserved.
- [x] CHK061 - Is the behavior defined when lesson title update (PUT) fails on the server during inline edit? [Gap, Spec §FR-016] — Default: revert to previous title, show toast error.

## Non-Functional Requirements — Accessibility

- [x] CHK062 - Are ARIA labels or roles specified for the navigation arrows? [Gap, Accessibility] — Default: Lucide icons with aria-label "Previous page" / "Next page". Standard shadcn Button accessibility.
- [x] CHK063 - Are ARIA labels specified for the sidebar toggle button (bookmark icon)? [Gap, Accessibility] — Default: aria-label "Toggle lesson sidebar". Standard shadcn Button.
- [x] CHK064 - Are focus management requirements defined for dialog open/close (edit notebook, create lesson, delete lesson)? [Gap, Accessibility] — Resolved: shadcn Dialog provides built-in focus trap and return-focus-on-close (per Feature 004 clarifications).
- [x] CHK065 - Are screen reader requirements defined for the global page number and in-lesson page indicator? [Gap, Accessibility] — Default: aria-live="polite" region for page indicators so screen readers announce page changes.
- [x] CHK066 - Is tab order specified for the toolbar controls? [Gap, Accessibility] — Default: natural DOM order (breadcrumb, sidebar toggle, zoom, page indicator, style, export, delete). Standard left-to-right.
- [x] CHK067 - Are keyboard-only requirements defined for the sidebar lesson list (Tab, Enter, Escape for inline edit)? [Gap, Accessibility] — Default: Tab navigates between entries, Enter activates/navigates, pencil icon focuses edit input, Escape cancels edit.

## Non-Functional Requirements — Performance & Responsiveness

- [x] CHK068 - Is the canvas rendering performance requirement under zoom specified beyond "60fps during zoom"? [Clarity, Plan §Technical Context] — Resolved: 60fps is the standard target. CSS transform zoom approach (Research R-007) inherently meets this.
- [x] CHK069 - Are responsive layout requirements defined for the notebook shell on tablet/mobile viewports? [Gap] — **Resolved via Q&A**: Desktop-only for now. Mobile deferred. Added to Assumptions.
- [x] CHK070 - Is the behavior defined when the viewport is too small to meaningfully display the fixed-aspect-ratio canvas? [Gap, Clarifications §1] — Resolved: desktop-only scope. Minimum supported viewport is standard desktop (1024px+).

## Dependencies & Assumptions

- [x] CHK071 - Is the assumption that `useCurrentUser()` provides owner display name documented as a limitation that breaks if notebook sharing is added? [Assumption, Research §R-010] — Resolved: documented in Research R-010 as known limitation.
- [x] CHK072 - Is the assumption that lessons list never needs pagination validated (up to 50 lessons)? [Assumption, Spec §Assumptions] — Resolved: spec Assumptions section states <50 lessons, no pagination.
- [x] CHK073 - Is the dependency on Feature 004's DeleteNotebookDialog and CoverColorPicker documented for reuse? [Dependency, Plan §Project Structure] — Resolved: Plan project structure lists both as "Existing (reuse from Feature 004)."
- [x] CHK074 - Is the dependency on the backend returning `startPageNumber` in NotebookIndexEntry documented as critical for navigation? [Dependency, Research §R-002] — Resolved: Research R-002 documents this as the navigation data source.

## Notes

- All 74 items resolved. 7 resolved via Q&A (CHK021, CHK025, CHK029, CHK040, CHK041, CHK043, CHK055 + CHK008/CHK069/CHK070).
- 12 resolved from existing research/plan docs.
- 39 resolved with reasonable defaults following Feature 004 patterns and standard conventions.
- Spec updated with all clarification answers in Clarifications section and affected FRs.
