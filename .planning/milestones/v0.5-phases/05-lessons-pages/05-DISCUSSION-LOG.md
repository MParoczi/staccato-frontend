# Phase 5: Lessons & Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 5-Lessons & Pages
**Areas discussed:** Route nesting, Lesson list design, Create lesson flow, LessonPage controls layout

---

## Route nesting

| Option | Description | Selected |
|--------|-------------|----------|
| Both nested (tab bar always visible) | LessonsPage and LessonPage as children of NotebookPage; tab bar always on screen | |
| List nested, Lesson breaks out | LessonsPage nested; LessonPage is a sibling route (full-screen) | ✓ |
| Both break out (full-screen always) | Neither uses the tab bar; navbar breadcrumb only | |

**User's choice:** List nested, Lesson breaks out

---

| Option | Description | Selected |
|--------|-------------|----------|
| Notebooks › [Notebook Name] › [Lesson Title] | Full 3-level breadcrumb; "[Notebook Name]" links to lesson list | ✓ |
| Notebooks › [Notebook Name] | 2-level breadcrumb; clicking notebook name returns to lesson list | |

**User's choice:** Full 3-level breadcrumb (Notebooks › [Notebook Name] › [Lesson Title])
**Notes:** "[Notebook Name]" in the breadcrumb links to /app/notebooks/:id/lessons (lesson list), not /app/notebooks/:id (cover).

---

## Lesson list design

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical list rows | Full-width rows; title + page count; scales to many lessons | ✓ |
| Card grid (like notebooks dashboard) | 2-3 column grid; more visual | |

**User's choice:** Vertical list rows

---

| Option | Description | Selected |
|--------|-------------|----------|
| Title + page count only | e.g. "Lesson 1 — 3 pages"; clean and minimal | ✓ |
| Title + page count + global page range | e.g. "3 pages (notebook p. 3–5)"; more info at a glance | |

**User's choice:** Title + page count only

---

| Option | Description | Selected |
|--------|-------------|----------|
| ⋮ context menu per row | Consistent with Phase 4 notebook card pattern; menu: Open, Rename, Delete | ✓ |
| Inline icon buttons on hover/focus | Pencil + trash icons on hover; more discoverable but new pattern | |

**User's choice:** ⋮ context menu per row

---

| Option | Description | Selected |
|--------|-------------|----------|
| Small rename dialog | Modal with pre-filled title input; Save/Cancel; consistent with Phase 4 | ✓ |
| Inline edit on the row | Title becomes editable input in-place; more immediate | |

**User's choice:** Small rename dialog

---

## Create lesson flow

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | "New Lesson" button triggers dialog with title input; consistent with Phase 4 | ✓ |
| Inline form at top of list | Persistent input row at top of lesson list | |

**User's choice:** Modal dialog

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-navigate to the new lesson | User taken to /app/notebooks/:id/lessons/:lessonId immediately | ✓ |
| Stay on lesson list, scroll new lesson into view | Stays on list; new lesson appears at bottom | |

**User's choice:** Auto-navigate to the new lesson

---

| Option | Description | Selected |
|--------|-------------|----------|
| Page header button only | Single "New Lesson" button in top-right of LessonsPage | |
| Header button + first-slot dashed row | Header button AND dashed first row ("+ New Lesson") in list | ✓ |

**User's choice:** Header button + first-slot dashed row in list
**Notes:** Consistent with Phase 4 notebook dashboard (D-03 from Phase 4 context).

---

## LessonPage controls layout

| Option | Description | Selected |
|--------|-------------|----------|
| Top bar below Navbar | All controls in one bar at top: back, title, page info, prev/next, add/delete page | ✓ |
| Bottom footer bar | Prev/next at bottom; title at top | |
| Split: title top, nav bottom | Classic reader layout; two UI bars | |

**User's choice:** Top bar below Navbar

---

| Option | Description | Selected |
|--------|-------------|----------|
| In the same top controls bar | Add page (+) and Delete page (trash) in the top bar | ✓ |
| Dropdown/menu in the top bar | Single ⚙ button opens menu; cleaner bar, one extra click | |

**User's choice:** In the same top controls bar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dotted-grid background, empty, no text | CSS dot pattern, no "coming soon" copy | ✓ |
| Dotted-grid + "Canvas coming in next update" label | Adds faint centered label for testers | |
| Solid muted background placeholder | Simple gray fill; no dotted grid | |

**User's choice:** Dotted-grid background, empty, no text

---

## Claude's Discretion

- Top controls bar exact proportions, spacing, and font sizes
- Dotted-grid CSS implementation (dot size, grid spacing, opacity)
- Empty state for LessonsPage (icon choice, heading copy, CTA wording)
- Whether page index is local React state or URL search param (`?page=2`)

## Deferred Ideas

None — discussion stayed within phase scope.
