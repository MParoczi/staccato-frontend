# Pitfalls Research: v0.6 Canvas & Module Placement

## P1 — dnd-kit Transform During Drag (HIGH)

**Problem:** During drag, dnd-kit provides a `transform` object from `useDraggable`. If applied via Tailwind utility class (e.g., `translate-x-[${x}px]`), Tailwind's purge will remove the class. The module won't move.

**Prevention:** Always apply drag transform via `style={{ transform: CSS.Transform.toString(transform) }}`, never via Tailwind class.

**Hits:** Plan that implements CanvasModule.tsx drag behavior.

---

## P2 — React 19 Strict Mode + dnd-kit (LOW)

**Problem:** React 19 Strict Mode double-mounts. Earlier dnd-kit versions had issues with event listener deduplication in Strict Mode.

**Prevention:** dnd-kit 6.3+ is confirmed Strict Mode safe. Use `PointerSensor` (not MouseSensor) — pointer events dedup correctly in React 19 SM.

**Hits:** Initial dnd-kit installation plan.

---

## P3 — PATCH /layout Race Condition (MEDIUM)

**Problem:** User drags module A → PATCH in flight → drags module A again before response → two PATCHes in flight, server applies them out of order.

**Prevention:** AbortController per module; abort prior request before issuing new PATCH. Pattern:
```ts
const controllerRef = useRef<AbortController | null>(null)
const patchLayout = (data) => {
  controllerRef.current?.abort()
  controllerRef.current = new AbortController()
  patchModuleLayout(id, data, { signal: controllerRef.current.signal })
}
```

**Hits:** Plan implementing patchLayout mutation.

---

## P4 — Grid Coordinate Off-by-One (HIGH)

**Problem:** Grid snapping math `Math.round(delta / CELL_SIZE)` can drift if the initial module position isn't snapped. If a module was placed at a non-snapped position, every subsequent drag accumulates error.

**Prevention:** Always snap initial placement on POST (round gridX/gridY before sending). Assert `gridX % 1 === 0` at all write paths. Use a single `snapToGrid(px: number): number => Math.round(px / CELL_SIZE)` utility.

**Hits:** Plan implementing drag end handler and module creation.

---

## P5 — Canvas Boundary Overflow (MEDIUM)

**Problem:** Dragging or resizing a module beyond canvas bounds is permitted by dnd-kit by default. Server may accept or reject out-of-bounds coordinates depending on validation.

**Prevention:** Clamp in onDragEnd:
```ts
newGridX = Math.max(0, Math.min(newGridX, MAX_COLS - module.gridWidth))
newGridY = Math.max(0, Math.min(newGridY, MAX_ROWS - module.gridHeight))
```
Same clamping on resize. Define MAX_COLS and MAX_ROWS in canvasConstants.ts.

**Hits:** Plan implementing drag end and resize end handlers.

---

## P6 — Z-index Conflicts with shadcn Modals (MEDIUM)

**Problem:** shadcn modals and dialogs use `z-index: 50` (Radix default). Canvas modules with z-index may render above open dialogs.

**Prevention:** Canvas modules use z-index range 1–100 (user-controlled stacking). DragOverlay uses `z-index: 200`. shadcn dialogs/modals use Radix portals at `z-index: 9999`. No conflict since Radix portals at top of DOM. BUT: if canvas has a positioned ancestor with `transform`, stacking contexts isolate — ensure canvas root has NO `transform` applied.

**Hits:** Plan implementing Canvas.tsx container styles.

---

## P7 — CSS resize Property (HIGH)

**Problem:** Using `resize: both` (native CSS) on absolutely positioned modules doesn't integrate with grid snapping — resize delta can't be intercepted for snap-to-grid. Also conflicts with pointer events during drag.

**Prevention:** Never use CSS `resize` property on canvas modules. Build custom resize handles (8 absolutely positioned divs) with onPointerDown/onPointerMove/onPointerUp handlers. This is standard practice for canvas tools.

**Hits:** Plan implementing ResizeHandles.tsx.

---

## P8 — Performance: Re-render All Modules on Drag (MEDIUM)

**Problem:** If drag state lives in a parent component, every pixel of movement triggers re-render of all modules.

**Prevention:** Drag position state lives in the dragged CanvasModule itself (via `useDraggable` — already local). The DragOverlay clone renders separately. Non-dragged modules do NOT re-render during drag because their state doesn't change. Wrap module list items in `React.memo`.

**Hits:** Plan implementing CanvasModule and Canvas.tsx.

---

## P9 — TypeScript: dnd-kit UniqueIdentifier (LOW)

**Problem:** `active.id` and `over?.id` are `UniqueIdentifier` (string | number). Module IDs are UUIDs (strings). Casting issues can cause silent mismatches.

**Prevention:** Always pass module IDs as strings to `useDraggable({ id: module.id })` (already strings from backend). Cast `active.id as string` in onDragEnd. Never use numeric IDs for modules.

**Hits:** Plan implementing onDragEnd handler.

---

## P10 — Module Type as String (MEDIUM)

**Problem:** Backend `moduleType` is an opaque string. If the frontend uses different casing or spelling, POST/GET data won't match.

**Prevention:** Define `MODULE_TYPES` as a const array in `moduleTypes.ts` and derive the `ModuleType` union from it. Validate that all CREATE calls use values from this registry. Add a TypeScript assertion in modulesApi.ts.

**Hits:** Plan defining moduleTypes.ts and modulesApi.ts.

---

## Testing Guidance

**Unit-testable (write tests):**
- Grid math: snapToGrid, clamp, pixel ↔ grid coordinate transforms
- Module type registry: valid types, min dimensions
- modulesApi: mock Axios, assert endpoint URLs and payloads

**Integration-testable:**
- Drag behavior: requires real pointer events — use Playwright E2E or skip in unit tests
- Resize handles: same as drag

**Policy:** Do NOT write unit tests for drag/resize interaction (pointer event simulation is brittle). Write unit tests for coordinate math. Rely on manual UAT for canvas interaction.
