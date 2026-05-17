# Stack Research: v0.6 Canvas & Module Placement

## New Dependencies Required

### Core: dnd-kit
- `@dnd-kit/core` ^6.3.1 — DndContext, useDraggable, useDroppable, sensors, DragOverlay
- `@dnd-kit/utilities` ^3.2.2 — CSS.Transform helpers (transform-to-string, etc.)
- **NOT needed:** `@dnd-kit/sortable` (for list reordering — irrelevant for 2D canvas)
- **NOT needed:** `@dnd-kit/modifiers` (grid snapping can be done manually in onDragEnd handler)

**React 19 compatibility:** dnd-kit 6.x is confirmed compatible with React 19 and Strict Mode. No known issues with double-mount or event handler deduplication.

### No Additional Libraries Needed
- **Resize handles:** Custom CSS handles (absolutely positioned corner/edge divs with pointer events). Do NOT use `react-resizable`, `re-resizable`, or CSS `resize` property — none play well with absolute-positioned grid modules.
- **Grid snapping:** Math.round(delta / CELL_SIZE) in onDragEnd — no library needed.
- **Z-index management:** Local state + button clicks — no library needed.
- **Canvas measurement:** `useRef` + ResizeObserver or `getBoundingClientRect()` — no library needed.

## What NOT to Add
- `react-grid-layout` — prescribes a fixed grid UX, conflicts with free-form placement goal
- `interact.js` — heavy, duplicates dnd-kit, not React-native
- `@dnd-kit/modifiers` — snapping modifier snaps during drag (visual); we want snap-on-drop only
- `react-rnd` — combines drag+resize but is opinionated about handles and conflicts with dnd-kit

## Tailwind v4 Integration Notes
- Use `style` prop (not Tailwind classes) for dynamic transforms during drag: `style={{ transform: CSS.Transform.toString(transform) }}`
- Tailwind v4's `@layer` system does not purge inline `style` values — safe to use
- CSS custom properties in `src/index.css` can define CELL_SIZE and canvas palette tokens

## TypeScript Notes (erasableSyntaxOnly)
- `UniqueIdentifier` from dnd-kit is `string | number` — always cast to `string` for module IDs
- dnd-kit event types (DragEndEvent, DragStartEvent) import with `import type` (verbatimModuleSyntax)
- Module type registry: use `as const` union, NOT enum
