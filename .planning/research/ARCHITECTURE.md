# Architecture Research: v0.6 Canvas & Module Placement

## Feature Directory Structure

Canvas is tightly coupled to LessonPage (in the `lessons` feature). However, cross-feature imports between `src/features/*` siblings are forbidden. Solution: canvas lives INSIDE the lessons feature as a subfolder.

```
src/features/lessons/
  api/
    lessonsApi.ts         (existing)
    lessonPagesApi.ts     (existing)
    modulesApi.ts         (NEW — CRUD for modules)
  canvas/
    Canvas.tsx            (NEW — canvas host, DndContext scope)
    CanvasModule.tsx      (NEW — individual draggable/resizable module)
    ModulePalette.tsx     (NEW — add module toolbar)
    ModuleShell.tsx       (NEW — type-specific shell renderer)
    ResizeHandles.tsx     (NEW — 8-handle resize overlay)
    useModules.ts         (NEW — TanStack Query for module list)
    useModuleMutations.ts (NEW — create/update/delete/patchLayout)
    moduleTypes.ts        (NEW — 12 type definitions: name, icon, minW, minH, color)
    canvasConstants.ts    (NEW — CELL_SIZE, MAX_COLS, MAX_ROWS)
  components/
    LessonPage.tsx        (MODIFIED — replace placeholder with <Canvas />)
```

`src/types/index.ts` — add `Module`, `CreateModulePayload`, `PatchModuleLayoutPayload`, `UpdateModulePayload` interfaces.

## State Architecture

| State Type | Where Stored | Why |
|------------|-------------|-----|
| Module list (server) | TanStack Query `['modules', pageId]` | Server truth; invalidated on CRUD |
| Drag position (transient) | Local component state in CanvasModule | Not server state; discarded on drop |
| Selected module ID | Local state in Canvas.tsx | UI-only; no persistence needed |
| Resize preview | Local state in Canvas.tsx (activeResize) | Transient; applied on mouseup |

**NO Zustand store for canvas state.** All transient state is local component state. Server state is TanStack Query.

## API Integration

```
modulesApi.ts:
  getModules(pageId)           → GET  /pages/{pageId}/modules
  createModule(pageId, data)   → POST /pages/{pageId}/modules
  patchModuleLayout(id, data)  → PATCH /modules/{id}/layout  ← drag end / resize end
  updateModule(id, data)       → PUT  /modules/{id}          ← type or content change
  deleteModule(id)             → DELETE /modules/{id}
```

**PATCH /layout on drag end:** Called once per drag interaction on `onDragEnd`. Never called during drag (performance). AbortController per module for race condition safety.

**Optimistic update strategy:** After PATCH /layout:
1. `queryClient.setQueryData(['modules', pageId], updater)` — optimistic
2. On error: `queryClient.invalidateQueries(['modules', pageId])` — rollback to server truth

## Coordinate System

```
Grid unit: CELL_SIZE = 32 (px)
Module CSS position: left = gridX * CELL_SIZE, top = gridY * CELL_SIZE
Module CSS size: width = gridWidth * CELL_SIZE, height = gridHeight * CELL_SIZE

Drag delta → grid:
  newGridX = Math.max(0, Math.round((startGridX * CELL_SIZE + deltaX) / CELL_SIZE))
  newGridY = Math.max(0, Math.round((startGridY * CELL_SIZE + deltaY) / CELL_SIZE))
  Clamp to: newGridX + gridWidth <= MAX_COLS, newGridY + gridHeight <= MAX_ROWS
```

## dnd-kit Scope

```tsx
// Canvas.tsx
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  <div className="canvas-area" ref={canvasRef}>
    {modules.map(m => <CanvasModule key={m.id} module={m} />)}
  </div>
  <DragOverlay> {/* portaled to body; shows ghost during drag */}
    {activeModule && <ModuleShell module={activeModule} isDragging />}
  </DragOverlay>
</DndContext>
```

- `PointerSensor` with `activationConstraint: { distance: 8 }` — prevents accidental drag on click
- **No useDroppable on canvas** — delta from `useDraggable` transform is sufficient for absolute positioning
- DragOverlay portals to `document.body` — avoids z-index conflicts with canvas modules

## ModuleEditor Lazy Loading (Phase 7+ prep)

The spec notes "ModuleEditor lazy-loaded via React.lazy". In Phase 6, there's no editor — shells are static. The lazy boundary goes here:

```tsx
const ModuleEditor = React.lazy(() => import('./ModuleEditor'))
// Rendered inside CanvasModule when module is double-clicked (Phase 7)
```

Phase 6 only renders the shell. Phase 7 implements ModuleEditor and fills the lazy boundary.

## Build Order

1. `moduleTypes.ts` + `canvasConstants.ts` — type registry and grid constants
2. `modulesApi.ts` + `useModules.ts` + `useModuleMutations.ts` — API + query hooks
3. `ModuleShell.tsx` — static shell renderer per type
4. `ResizeHandles.tsx` — 8-handle overlay
5. `CanvasModule.tsx` — drag + resize container wrapping shell
6. `ModulePalette.tsx` — add module toolbar
7. `Canvas.tsx` — DndContext host; wires everything; selected state
8. `LessonPage.tsx` — replace CSS placeholder with `<Canvas pageId={...} />`
9. `src/types/index.ts` — add Module interfaces

This order ensures each component depends only on already-built pieces.
