# API Contracts: Grid Canvas & Module Placement

**Feature**: 008-grid-canvas-module-placement  
**Date**: 2026-04-22

All requests use the centralized Axios client in `src/api/client.ts`, which injects auth and language headers.

---

## GET /pages/{pageId}/modules

Load all modules for a lesson page.

**Frontend function**: `getModules(pageId)` in `src/api/modules.ts`

**Response**: `200 OK`

```text
[
  {
    "id": "module-uuid",
    "lessonPageId": "page-uuid",
    "moduleType": "Theory",
    "gridX": 4,
    "gridY": 6,
    "gridWidth": 10,
    "gridHeight": 8,
    "zIndex": 2,
    "content": []
  }
]
```

**Query key**: `['pages', pageId, 'modules']`

---

## POST /pages/{pageId}/modules

Create a new module at the first valid in-bounds, non-overlapping position for the chosen type.

**Frontend function**: `createModule(pageId, payload)` in `src/api/modules.ts`

**Request body**:

```text
{
  "moduleType": "Question",
  "gridX": 0,
  "gridY": 12,
  "gridWidth": 8,
  "gridHeight": 4
}
```

**Response**: `201 Created` or `200 OK` with the saved `Module`

**Validation / error codes to preserve in UI**:
- `MODULE_OVERLAP`
- `MODULE_OUT_OF_BOUNDS`
- `MODULE_TOO_SMALL`
- `DUPLICATE_TITLE_MODULE`

**Frontend behavior**:
- Optimistically insert into `['pages', pageId, 'modules']`
- On server rejection, remove the optimistic module and show the server message

---

## PATCH /modules/{moduleId}/layout

Persist module move, resize, or z-index changes.

**Frontend function**: `updateModuleLayout(moduleId, payload)` — new helper to add in `src/api/modules.ts`

**Request body**:

```text
{
  "gridX": 8,
  "gridY": 6,
  "gridWidth": 10,
  "gridHeight": 8,
  "zIndex": 3
}
```

**Response**: `200 OK`

```text
{
  "id": "module-uuid",
  "lessonPageId": "page-uuid",
  "moduleType": "Theory",
  "gridX": 8,
  "gridY": 6,
  "gridWidth": 10,
  "gridHeight": 8,
  "zIndex": 3,
  "content": []
}
```

**Client-side requirements**:
- Only dispatch after snapped grid coordinates are computed
- Run bounds, min-size, and overlap validation before mutation
- Use 500 ms delayed persistence after drag/resize end
- Reconcile the optimistic cache entry to the returned saved module

**Error handling**:
- On error, restore the previous cached module list from `onMutate`
- Surface the server-provided validation message directly

---

## DELETE /modules/{moduleId}

Delete a module from the active page.

**Frontend function**: `deleteModule(moduleId)` in `src/api/modules.ts`

**Response**: `204 No Content`

**Frontend behavior**:
- Optimistically remove from `['pages', pageId, 'modules']`
- Restore on error
- Require confirmation only when the module is not empty

---

## Query Integration Summary

| Operation | Query Key | Update Strategy |
|-----------|-----------|-----------------|
| Load modules | `['pages', pageId, 'modules']` | Standard fetch |
| Create module | `['pages', pageId, 'modules']` | Optimistic insert + rollback |
| Move/resize module | `['pages', pageId, 'modules']` | Optimistic update + 500 ms delayed `PATCH /layout` + rollback |
| Layer module | `['pages', pageId, 'modules']` | Optimistic `zIndex` update + rollback |
| Delete module | `['pages', pageId, 'modules']` | Optimistic remove + rollback |

## TypeScript Surface

```typescript
export interface UpdateModuleLayoutInput {
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
}

export async function updateModuleLayout(
  moduleId: string,
  data: UpdateModuleLayoutInput,
): Promise<Module>;
```

