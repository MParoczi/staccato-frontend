# Features Research: v0.6 Canvas & Module Placement

## Grid Design

**Grid unit:** 32px cells. Rationale: matches 5mm dot spacing at 2× density; fits well with A4/Letter page sizes; divides evenly into common module widths.

**Canvas size:** Fixed to logical page dimensions (e.g., A4 at 96dpi = 794×1123px). Canvas scrolls vertically if content overflows. No infinite canvas in v0.6.

**Dot rendering:** CSS `background-image: radial-gradient(circle, var(--dot-color) 1px, transparent 1px)` with `background-size: 32px 32px`. Already partially implemented as a placeholder in LessonPage.

## Module Placement

### Table Stakes (must-have for v0.6)
| Feature | Description |
|---------|-------------|
| Add module | Toolbar button → opens module type picker → click places at default position |
| Drag to move | dnd-kit useDraggable; snap to grid on drop |
| Resize | Custom corner/edge handles; snap to grid; enforce per-type minimum dimensions |
| Z-order | Bring Forward / Send Backward buttons in module toolbar |
| Delete module | Delete button in per-module toolbar; confirmation for non-empty modules |
| Select module | Click to select (shows handles + toolbar); click canvas to deselect |
| Module shell | Colored header (type name + icon), empty body placeholder, selection state |

### Differentiators (nice-to-have, defer to later phases)
| Feature | Description | Defer to |
|---------|-------------|---------|
| Multi-select | Rubber-band select or Shift+click | Post v0.6 |
| Keyboard nudge | Arrow keys move selected module by 1 grid cell | Post v0.6 |
| Copy/paste | Duplicate module with content | Phase 7+ |
| Undo/redo | 50-step history with 150ms coalescing | Phase 7 (per spec) |
| Module locking | Lock position to prevent accidental drag | Post v0.6 |
| Canvas zoom | Zoom in/out for detail work | Post v0.6 |

### Anti-Features (do not build)
- Infinite canvas scroll (fixes page to physical dimensions)
- Auto-layout / snap-to-neighbor (conflicts with free-form notebook feel)
- Real-time collaborative cursors (out of scope per PROJECT.md)

## Module Type Shells (12 types)

Each shell shows in Phase 6 as a styled container with no content editing. The 12 types:

| # | Module Type | Min Dimensions | Header Color |
|---|-------------|---------------|--------------|
| 1 | Title | 8w × 2h | Amber |
| 2 | Subtitle | 6w × 2h | Amber/muted |
| 3 | TextBlock | 4w × 3h | Blue |
| 4 | OrderedList | 4w × 3h | Blue |
| 5 | UnorderedList | 4w × 3h | Blue |
| 6 | CheckboxList | 4w × 3h | Green |
| 7 | Table | 6w × 4h | Purple |
| 8 | ChordDiagram | 3w × 4h | Orange |
| 9 | ChordProgression | 4w × 3h | Orange |
| 10 | ChordTablatureGroup | 6w × 4h | Orange |
| 11 | MusicalNotes | 6w × 3h | Red |
| 12 | SheetMusic | 8w × 5h | Red |

Shell content: module type icon (Lucide) + type name label + "Click to edit" placeholder text (shown only when selected).

## Selection UX

- Click module → selected (shows 8 resize handles + per-module action bar)
- Click canvas background → deselect all
- Only one module selected at a time in v0.6
- Selected module renders above others (temporary z-index boost during selection)

## Resize UX
- 8 handles: 4 corners + 4 edges
- Drag handle → live preview (CSS transform) → snap on release
- Minimum dimension enforced: cannot resize below per-type min (clamped)
- Canvas boundary enforced: cannot resize outside canvas bounds
