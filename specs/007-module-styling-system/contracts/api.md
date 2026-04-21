# API Contracts: Module Styling System

**Feature**: 007-module-styling-system  
**Date**: 2026-04-21

These contracts document the REST API endpoints consumed by this feature. All endpoints use the centralized Axios client (`src/api/client.ts`) with `Authorization: Bearer {token}` and `Accept-Language` headers injected automatically.

---

## Notebook Styles

### GET /notebooks/{notebookId}/styles

Fetch all 12 module styles for a notebook.

**Existing**: ✅ Already implemented in `src/api/notebooks.ts` as `getNotebookStyles()`

**Contract note**: The backend guarantees this response always contains exactly 12 provisioned style records, one per module type. The frontend does not generate fallback records.

**Response**: `200 OK`
```text
[
  {
    "id": "uuid",
    "notebookId": "uuid",
    "moduleType": "Theory",
    "backgroundColor": "#FFFFFF",
    "borderColor": "#CCCCCC",
    "borderStyle": "Solid",
    "borderWidth": 1,
    "borderRadius": 4,
    "headerBgColor": "#F0E6D3",
    "headerTextColor": "#333333",
    "bodyTextColor": "#333333",
    "fontFamily": "Default"
  }
  ... 11 more entries (one per ModuleType)
]
```

---

### PUT /notebooks/{notebookId}/styles

Bulk-update all 12 module styles for a notebook. Replaces the entire style set atomically.

**New**: ❌ To be added to `src/api/notebooks.ts` as `updateNotebookStyles()`

**Request body**:
```text
[
  {
    "moduleType": "Theory",
    "backgroundColor": "#FFFFFF",
    "borderColor": "#CCCCCC",
    "borderStyle": "Solid",
    "borderWidth": 1,
    "borderRadius": 4,
    "headerBgColor": "#F0E6D3",
    "headerTextColor": "#333333",
    "bodyTextColor": "#333333",
    "fontFamily": "Default"
  }
  ... 11 more entries
]
```

**Response**: `200 OK` — returns the updated `NotebookModuleStyle[]` (12 entries with server-assigned `id` and `notebookId`)

**Error responses**:
- `400 Bad Request` — validation errors (invalid hex, out-of-range numbers)
- `404 Not Found` — notebook does not exist or user lacks access

**TypeScript signature**:
```text
updateNotebookStyles(
  notebookId: string,
  styles: UpdateNotebookStyleInput[],
): Promise<NotebookModuleStyle[]>;
```

---

### POST /notebooks/{notebookId}/styles/apply-preset/{presetId}

Apply a system or user preset to the notebook and persist all 12 resulting styles immediately.

**New**: ❌ To be added to `src/api/notebooks.ts` as `applyPresetToNotebook()`

**Request body**: none

**Response**: `200 OK` — returns the updated `NotebookModuleStyle[]` (12 entries with server-assigned `id` and `notebookId`)

**Error responses**:
- `404 Not Found` — notebook or preset does not exist, or user lacks access
- `409 Conflict` — preset cannot be applied in the current state

**TypeScript signature**:
```text
applyPresetToNotebook(
  notebookId: string,
  presetId: string,
): Promise<NotebookModuleStyle[]>;
```

---

## System Presets

### GET /presets

Fetch all system-provided style presets.

**Frontend function**: `getSystemPresets()` in `src/api/presets.ts`

**Response**: `200 OK`
```text
[
  {
    "id": "uuid",
    "name": "Classic",
    "displayOrder": 1,
    "isDefault": true,
    "styles": ["12 NotebookModuleStyle entries omitted for brevity"]
  }
  ... 4 more presets
]
```

---

## User Presets

### GET /users/me/presets

Fetch all user-saved presets for the authenticated user.

**Frontend function**: `getUserPresets()` in `src/api/presets.ts`

**Contract note**: The response order is newest first. The frontend preserves this server-provided order and does not derive a local sort key.

**Response**: `200 OK`
```text
[
  {
    "id": "uuid",
    "name": "My Custom Theme",
    "styles": [
      { "moduleType": "Theory", "stylesJson": "{\"backgroundColor\":\"#FFFFFF\",...}" }
      "11 more entries omitted for brevity"
    ]
  }
]
```

---

### POST /users/me/presets

Create a new user-saved preset from the current notebook's styles.

**Frontend function**: `createUserPreset()` in `src/api/presets.ts`

**Request body**:
```text
{
  "name": "My Custom Theme",
  "styles": [
    { "moduleType": "Theory", "stylesJson": "{\"backgroundColor\":\"#FFFFFF\",...}" }
    "11 more entries omitted for brevity"
  ]
}
```

**Response**: `201 Created` — returns the new `UserSavedPreset`

**Error responses**:
- `409 Conflict` — preset name already exists for this user → show "A preset with this name already exists"
- `422 Unprocessable Entity` — max 20 presets reached

**Contract note**: Preset creation uniqueness is name-based only. A new preset may reuse a style payload identical to an existing preset if the submitted name is different.

---

### PUT /users/me/presets/{presetId}

Rename a user-saved preset.

**Frontend function**: `renameUserPreset()` in `src/api/presets.ts`

**Request body**:
```text
{
  "name": "Renamed Theme"
}
```

**Response**: `200 OK` — returns the updated `UserSavedPreset`

**Error responses**:
- `404 Not Found` — preset does not exist or not owned by user
- `409 Conflict` — new name already exists for this user

**TypeScript signature**:
```text
renameUserPreset(
  id: string,
  name: string,
): Promise<UserSavedPreset>;
```

---

### DELETE /users/me/presets/{presetId}

Delete a user-saved preset.

**Frontend function**: `deleteUserPreset()` in `src/api/presets.ts`

**Response**: `204 No Content`

**Error responses**:
- `404 Not Found` — preset does not exist or not owned by user

---

## TanStack Query Integration

| Operation | Query Key Affected | Update Strategy |
|-----------|--------------------|-----------------|
| Load styles | `["notebooks", id, "styles"]` | Standard fetch |
| Save styles (explicit) | `["notebooks", id, "styles"]` | Optimistic update + rollback on error |
| Apply preset | `["notebooks", id, "styles"]` | Optimistic update + rollback on error using `POST /notebooks/{id}/styles/apply-preset/{presetId}` |
| Load system presets | `["presets"]` | Standard fetch, staleTime 5min |
| Load user presets | `["user", "presets"]` | Standard fetch |
| Create user preset | `["user", "presets"]` | Optimistic insert + rollback |
| Rename user preset | `["user", "presets"]` | Optimistic update + rollback |
| Delete user preset | `["user", "presets"]` | Optimistic remove + rollback |

