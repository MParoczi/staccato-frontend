# Phase 6: Canvas & Module Placement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 6-Canvas & Module Placement
**Areas discussed:** Palette UX, Action bar placement, Canvas fit & scroll, Auto-placement strategy

---

## Palette UX

### Q1: How should users access the module palette?

| Option | Description | Selected |
|--------|-------------|----------|
| Floating "+" button | Fixed circular/pill button on canvas (bottom-right or top-left); click opens overlay panel | |
| Persistent sidebar | Slim left or right panel beside the canvas showing all 12 types; always visible | |
| Top toolbar button | "Add module" button in the existing LessonPage controls bar; opens dropdown or popover | ✓ |

**User's choice:** Top toolbar button
**Notes:** Integrates into the existing controls bar alongside page navigation

### Q2: How should the 12 types be presented?

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown menu (list) | Vertical dropdown; each item shows icon + name; fits existing DropdownMenu pattern | |
| Popover grid | Small grid panel (3×4) showing each type as icon+label tile; uses shadcn Popover | ✓ |
| Dialog / modal | Centered modal with large tiles and type descriptions; heavier interaction cost | |

**User's choice:** Popover grid
**Notes:** 3×4 grid, each tile icon + name, shadcn Popover component (not yet installed)

### Q3: What happens to the popover after a type is selected?

| Option | Description | Selected |
|--------|-------------|----------|
| Close immediately, module appears | Popover closes; module created at auto-selected position; user can drag immediately | ✓ |
| Keep open for multi-add | Popover stays open after each selection for multiple adds in a row | |

**User's choice:** Close immediately, module appears

---

## Action Bar Placement

### Q1: Where should the action bar appear for a selected module?

| Option | Description | Selected |
|--------|-------------|----------|
| Floating above the module | Small toolbar directly above selected module; close to target; follows module on drag | ✓ |
| Fixed in the top controls bar | Action bar items appear in existing top bar when module is selected | |
| Floating below the module | Anchored to bottom edge of module | |

**User's choice:** Floating above the module

### Q2: What controls should the floating action bar contain?

| Option | Description | Selected |
|--------|-------------|----------|
| Z-order + Delete only | Bring Forward, Send Backward, Delete (with confirmation); matches MOD-02 spec exactly | ✓ |
| Z-order + Delete + module type label | Add the module's type name as a read-only label in the bar | |
| You decide | Claude picks based on spec and patterns | |

**User's choice:** Z-order + Delete only

### Q3: When the floating bar would go off-screen at the top, how should it adapt?

| Option | Description | Selected |
|--------|-------------|----------|
| Flip below the module | If bar would overflow above canvas top, show below module instead | ✓ |
| Always show above, clip if needed | Keep above even if partially off-screen | |
| You decide | Claude handles the edge case | |

**User's choice:** Flip below the module (standard popover/tooltip flip behavior)

---

## Canvas Fit & Scroll

### Q1: How should the canvas behave in the viewport?

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed pixel size, scrolls vertically | Canvas is exact page size; page scrolls to reveal; 1:1 grid | |
| Scale-to-fit viewport width | Canvas scales down to fit available viewport width | ✓ |
| Fixed pixel size, overflow hidden | Canvas clips at viewport edge; content at bottom inaccessible | |

**User's choice:** Scale-to-fit viewport width

### Q2: How should the scaling be implemented?

| Option | Description | Selected |
|--------|-------------|----------|
| CSS transform: scale() | Fixed pixel canvas; wrapper applies transform: scale(ratio); dnd-kit needs scale correction | ✓ |
| CSS width: 100% with aspect-ratio | Canvas width is 100% of container; height uses aspect-ratio; grid cells resize dynamically | |
| You decide | Claude picks the safest approach given dnd-kit constraints | |

**User's choice:** CSS transform: scale()

### Q3: How should dnd-kit drag be corrected for scale?

| Option | Description | Selected |
|--------|-------------|----------|
| Scale-corrected pointer sensor | Custom sensor wrapper reads scale ratio; divides delta.x/delta.y before drag handler | ✓ |
| You decide | Claude handles the scale-correction implementation detail | |

**User's choice:** Scale-corrected pointer sensor

---

## Auto-Placement Strategy

### Q1: Where should new modules appear on the canvas?

| Option | Description | Selected |
|--------|-------------|----------|
| First empty slot (top-left scan) | Scan left-to-right, top-to-bottom for first unoccupied area large enough for the module | ✓ |
| Canvas center | Place near center of canvas; modules overlap if many added without moving | |
| Cascade offset from last placed | Offset +2 cols, +2 rows from previous module position | |

**User's choice:** First empty slot (top-left scan)

### Q2: What if the canvas is full (no empty slot found)?

| Option | Description | Selected |
|--------|-------------|----------|
| Place at (0,0) overlapping existing | Fall back to top-left regardless; user can drag to free space | |
| Show a toast and cancel the add | Sonner toast; no module created; user must free space first | ✓ |
| You decide | Claude picks a sensible fallback | |

**User's choice:** Show a toast and cancel the add

---

## Claude's Discretion

- Exact pixel dimensions for A5 and Letter (derived from MAX_COLS/MAX_ROWS × 32px)
- Visual design of floating action bar (sizing, gap, shadows — follows shadcn tokens)
- Whether "Add module" toolbar button shows icon only or icon + text
- Z-index stacking values for action bar, selected module, unselected modules
- ResizeObserver cleanup pattern

## Deferred Ideas

None — discussion stayed within phase scope.
