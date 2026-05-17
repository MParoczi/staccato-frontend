# Phase 6: Canvas & Module Placement — Research

**Researched:** 2026-05-17
**Domain:** React drag-and-drop canvas, dnd-kit v6, resize handles, grid snapping, TanStack Query cache management
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** "Add module" button lives in the **existing LessonPage top controls bar** — not a floating canvas button and not a sidebar. It sits alongside the existing page navigation controls.

**D-02:** Clicking "Add module" opens a **shadcn Popover** containing a **3×4 grid** of module type tiles. Each tile shows the type-specific Lucide icon and the module type name label. The Popover component is not yet installed — planner must add `pnpm dlx shadcn@4.6.0 add popover`.

**D-03:** Selecting a module type **closes the popover immediately** and triggers module creation at the auto-selected position. No multi-add mode.

**D-04:** When a module is selected, a **floating action bar appears directly above** the selected module (positioned relative to the module element, not the top controls bar).

**D-05:** Action bar contains exactly: **Bring Forward**, **Send Backward**, and **Delete**. Delete triggers the existing confirmation dialog pattern (shadcn Dialog). No module type label or other controls.

**D-06:** If the floating bar would overflow above the canvas top boundary, it **flips below the module** instead. Standard flip behavior.

**D-07:** The canvas element has **fixed pixel dimensions** matching the notebook's page size (A4 = 768×1120px, Letter = 800×1056px, A5 = 544×768px). A wrapper element applies **`transform: scale(ratio)`** to visually fit the available viewport width.

**D-08:** Scale ratio = `containerWidth / canvasFixedWidth`. Computed on mount and on `ResizeObserver` changes to the wrapper.

**D-09:** dnd-kit drag uses a **scale-corrected pointer sensor**: divide `delta.x` and `delta.y` by the scale ratio before passing to drag handlers.

**D-10:** Auto-placement: **left-to-right, top-to-bottom grid scan** for first cell where the module's default footprint fits without overlapping and stays within canvas bounds.

**D-11:** If no empty slot is found, show a **Sonner toast** ("Canvas is full — move or delete a module first") and **cancel the add**. POST is never sent.

### Claude's Discretion

- Exact pixel dimensions and aspect ratios for A5 and Letter page sizes (derive from MAX_COLS/MAX_ROWS constants)
- Visual design of the floating action bar (height, gap, icon sizes — follow existing shadcn sizing tokens)
- Whether the "Add module" button uses a `Plus` icon + text label or icon-only (based on available toolbar space)
- Z-index stacking values for the floating action bar vs. selected module vs. unselected modules
- ResizeObserver cleanup pattern (follow existing hook patterns in the codebase)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CANVAS-01 | Dotted-grid canvas renders on each lesson page; background is CSS `radial-gradient` at 32px cell size matching the notebook's page dimensions | Canvas scaling section; grid constants table |
| CANVAS-02 | Users can load a lesson page and see all previously placed modules rendered at saved positions and sizes | TanStack Query section (`['modules', pageId]` query) |
| CANVAS-03 | Users can drag a module to a new position; position snaps to 32px grid on release; persisted via `PATCH /modules/{id}/layout` | dnd-kit integration section; AbortController section; API contract |
| CANVAS-04 | Users can resize a module via 8 drag handles; size snaps to grid; per-type min dims enforced; persisted via `PATCH /modules/{id}/layout` | Resize handle section; coordinate math table; API contract |
| CANVAS-05 | Users can adjust module z-order via Bring Forward/Send Backward; persisted via `PATCH /modules/{id}/layout` | Floating action bar section; API contract |
| CANVAS-06 | Modules stay within canvas bounds; drag and resize operations clamped | Clamping math in resize and drag sections |
| MOD-01 | Module palette: select type → auto-place → POST; appears immediately | Auto-placement section; API contract; shadcn Popover section |
| MOD-02 | Click module → select; shows resize handles and action bar; click canvas background → deselect | Module shell pattern; floating action bar section |
| MOD-03 | Each module shell: type name, Lucide icon, per-type header color; body shows empty placeholder | Module type registry table |
| MOD-04 | Delete module: confirm via Dialog → DELETE; disappears immediately (cache update) | TanStack Query invalidation; DeletePageDialog pattern |
| MOD-05 | Module type, position, size, z-index fully persisted; reload restores exact canvas state | API contract; TanStack Query section |

</phase_requirements>

---

## Summary

Phase 6 implements a fixed-size dotted-grid canvas with drag, resize, z-order, and delete for all 12 module types. The core technical challenge is the three-layer coordinate system: CSS-scaled canvas wrapper, grid-unit internal positions, and pixel-level pointer events. Each layer must be kept consistent or coordinate drift accumulates across operations.

The dnd-kit `useDraggable` hook is used for dragging; resize handles are **not** handled by dnd-kit — they use `onPointerDown` / `onPointerMove` directly with `setPointerCapture` for each of the 8 handle directions. The `DndContext` modifier approach (dividing `transform.x / scale`) is the clean way to correct for CSS `transform: scale()` on the canvas wrapper, avoiding drift without a custom sensor subclass.

TanStack Query owns the server-synced module list (`['modules', pageId]`). Local `useState` owns in-flight drag/resize visual state. A per-module `AbortController` ref prevents PATCH race conditions on rapid pointer events.

**Primary recommendation:** Build in the order — (1) canvas scaffold + grid background, (2) module shell components + module type registry, (3) drag/resize/z-order interactions, (4) POST/PATCH/DELETE wiring with TanStack Query.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Canvas rendering + scaling | Browser/Client | — | Pure CSS transform; no SSR involvement |
| Module list persistence | API/Backend | TanStack Query cache | Server is source of truth for gridX/Y/W/H/zIndex |
| Drag coordinate management | Browser/Client | — | dnd-kit processes pointer events client-side |
| Resize handle math | Browser/Client | — | Pointer events + DOM rect calculations only |
| Auto-placement scan | Browser/Client | — | Read-only scan of cached module list; no server round-trip |
| Module type registry | Browser/Client | — | Static `as const` config; no backend involvement |
| PATCH layout persistence | API/Backend | TanStack Query invalidation | AbortController prevents stale PATCH race |
| Delete confirmation + DELETE | API/Backend | TanStack Query invalidation | Follow existing DeletePageDialog pattern |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 | DndContext, useDraggable, PointerSensor, DragOverlay | Official latest; active maintenance; accessible by default |
| `@dnd-kit/utilities` | 3.2.2 | `CSS.Transform.toString()` helper | Official utility; avoids string-building drift |
| `shadcn popover` | via shadcn@4.6.0 | Module palette trigger | Matches existing shadcn component style in project |

[VERIFIED: npm registry] — `@dnd-kit/core@6.3.1` (published 2024-12-05), `@dnd-kit/utilities@3.2.2` (published 2023-11-06), source: github.com/clauderic/dnd-kit

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | 2.0.7 (already installed) | "Canvas is full" toast | Already in project; `toast.error(...)` |
| `@tanstack/react-query` | 5.100.10 (already installed) | Module list query + mutations | All server state; existing project pattern |

### Already Installed — No New Install Needed

| Library | Already In `package.json` |
|---------|--------------------------|
| `radix-ui` | Yes — Popover primitives are included |
| `lucide-react` | Yes — module type icons |
| `sonner` | Yes — canvas-full toast |
| `@tanstack/react-query` | Yes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@dnd-kit/core` useDraggable | `react-dnd` | dnd-kit has better pointer sensor accuracy and no HTML5 DnD API dependency |
| Native `onPointerMove` resize | `@dnd-kit/core` for resize too | dnd-kit's sortable preset doesn't model 8-handle resize; native pointer events are simpler |
| `CSS.Transform.toString` | Manual `translate3d(x,y,0)` string | Using the utility avoids off-by-one errors when scaleX/scaleY are non-1 |

**Installation:**

```bash
pnpm add @dnd-kit/core @dnd-kit/utilities
pnpm dlx shadcn@4.6.0 add popover
```

**Version verification:** [VERIFIED: npm registry]
- `npm view @dnd-kit/core version` → `6.3.1`
- `npm view @dnd-kit/utilities version` → `3.2.2`
- `shadcn` is already in `package.json` at `^4.7.0`

---

## Package Legitimacy Audit

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| `@dnd-kit/core` | npm | ~4 yrs | github.com/clauderic/dnd-kit | [OK] | Approved |
| `@dnd-kit/utilities` | npm | ~4 yrs | github.com/clauderic/dnd-kit | [OK] | Approved |
| `shadcn popover` | shadcn CLI (radix-ui) | — | github.com/shadcn-ui/ui | [OK] | Approved — installs via project's existing shadcn toolchain |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No postinstall scripts on `@dnd-kit/core` or `@dnd-kit/utilities`. [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
LessonPage (route: /app/notebooks/:id/lessons/:lessonId)
  │
  ├── Top Controls Bar
  │     └── "Add Module" Button → [PopoverTrigger]
  │                                  └── ModulePalette (3×4 grid)
  │                                        └── onSelect(type) →
  │                                              findAutoPlacement()
  │                                                 ├─ canvas full? → toast.error() [STOP]
  │                                                 └─ POST /pages/{pageId}/modules
  │                                                       └── invalidateQueries(['modules', pageId])
  │
  └── Canvas Wrapper (ResizeObserver → scale ratio)
        │   style: { height: canvasHeight * scale }
        └── Canvas Root (position: relative, fixed px size)
              │   style: { transform: scale(ratio), transformOrigin: 'top left' }
              │
              ├── DndContext (scale-corrected modifier + PointerSensor)
              │     │
              │     ├── ModuleShell × N (useDraggable, absolute positioned)
              │     │     │   style: { left: gridX*32, top: gridY*32,
              │     │     │            width: gridWidth*32, height: gridHeight*32,
              │     │     │            zIndex, transform: CSS.Transform.toString(t) }
              │     │     │
              │     │     ├── Header (type icon + name + header color)
              │     │     ├── Body (empty placeholder)
              │     │     ├── ResizeHandles × 8 (onPointerDown → pointermove)
              │     │     │     └── on release → snapToGrid → PATCH /modules/{id}/layout
              │     │     └── FloatingActionBar (absolute, bottom: 100% / flip if near top)
              │     │           ├── BringForward → PATCH zIndex+1
              │     │           ├── SendBackward → PATCH zIndex-1
              │     │           └── Delete → [DeleteModuleDialog]
              │     │
              │     └── onDragEnd → snapToGrid(gridX + delta.x/scale, ...) → PATCH
              │
              └── onClick (canvas root) → deselect all
```

### Recommended Project Structure

```
src/
├── types/
│   └── index.ts                        # Add Module, ModuleType, CreateModulePayload, PatchModuleLayoutPayload
│
└── features/
    └── lessons/
        └── canvas/
            ├── api/
            │   └── modulesApi.ts       # getModules, createModule, patchModuleLayout, deleteModule
            ├── components/
            │   ├── CanvasRoot.tsx       # DndContext, scale wrapper, ResizeObserver
            │   ├── ModuleShell.tsx      # useDraggable, resize handles, action bar
            │   ├── ModulePalette.tsx    # 3×4 Popover grid
            │   ├── FloatingActionBar.tsx
            │   ├── DeleteModuleDialog.tsx
            │   └── ResizeHandle.tsx     # single handle (direction prop)
            ├── hooks/
            │   └── useCanvasScale.ts    # ResizeObserver → scale ratio
            └── lib/
                ├── snapToGrid.ts        # snapToGrid(px, cell?) → grid units
                ├── moduleRegistry.ts    # MODULE_TYPE_REGISTRY as const
                └── autoPlacement.ts    # findAutoPlacement(modules, type, maxCols, maxRows)
```

---

## Pattern 1: DndContext Setup with Scale-Corrected Modifier

**What:** Wrap the canvas root in `DndContext`. Use a custom `Modifier` to divide raw pointer delta by scale ratio before dnd-kit's coordinate system sees it. This means `onDragEnd`'s `delta` is already in canvas-px units, matching the grid.

**Source:** [CITED: dndkit.com/legacy/api-documentation/modifiers] + [CITED: github.com/clauderic/dnd-kit issue #50]

```typescript
// src/features/lessons/canvas/lib/scaleModifier.ts
import type { Modifier } from '@dnd-kit/core'

export function createScaleModifier(getScale: () => number): Modifier {
  return ({ transform }) => ({
    ...transform,
    x: transform.x / getScale(),
    y: transform.y / getScale(),
  })
}
```

```typescript
// src/features/lessons/canvas/components/CanvasRoot.tsx
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { createScaleModifier } from '../lib/scaleModifier'
import { snapToGrid } from '../lib/snapToGrid'

const CELL = 32

export function CanvasRoot({ pageId, maxCols, maxRows, canvasWidth, canvasHeight }) {
  const scaleRef = useRef(1)
  const [modules, setModulesLocal] = useState<Module[]>([])  // mirror of query data

  const scaleModifier = useMemo(
    () => createScaleModifier(() => scaleRef.current),
    []
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  )

  function handleDragEnd({ active, delta }: DragEndEvent) {
    const module = modules.find(m => m.id === active.id)
    if (!module) return
    // delta is already scale-corrected by the modifier
    const newGridX = Math.max(
      0,
      Math.min(maxCols - module.gridWidth, snapToGrid(module.gridX * CELL + delta.x) / CELL)
    )
    const newGridY = Math.max(
      0,
      Math.min(maxRows - module.gridHeight, snapToGrid(module.gridY * CELL + delta.y) / CELL)
    )
    patchLayout(module.id, { gridX: newGridX, gridY: newGridY })
  }

  return (
    <DndContext sensors={sensors} modifiers={[scaleModifier]} onDragEnd={handleDragEnd}>
      {/* canvas content */}
    </DndContext>
  )
}
```

**Key insight:** `DndContext.modifiers` runs before `onDragEnd`; the delta that arrives in the handler is already in canvas-px space, not screen-px space. [CITED: dndkit.com/legacy/api-documentation/modifiers]

---

## Pattern 2: useDraggable — Module Shell Integration

**What:** Each `ModuleShell` calls `useDraggable`. The `transform` property is `null` when not dragging; when dragging it is `{ x, y, scaleX, scaleY }`. Use `CSS.Transform.toString(transform)` for the style prop — never a Tailwind dynamic class.

**Source:** [CITED: dndkit.com/legacy/api-documentation/draggable] + [CITED: github.com/dnd-kit/docs/blob/master/api-documentation/draggable/usedraggable.md]

```typescript
// src/features/lessons/canvas/components/ModuleShell.tsx
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const CELL = 32

interface ModuleShellProps {
  module: Module
  isSelected: boolean
  onSelect: (id: string) => void
}

export function ModuleShell({ module, isSelected, onSelect }: ModuleShellProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: module.id,
  })

  const style: React.CSSProperties = {
    position: 'absolute',
    left: module.gridX * CELL,
    top: module.gridY * CELL,
    width: module.gridWidth * CELL,
    height: module.gridHeight * CELL,
    zIndex: isDragging ? 9999 : module.zIndex,
    // NEVER use Tailwind for this — dynamic values are purged at build
    transform: CSS.Transform.toString(transform),
    touchAction: 'none',  // required for PointerSensor on touch devices
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(module.id)}
      {...attributes}
      {...listeners}
    >
      {/* header, body, resize handles rendered here */}
      {isSelected && <FloatingActionBar module={module} />}
      {isSelected && <ResizeHandles module={module} />}
    </div>
  )
}
```

**Why `CSS.Transform.toString` not Tailwind:** Tailwind v4 purges class names not present in source at build time. A string like `translate-[${x}px,${y}px]` will not survive the purge step. The style prop bypasses this entirely. [CITED: REQUIREMENTS.md key pitfalls]

---

## Pattern 3: Canvas Scale Wrapper + ResizeObserver

**What:** Outer wrapper div holds the ResizeObserver. Inner canvas div has fixed px dimensions and receives `transform: scale()`. The wrapper's height must be set to `canvasHeight * scale` to prevent layout collapse (scaled elements still occupy their original layout space).

**Source:** [CITED: CONTEXT.md D-07, D-08 specifics section] + [ASSUMED: ResizeObserver cleanup pattern follows existing hook conventions]

```typescript
// src/features/lessons/canvas/hooks/useCanvasScale.ts
import { useEffect, useRef, useState } from 'react'

export function useCanvasScale(canvasWidth: number) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0]?.contentRect.width ?? canvasWidth
      setScale(containerWidth / canvasWidth)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [canvasWidth])

  return { wrapperRef, scale }
}
```

```tsx
// Usage in CanvasRoot.tsx
const { wrapperRef, scale } = useCanvasScale(canvasWidth)

// Expose scale to modifier via ref
useEffect(() => { scaleRef.current = scale }, [scale])

return (
  <div
    ref={wrapperRef}
    // wrapper height = visual height after scale; prevents layout collapse
    style={{ height: canvasHeight * scale, position: 'relative' }}
  >
    <div
      // canvas root: position:relative ONLY — no transform here (breaks Radix portals)
      style={{
        position: 'relative',
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundImage:
          'radial-gradient(circle, color-mix(in oklch, var(--muted-foreground) 25%, transparent) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
      onClick={handleDeselectAll}
    >
      {/* DndContext and modules here */}
    </div>
  </div>
)
```

**Critical:** The canvas root (`position: relative`) must **not** have a `transform` property. Radix UI portals (Dialog, Popover) position themselves relative to the nearest stacking context; `transform` creates a new stacking context and breaks portal z-indexing. Only the inner canvas div gets `transform: scale()`. [CITED: REQUIREMENTS.md key pitfalls]

---

## Pattern 4: Resize Handles — 8-Direction Implementation

**What:** 8 handle elements positioned at corners and edges of the module. Each handle uses `onPointerDown` + `setPointerCapture` + `onPointerMove` + `onPointerUp`. No dnd-kit involvement. Coordinates computed per-direction math. Grid snapped on `pointerup`.

**Source:** [CITED: MDN setPointerCapture] + [ASSUMED: coordinate math pattern — standard for canvas editors]

### Handle Directions and Math

| Handle | Position | dx effect | dy effect | Notes |
|--------|----------|-----------|-----------|-------|
| `n` | top-center | — | y += dy/scale; h -= dy/scale | clamp: h >= minH |
| `s` | bottom-center | — | h += dy/scale | clamp: h >= minH, y+h <= maxRows |
| `e` | right-center | w += dx/scale | — | clamp: w >= minW, x+w <= maxCols |
| `w` | left-center | x += dx/scale; w -= dx/scale | — | clamp: w >= minW |
| `ne` | top-right | w += dx/scale | y += dy/scale; h -= dy/scale | combined |
| `nw` | top-left | x += dx/scale; w -= dx/scale | y += dy/scale; h -= dy/scale | combined |
| `se` | bottom-right | w += dx/scale | h += dy/scale | simplest corner |
| `sw` | bottom-left | x += dx/scale; w -= dx/scale | h += dy/scale | combined |

All `dx`/`dy` are raw screen-space pointer deltas. Divide by `scale` to get canvas-space deltas before applying to grid positions.

```typescript
// src/features/lessons/canvas/components/ResizeHandle.tsx
type HandleDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface ResizeHandleProps {
  direction: HandleDirection
  module: Module
  scale: number
  onResize: (patch: Partial<Pick<Module, 'gridX' | 'gridY' | 'gridWidth' | 'gridHeight'>>) => void
}

export function ResizeHandle({ direction, module, scale, onResize }: ResizeHandleProps) {
  const startRef = useRef<{ pointerX: number; pointerY: number; module: Module } | null>(null)

  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation()  // prevent DndContext drag from activating
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { pointerX: e.clientX, pointerY: e.clientY, module: { ...module } }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startRef.current) return
    const { pointerX, pointerY, module: orig } = startRef.current
    const dxPx = (e.clientX - pointerX) / scale  // canvas-space pixels
    const dyPx = (e.clientY - pointerY) / scale

    const CELL = 32
    // Convert canvas-px deltas to grid deltas (unsnapped, for live preview)
    let { gridX, gridY, gridWidth, gridHeight } = orig
    const def = MODULE_TYPE_REGISTRY[orig.moduleType]

    if (direction.includes('e')) gridWidth = Math.max(def.minWidth, orig.gridWidth + dxPx / CELL)
    if (direction.includes('s')) gridHeight = Math.max(def.minHeight, orig.gridHeight + dyPx / CELL)
    if (direction.includes('w')) {
      const newW = Math.max(def.minWidth, orig.gridWidth - dxPx / CELL)
      gridX = orig.gridX + orig.gridWidth - newW
      gridWidth = newW
    }
    if (direction.includes('n')) {
      const newH = Math.max(def.minHeight, orig.gridHeight - dyPx / CELL)
      gridY = orig.gridY + orig.gridHeight - newH
      gridHeight = newH
    }

    // Live preview: update local state (not persisted yet)
    onResize({ gridX, gridY, gridWidth, gridHeight })
  }

  function handlePointerUp() {
    startRef.current = null
    // Caller snaps to grid and triggers PATCH on pointerup
  }

  return (
    <div
      data-resize-handle={direction}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        cursor: `${direction}-resize`,
        // positioning by direction — e.g. se: right:0, bottom:0
        ...(getHandlePosition(direction)),
        width: 8,
        height: 8,
        background: 'var(--primary)',
        borderRadius: 2,
        zIndex: 10,
      }}
    />
  )
}

function getHandlePosition(dir: HandleDirection): React.CSSProperties {
  const pos: React.CSSProperties = {}
  if (dir.includes('n')) pos.top = -4
  if (dir.includes('s')) pos.bottom = -4
  if (dir.includes('e')) pos.right = -4
  if (dir.includes('w')) pos.left = -4
  if (dir === 'n' || dir === 's') pos.left = '50%', pos.marginLeft = -4
  if (dir === 'e' || dir === 'w') pos.top = '50%', pos.marginTop = -4
  return pos
}
```

**Grid snapping on release:** The caller's `onPointerUp` handler snaps via `snapToGrid`, then issues the PATCH:

```typescript
function handleResizeComplete(patch: Partial<Module>) {
  const snapped = {
    gridX: Math.round(patch.gridX ?? module.gridX),
    gridY: Math.round(patch.gridY ?? module.gridY),
    gridWidth: Math.round(patch.gridWidth ?? module.gridWidth),
    gridHeight: Math.round(patch.gridHeight ?? module.gridHeight),
  }
  // clamp to canvas bounds
  snapped.gridX = Math.max(0, Math.min(maxCols - snapped.gridWidth, snapped.gridX))
  snapped.gridY = Math.max(0, Math.min(maxRows - snapped.gridHeight, snapped.gridY))
  patchLayout(module.id, snapped)
}
```

---

## Pattern 5: AbortController Race Prevention

**What:** PATCH requests fire on every drag-end and resize-complete. If the user drags rapidly, multiple in-flight requests may resolve out of order. An `AbortController` ref per module ensures each new PATCH cancels the previous one.

**Source:** [CITED: REQUIREMENTS.md key pitfalls] + [ASSUMED: AbortController/Axios cancel pattern — standard]

```typescript
// src/features/lessons/canvas/api/modulesApi.ts
import { client } from '@/api/client'
import type { Module, PatchModuleLayoutPayload } from '@/types'

export async function patchModuleLayout(
  moduleId: string,
  payload: PatchModuleLayoutPayload,
  signal?: AbortSignal
): Promise<void> {
  await client.patch(`/modules/${moduleId}/layout`, payload, { signal })
}
```

```typescript
// In the component or custom hook managing PATCH:
const patchAbortRefs = useRef<Map<string, AbortController>>(new Map())

function patchLayout(moduleId: string, payload: PatchModuleLayoutPayload) {
  // Cancel any in-flight request for this module
  patchAbortRefs.current.get(moduleId)?.abort()
  const controller = new AbortController()
  patchAbortRefs.current.set(moduleId, controller)

  patchModuleLayout(moduleId, payload, controller.signal).catch((err: unknown) => {
    if (err instanceof Error && err.name === 'CanceledError') return  // Axios cancel
    toast.error(extractErrorMessage(err, 'Failed to save position'))
  })
}
```

**Why per-module:** If the user drags module A and simultaneously resizes module B, they need independent abort controllers. A single global controller would cancel unrelated operations.

---

## Pattern 6: Module Type Registry

**What:** A static `as const` map of all 12 module types with min dimensions, Lucide icon name, and header color. No enum (erasableSyntaxOnly constraint). Keyed by module type string matching the backend's `moduleType` field.

**Source:** [CITED: REQUIREMENTS.md Module Type Registry] + [CITED: STATE.md — as const pattern established in prior phases]

```typescript
// src/features/lessons/canvas/lib/moduleRegistry.ts
import type { LucideIcon } from 'lucide-react'
import {
  Heading,
  Type,
  AlignLeft,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Music,
  Music2,
  Guitar,
  FileMusic,
  ScrollText,
} from 'lucide-react'

export type ModuleType =
  | 'Title'
  | 'Subtitle'
  | 'TextBlock'
  | 'OrderedList'
  | 'UnorderedList'
  | 'CheckboxList'
  | 'Table'
  | 'ChordDiagram'
  | 'ChordProgression'
  | 'ChordTablatureGroup'
  | 'MusicalNotes'
  | 'SheetMusic'

export const MODULE_TYPES = [
  'Title',
  'Subtitle',
  'TextBlock',
  'OrderedList',
  'UnorderedList',
  'CheckboxList',
  'Table',
  'ChordDiagram',
  'ChordProgression',
  'ChordTablatureGroup',
  'MusicalNotes',
  'SheetMusic',
] as const satisfies readonly ModuleType[]

interface ModuleTypeDef {
  label: string
  icon: LucideIcon
  minWidth: number    // grid units
  minHeight: number   // grid units
  defaultWidth: number
  defaultHeight: number
  headerColor: string // CSS color string
}

export const MODULE_TYPE_REGISTRY: Record<ModuleType, ModuleTypeDef> = {
  Title:               { label: 'Title',          icon: Heading,      minWidth: 8, minHeight: 2, defaultWidth: 8,  defaultHeight: 2,  headerColor: '#f59e0b' },
  Subtitle:            { label: 'Subtitle',        icon: Type,         minWidth: 6, minHeight: 2, defaultWidth: 6,  defaultHeight: 2,  headerColor: '#fbbf24' },
  TextBlock:           { label: 'Text Block',      icon: AlignLeft,    minWidth: 4, minHeight: 3, defaultWidth: 6,  defaultHeight: 4,  headerColor: '#3b82f6' },
  OrderedList:         { label: 'Ordered List',    icon: ListOrdered,  minWidth: 4, minHeight: 3, defaultWidth: 5,  defaultHeight: 4,  headerColor: '#3b82f6' },
  UnorderedList:       { label: 'Unordered List',  icon: List,         minWidth: 4, minHeight: 3, defaultWidth: 5,  defaultHeight: 4,  headerColor: '#3b82f6' },
  CheckboxList:        { label: 'Checklist',       icon: CheckSquare,  minWidth: 4, minHeight: 3, defaultWidth: 5,  defaultHeight: 4,  headerColor: '#22c55e' },
  Table:               { label: 'Table',           icon: Table,        minWidth: 6, minHeight: 4, defaultWidth: 8,  defaultHeight: 5,  headerColor: '#a855f7' },
  ChordDiagram:        { label: 'Chord Diagram',   icon: Guitar,       minWidth: 3, minHeight: 4, defaultWidth: 4,  defaultHeight: 5,  headerColor: '#f97316' },
  ChordProgression:    { label: 'Progression',     icon: Music,        minWidth: 4, minHeight: 3, defaultWidth: 6,  defaultHeight: 4,  headerColor: '#f97316' },
  ChordTablatureGroup: { label: 'Tablature',       icon: Music2,       minWidth: 6, minHeight: 4, defaultWidth: 8,  defaultHeight: 5,  headerColor: '#f97316' },
  MusicalNotes:        { label: 'Notes',           icon: FileMusic,    minWidth: 6, minHeight: 3, defaultWidth: 8,  defaultHeight: 4,  headerColor: '#ef4444' },
  SheetMusic:          { label: 'Sheet Music',     icon: ScrollText,   minWidth: 8, minHeight: 5, defaultWidth: 10, defaultHeight: 6,  headerColor: '#ef4444' },
}
```

**[ASSUMED]** — specific Lucide icon name mapping (e.g., `Guitar`, `Music2`, `ScrollText`) is based on training knowledge of lucide-react exports. Verify exact icon names against `lucide-react@0.511.0` (currently installed) before implementation.

---

## Pattern 7: Canvas Dimensions

Grid constants from REQUIREMENTS.md: `cell = 32px`. Canvas pixel dimensions:

| Page Size | MAX_COLS | MAX_ROWS | Width (px) | Height (px) |
|-----------|----------|----------|------------|-------------|
| A4 | 24 | 35 | 768 | 1120 |
| Letter | 25 | 33 | 800 | 1056 |
| A5 | 17 | 24 | 544 | 768 |

Computed as `MAX_COLS × 32` and `MAX_ROWS × 32`. [CITED: REQUIREMENTS.md grid constants]

```typescript
// src/features/lessons/canvas/lib/canvasDimensions.ts
import type { NotebookPageSize } from '@/types'

export const CELL = 32

export const CANVAS_CONFIG = {
  A4:     { maxCols: 24, maxRows: 35, width: 768,  height: 1120 },
  Letter: { maxCols: 25, maxRows: 33, width: 800,  height: 1056 },
  A5:     { maxCols: 17, maxRows: 24, width: 544,  height: 768  },
} as const satisfies Record<NotebookPageSize, { maxCols: number; maxRows: number; width: number; height: number }>
```

---

## Pattern 8: Auto-Placement Algorithm

**What:** Scan left-to-right, top-to-bottom for the first cell where the module's `defaultWidth × defaultHeight` footprint fits with no overlap and stays within canvas bounds.

**Source:** [CITED: CONTEXT.md D-10, D-11]

```typescript
// src/features/lessons/canvas/lib/autoPlacement.ts
import type { Module } from '@/types'
import { MODULE_TYPE_REGISTRY, type ModuleType } from './moduleRegistry'

interface PlacementResult {
  found: true; gridX: number; gridY: number; gridWidth: number; gridHeight: number
} | { found: false }

export function findAutoPlacement(
  existingModules: Module[],
  moduleType: ModuleType,
  maxCols: number,
  maxRows: number
): PlacementResult {
  const def = MODULE_TYPE_REGISTRY[moduleType]
  const w = def.defaultWidth
  const h = def.defaultHeight

  // Build occupied-cell set: "x,y" strings for all cells occupied by any module
  const occupied = new Set<string>()
  for (const m of existingModules) {
    for (let row = m.gridY; row < m.gridY + m.gridHeight; row++) {
      for (let col = m.gridX; col < m.gridX + m.gridWidth; col++) {
        occupied.add(`${col},${row}`)
      }
    }
  }

  // Scan left-to-right, top-to-bottom
  for (let row = 0; row <= maxRows - h; row++) {
    for (let col = 0; col <= maxCols - w; col++) {
      if (fits(col, row, w, h, occupied)) {
        return { found: true, gridX: col, gridY: row, gridWidth: w, gridHeight: h }
      }
    }
  }
  return { found: false }
}

function fits(col: number, row: number, w: number, h: number, occupied: Set<string>): boolean {
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      if (occupied.has(`${c},${r}`)) return false
    }
  }
  return true
}
```

**Edge cases:**
- Module at right boundary: `col <= maxCols - w` prevents overflow
- Last row: `row <= maxRows - h` prevents overflow
- Canvas full: all cells occupied → returns `{ found: false }` → caller shows toast, no POST

---

## Pattern 9: TanStack Query Integration

**What:** Modules are fetched with `useQuery(['modules', pageId])`. Mutations (POST, DELETE) call `invalidateQueries` on success. PATCH does **not** invalidate — it updates local state directly to avoid refetch jitter on every pointer event.

**Source:** [CITED: STATE.md TanStack Query pattern] + [CITED: LessonPage.tsx existing pattern]

```typescript
// src/features/lessons/canvas/api/modulesApi.ts
import { client } from '@/api/client'
import type { Module, CreateModulePayload, PatchModuleLayoutPayload } from '@/types'

export async function getModules(pageId: string): Promise<Module[]> {
  const { data } = await client.get<Module[]>(`/pages/${pageId}/modules`)
  return data
}

export async function createModule(pageId: string, payload: CreateModulePayload): Promise<Module> {
  const { data } = await client.post<Module>(`/pages/${pageId}/modules`, payload)
  return data
}

export async function patchModuleLayout(
  moduleId: string,
  payload: PatchModuleLayoutPayload,
  signal?: AbortSignal
): Promise<void> {
  await client.patch(`/modules/${moduleId}/layout`, payload, { signal })
}

export async function deleteModule(moduleId: string): Promise<void> {
  await client.delete(`/modules/${moduleId}`)
}
```

```typescript
// Query pattern in CanvasRoot.tsx or a parent hook
const { data: modules = [] } = useQuery({
  queryKey: ['modules', pageId],
  queryFn: () => getModules(pageId),
  enabled: !!pageId,
})

// POST with invalidation
const createMutation = useMutation({
  mutationFn: (payload: CreateModulePayload) => createModule(pageId, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['modules', pageId] })
  },
  onError: (error) => {
    toast.error(extractErrorMessage(error, 'Failed to add module'))
  },
})

// DELETE with invalidation
const deleteMutation = useMutation({
  mutationFn: (moduleId: string) => deleteModule(moduleId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['modules', pageId] })
  },
})
```

**PATCH strategy:** Do NOT use `useMutation` for PATCH layout. Call `patchModuleLayout` directly with an AbortController signal, as shown in Pattern 5. PATCH is fire-and-forget with abort; invalidation after each PATCH would cause visible refetch flickering during active drag sessions.

---

## Pattern 10: shadcn Popover for Module Palette

**What:** Install popover component via shadcn CLI. Wrap the "Add module" button in `PopoverTrigger`. The popover content renders the 3×4 module type grid.

**Source:** [CITED: ui.shadcn.com/docs/components/radix/popover] + [CITED: CONTEXT.md D-02]

**Install:**
```bash
pnpm dlx shadcn@4.6.0 add popover
```

This installs `src/components/ui/popover.tsx`. Note: `radix-ui` is already in the project's dependencies — the shadcn install only adds the component file, not a new npm package.

```tsx
// src/features/lessons/canvas/components/ModulePalette.tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { MODULE_TYPES, MODULE_TYPE_REGISTRY } from '../lib/moduleRegistry'
import type { ModuleType } from '../lib/moduleRegistry'

interface ModulePaletteProps {
  onSelect: (type: ModuleType) => void
}

export function ModulePalette({ onSelect }: ModulePaletteProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(type: ModuleType) {
    setOpen(false)   // D-03: close immediately on selection
    onSelect(type)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="size-4 mr-1" />
          <span className="hidden sm:inline">Add module</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start">
        {/* 3 columns × 4 rows grid */}
        <div className="grid grid-cols-3 gap-1">
          {MODULE_TYPES.map((type) => {
            const def = MODULE_TYPE_REGISTRY[type]
            const Icon = def.icon
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelect(type)}
                className="flex flex-col items-center gap-1 rounded p-2 text-xs hover:bg-accent hover:text-accent-foreground"
                style={{ minWidth: 80, minHeight: 64 }}
              >
                <Icon className="size-5" />
                <span className="text-center leading-tight">{def.label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

---

## Pattern 11: Floating Action Bar with Flip Logic

**What:** Absolute-positioned element above the selected module. Checks if `module.gridY * scale < actionBarHeight` to flip below.

**Source:** [CITED: CONTEXT.md D-04, D-05, D-06]

```tsx
// src/features/lessons/canvas/components/FloatingActionBar.tsx
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Module } from '@/types'

interface FloatingActionBarProps {
  module: Module
  scale: number
  onBringForward: () => void
  onSendBackward: () => void
  onDelete: () => void
}

const ACTION_BAR_HEIGHT = 36  // px, approximate

export function FloatingActionBar({
  module, scale, onBringForward, onSendBackward, onDelete
}: FloatingActionBarProps) {
  // D-06: flip below if module top edge is too close to canvas top
  const moduleTopPx = module.gridY * 32 * scale
  const flipped = moduleTopPx < ACTION_BAR_HEIGHT + 8

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        // above: bottom: 100% + 4px gap; below: top: 100% + 4px gap
        ...(flipped
          ? { top: 'calc(100% + 4px)' }
          : { bottom: 'calc(100% + 4px)' }),
        zIndex: 100,
      }}
      // stop propagation so clicking the bar doesn't deselect the module
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 rounded-md border bg-background shadow-md px-1 py-0.5">
        <Button variant="ghost" size="icon-sm" onClick={onBringForward} title="Bring forward">
          <ChevronUp className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onSendBackward} title="Send backward">
          <ChevronDown className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} title="Delete">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
```

---

## Pattern 12: Module Types in `src/types/index.ts`

Following the established `src/types/index.ts` pattern, add:

```typescript
// Additions to src/types/index.ts
import type { ModuleType } from '@/features/lessons/canvas/lib/moduleRegistry'
// NOTE: importing type from feature is acceptable as types/index.ts is not a feature module

export interface Module {
  id: string
  pageId: string
  moduleType: string    // matches backend string field
  gridX: number
  gridY: number
  gridWidth: number
  gridHeight: number
  zIndex: number
  content: unknown      // opaque in Phase 6; typed per module in Phases 7–9
  createdAt: string
  updatedAt: string
}

export interface CreateModulePayload {
  moduleType: string
  gridX: number
  gridY: number
  gridWidth: number
  gridHeight: number
  zIndex: number
  content?: unknown
}

export interface PatchModuleLayoutPayload {
  gridX?: number
  gridY?: number
  gridWidth?: number
  gridHeight?: number
  zIndex?: number
}
```

**API Contract (from swagger.json):**

`GET /pages/{pageId}/modules` — returns `Module[]`
`POST /pages/{pageId}/modules` — body: `CreateModuleRequest` → returns `Module`
`PATCH /modules/{moduleId}/layout` — body: `PatchModuleLayoutRequest`
`DELETE /modules/{moduleId}` — no body

`CreateModuleRequest` fields: `moduleType`, `gridX`, `gridY`, `gridWidth`, `gridHeight`, `zIndex`, `content`
`PatchModuleLayoutRequest` fields: `gridX`, `gridY`, `gridWidth`, `gridHeight`, `zIndex`

[VERIFIED: swagger.json in codebase]

---

## Pattern 13: snapToGrid Utility

A single utility called at ALL write paths (dragEnd, resizeComplete, z-order) prevents coordinate drift.

```typescript
// src/features/lessons/canvas/lib/snapToGrid.ts
export const CELL = 32

/** Snap a pixel value to the nearest grid cell boundary */
export function snapToGrid(px: number, cellSize: number = CELL): number {
  return Math.round(px / cellSize) * cellSize
}

/** Convert a pixel value to grid units (snapped) */
export function pxToGrid(px: number, cellSize: number = CELL): number {
  return Math.round(px / cellSize)
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag activation + pointer events | Custom pointer event drag system | `useDraggable` + `PointerSensor` | Handles touch, keyboard, accessibility, multi-pointer edge cases |
| CSS transform string for drag | `translate3d(${x}px,${y}px,0)` string | `CSS.Transform.toString(transform)` | Handles scaleX/scaleY properly; avoids string formatting bugs |
| Portal-based popover | Custom popover with absolute position | shadcn `Popover` (Radix portal) | Focus trapping, outside-click dismiss, keyboard support, a11y |
| Delete confirmation | Window.confirm | shadcn `Dialog` | Project convention; consistent UX; follows existing DeletePageDialog |
| Toast notification | Alert/inline message | `sonner` `toast.error()` | Already installed; consistent with project; no new dependency |

**Key insight:** The resize handle coordinate math is genuinely simple enough to hand-roll (8 directions × 2 equations each). Do not add `re-resizable` or `react-rnd` — they cannot snap to a 32px grid on commit, and they add opacity over the coordinate system that will cause drift.

---

## Common Pitfalls

### Pitfall 1: Tailwind Dynamic Classes Purged at Build

**What goes wrong:** Writing `className={`translate-x-[${x}px]`}` works in dev mode but silently renders no transform in production build.

**Why it happens:** Tailwind v4 extracts class names at build time. Dynamic string interpolation produces class names not present in source → purge removes them.

**How to avoid:** Always use `style={{ transform: CSS.Transform.toString(transform) }}` for drag transforms. Use `style={{ left, top, width, height }}` for position/size. [CITED: REQUIREMENTS.md key pitfalls]

**Warning signs:** Modules jump to wrong position on first drag in production but not in dev.

---

### Pitfall 2: Portal Z-Index Break from Canvas `transform`

**What goes wrong:** Radix Dialog and Popover render into a portal. If the canvas root has `transform: scale()` applied, the portal positions itself relative to the stacking context created by the transform, not the viewport.

**Why it happens:** CSS `transform` creates a new stacking context. Radix portals use `position: fixed` and rely on the viewport as their reference.

**How to avoid:** Apply `transform: scale()` only to the **inner** canvas div, never to any ancestor that also has children using Radix portals. The **wrapper** div (ResizeObserver target) has no transform. [CITED: REQUIREMENTS.md key pitfalls]

**Warning signs:** DeleteModuleDialog appears clipped inside the canvas area or positioned incorrectly.

---

### Pitfall 3: PATCH Race Condition

**What goes wrong:** User drags quickly; three PATCH requests in-flight. Server receives them out of order; last write wins with stale data, overwriting the user's intended final position.

**Why it happens:** `async` PATCH calls in `onDragEnd` / `onPointerUp` are not serialized.

**How to avoid:** AbortController per module ref (Pattern 5). Every new PATCH aborts the previous one for that module. [CITED: REQUIREMENTS.md key pitfalls]

**Warning signs:** Module snaps back to a previous position after rapid drag.

---

### Pitfall 4: Uncorrected Scale Coordinate Drift

**What goes wrong:** At `scale = 0.7`, dragging 100 screen pixels moves the module 100 canvas pixels instead of 143 canvas pixels. After drag, module snaps to wrong grid cell.

**Why it happens:** dnd-kit reports `delta` in screen pixels. The canvas is CSS-scaled, so 1 canvas px ≠ 1 screen px.

**How to avoid:** Apply `createScaleModifier` in `DndContext.modifiers`. For resize handles, divide `(e.clientX - startX)` by `scale` before applying to grid units. [CITED: github.com/clauderic/dnd-kit issue #50]

**Warning signs:** Modules drift toward canvas origin over repeated drag cycles at non-1 scale ratios.

---

### Pitfall 5: e.stopPropagation Missing on Action Bar / Resize Handles

**What goes wrong:** Clicking the action bar's Delete button also triggers the module's `onClick` (selection) and possibly the canvas root's `onClick` (deselect all).

**Why it happens:** React event bubbling; canvas root has a click handler for deselect.

**How to avoid:** All interactive children (action bar, resize handles, palette tiles) call `e.stopPropagation()` in their click and pointer handlers. The action bar wrapper also needs `onClick(e => e.stopPropagation())`.

---

### Pitfall 6: snapToGrid Not Applied at All Write Paths

**What goes wrong:** Drag uses snap, but z-order PATCH sends a non-rounded `zIndex`. Or a resize's live preview (unsnapped) state is passed to the PATCH instead of the snapped final state.

**Why it happens:** Two code paths (dragEnd and resizeComplete) each compute PATCH payloads; if one is missing `snapToGrid()`, positions drift by sub-pixel amounts after many operations.

**How to avoid:** Route all PATCH calls through a single `patchLayout` function that always applies `pxToGrid()`/`snapToGrid()`. Never send live-preview (floating-point) values to the API. [CITED: REQUIREMENTS.md key pitfalls]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@dnd-kit/sortable` for free canvas | `useDraggable` (core) for free-position drag | — | Sortable implies list order; free canvas needs raw delta accumulation |
| `window.addEventListener` for resize handles | `setPointerCapture` on handle element | Modern browsers | Pointer capture eliminates need for global event listener cleanup |
| CSS `resize` property | Custom 8-handle resize | — | CSS resize cannot be grid-snapped; no per-direction control |
| `@dnd-kit/modifiers` package | Inline custom Modifier function | — | `@dnd-kit/modifiers` package adds a dependency for 3 lines of math |

**Deprecated/outdated:**
- `@dnd-kit/modifiers` package: not needed. The modifier system is built into `@dnd-kit/core`. The external package is an optional extras layer for pre-built modifiers (restrictToWindow, etc.). For scale correction, write the modifier inline.
- `MouseSensor` + `TouchSensor` separately: `PointerSensor` is the modern replacement that handles both.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lucide icon names (`Guitar`, `Music2`, `ScrollText`, etc.) for the 12 module types | Module Type Registry | Wrong icon name → runtime error; verify against `lucide-react@0.511.0` exports before use |
| A2 | `pnpm dlx shadcn@4.6.0 add popover` installs only `src/components/ui/popover.tsx` (no new npm package, since `radix-ui` bundle already installed) | shadcn Popover section | If shadcn adds a separate `@radix-ui/react-popover` dependency, package.json will diverge from the bundled `radix-ui` approach |
| A3 | `Modifier` type from `@dnd-kit/core` accepts `({ transform }) => Transform` signature | Scale-corrected modifier pattern | If the Modifier interface has changed, the custom modifier may not typecheck |
| A4 | `size-icon-sm` Button variant exists in `src/components/ui/button.tsx` (used in action bar) | Floating action bar pattern | May need to use `size="sm"` or `size="icon"` instead; check button.tsx before implementing |
| A5 | `content` field on the Module response is `unknown` / nullable in Phase 6 | types/index.ts additions | If backend sends typed content for existing modules, the type needs to be widened |

---

## Open Questions

1. **What is the backend's Module response shape for `GET /pages/{pageId}/modules`?**
   - What we know: swagger.json defines `CreateModuleRequest` with `moduleType`, `gridX`, `gridY`, `gridWidth`, `gridHeight`, `zIndex`, `content`
   - What's unclear: The GET response is `"200": { "description": "OK" }` with no schema reference — the exact response fields (especially whether `pageId`, `createdAt`, `updatedAt` are included) are not documented in swagger.json
   - Recommendation: Confirm with a live API call or backend developer before writing the `Module` interface in `types/index.ts`. The fields listed in the interface above are safe assumptions based on prior Lesson/LessonPage patterns.

2. **What zIndex values do modules start with, and what are the increment/decrement steps?**
   - What we know: `PatchModuleLayoutRequest` accepts `zIndex: int32`; `CreateModuleRequest` includes `zIndex`
   - What's unclear: What initial zIndex to assign to a new module (0? 1? current max + 1?); what step size for Bring Forward / Send Backward
   - Recommendation: Use `zIndex = existingModules.length` for new modules; increment/decrement by 1 for forward/backward. Confirm with backend if z-index has a uniqueness constraint.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `pnpm dlx shadcn` | Yes | 22.x | — |
| pnpm | Package manager | Yes | present | — |
| `@dnd-kit/core` | Drag interactions | Not yet installed | 6.3.1 available | — |
| `@dnd-kit/utilities` | CSS.Transform helper | Not yet installed | 3.2.2 available | — |
| shadcn popover | Module palette | Not yet installed | — | — |
| Vite | Build | Yes | 8.x | — |

**Missing dependencies with no fallback:**
- `@dnd-kit/core` — must be installed before canvas interactions can be built
- `@dnd-kit/utilities` — must be installed before module shell drag transforms
- shadcn popover component — must be installed before palette UI

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CANVAS-01 | Canvas renders with correct px dimensions for each page size | unit | `pnpm test src/features/lessons/canvas/` | No — Wave 0 |
| CANVAS-03 | snapToGrid utility returns correct grid units | unit | `pnpm test src/features/lessons/canvas/lib/` | No — Wave 0 |
| CANVAS-06 | Clamp function keeps modules within bounds | unit | `pnpm test src/features/lessons/canvas/lib/` | No — Wave 0 |
| MOD-01 | Auto-placement: finds first empty slot left-to-right, top-to-bottom | unit | `pnpm test src/features/lessons/canvas/lib/` | No — Wave 0 |
| MOD-01 | Auto-placement: returns found:false when canvas full | unit | `pnpm test src/features/lessons/canvas/lib/` | No — Wave 0 |
| MOD-03 | Module shell renders type name and header color | unit (RTL) | `pnpm test src/features/lessons/canvas/components/` | No — Wave 0 |
| MOD-04 | Delete confirmation dialog renders and calls DELETE on confirm | unit (RTL) | `pnpm test src/features/lessons/canvas/components/` | No — Wave 0 |
| CANVAS-02, MOD-05 | Module list query uses correct query key `['modules', pageId]` | unit | `pnpm test src/features/lessons/canvas/` | No — Wave 0 |

Drag/resize pointer interactions (CANVAS-03, CANVAS-04) are inherently manual-test-first. Unit tests cover the math utilities; integration tests cover rendering and API wiring.

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/lessons/canvas/lib/snapToGrid.test.ts` — covers CANVAS-03, CANVAS-06
- [ ] `src/features/lessons/canvas/lib/autoPlacement.test.ts` — covers MOD-01
- [ ] `src/features/lessons/canvas/lib/canvasDimensions.test.ts` — covers CANVAS-01 dimension calculations
- [ ] `src/features/lessons/canvas/components/ModuleShell.test.tsx` — covers MOD-03
- [ ] `src/features/lessons/canvas/components/DeleteModuleDialog.test.tsx` — covers MOD-04
- [ ] `src/test-setup.ts` already exists — no framework install needed

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | All API calls go through `src/api/client.ts` with auth interceptor (established in Phase 2) |
| V3 Session Management | No | Session handling is in authStore; no changes in Phase 6 |
| V4 Access Control | No | Backend enforces ownership; frontend sends pageId and moduleId |
| V5 Input Validation | Yes — partial | `gridX`, `gridY`, `gridWidth`, `gridHeight`, `zIndex` are integers; validate with `Number.isInteger()` and range checks before POST/PATCH; clamp to `[0, maxCols/maxRows]` |
| V6 Cryptography | No | No crypto in Phase 6 |

**Additional:** No `dangerouslySetInnerHTML` in any module shell or palette component (CLAUDE.md constraint). Module type names and labels come from the static `MODULE_TYPE_REGISTRY` constant — no user-supplied HTML rendered anywhere in Phase 6.

---

## Sources

### Primary (HIGH confidence)
- `.planning/swagger.json` (codebase) — authoritative API contract: `CreateModuleRequest`, `PatchModuleLayoutRequest`, all module endpoints
- `.planning/REQUIREMENTS.md` (codebase) — module type registry, grid constants, key pitfalls
- `.planning/phases/06-canvas-module-placement/06-CONTEXT.md` (codebase) — all locked decisions D-01 through D-11
- `.planning/STATE.md` (codebase) — established patterns from prior phases
- `src/pages/LessonPage.tsx`, `src/features/lessons/api/lessonPagesApi.ts`, `src/features/lessons/components/DeletePageDialog.tsx` (codebase) — code patterns to follow
- `src/types/index.ts` (codebase) — type pattern to extend
- `src/api/client.ts` (codebase) — shared Axios instance with AbortSignal support

### Secondary (MEDIUM confidence)
- [dndkit.com/legacy/api-documentation/modifiers](https://dndkit.com/legacy/api-documentation/modifiers/) — modifier function signature, snapToGrid example
- [dndkit.com/legacy/api-documentation/draggable](https://dndkit.com/legacy/api-documentation/draggable/) — useDraggable API, transform `{x, y, scaleX, scaleY}`
- [dndkit.com/legacy/api-documentation/sensors/pointer](https://dndkit.com/legacy/api-documentation/sensors/pointer/) — PointerSensor activation constraints, touch-action
- [ui.shadcn.com/docs/components/radix/popover](https://ui.shadcn.com/docs/components/radix/popover) — Popover install command, component structure, align/side props
- [github.com/clauderic/dnd-kit issue #50](https://github.com/clauderic/dnd-kit/issues/50) — scale-corrected drag overlay pattern
- [npm: @dnd-kit/core@6.3.1](https://www.npmjs.com/package/@dnd-kit/core) — confirmed version, source repo
- [npm: @dnd-kit/utilities@3.2.2](https://www.npmjs.com/package/@dnd-kit/utilities) — confirmed version, source repo

### Tertiary (LOW confidence)
- slopcheck verification: both `@dnd-kit/core` and `@dnd-kit/utilities` rated [OK]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed on npm registry; packages rated [OK] by slopcheck; source repos verified
- dnd-kit integration patterns: MEDIUM-HIGH — cross-verified across official docs pages and GitHub issues
- Architecture: HIGH — derived directly from locked decisions in CONTEXT.md and codebase patterns
- Auto-placement algorithm: HIGH — pure logic derived from locked D-10/D-11 decisions
- Pitfalls: HIGH — all 6 pitfalls cited from REQUIREMENTS.md or verified with official sources
- Module type registry icon names: LOW (A1) — Lucide icon name mapping requires verification at implementation time

**Research date:** 2026-05-17
**Valid until:** 2026-06-17 (dnd-kit is stable; shadcn component generation follows versioned shadcn@4.6.0 CLI)
