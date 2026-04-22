# Data Model: Module Styling System

**Feature**: 007-module-styling-system  
**Date**: 2026-04-21

## Entities

### NotebookModuleStyle (existing — `src/lib/types/notebooks.ts`)

Represents the visual styling for one module type within a notebook. A notebook always has exactly 12 server-provisioned records (one per `ModuleType`); the frontend does not synthesize fallback records.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | `string` | UUID, server-assigned | Read-only |
| notebookId | `string` | UUID, FK to Notebook | Read-only |
| moduleType | `ModuleType` | One of 12 enum values | Immutable after creation |
| backgroundColor | `string` | Hex color `#RRGGBB` | e.g., `"#FFFFFF"` |
| borderColor | `string` | Hex color `#RRGGBB` | e.g., `"#CCCCCC"` |
| borderStyle | `BorderStyle` | `None \| Solid \| Dashed \| Dotted` | Default: `"Solid"` |
| borderWidth | `number` | Integer, 0–10 (px) | Default: `1` |
| borderRadius | `number` | Integer, 0–20 (px) | Default: `4` |
| headerBgColor | `string` | Hex color `#RRGGBB` | e.g., `"#F0E6D3"` |
| headerTextColor | `string` | Hex color `#RRGGBB` | e.g., `"#333333"` |
| bodyTextColor | `string` | Hex color `#RRGGBB` | e.g., `"#333333"` |
| fontFamily | `FontFamily` | `Default \| Monospace \| Serif` | Default: `"Default"` |

**Validation rules**:
- All color fields: must match `/^#[0-9A-Fa-f]{6}$/`
- borderWidth: integer, min 0, max 10
- borderRadius: integer, min 0, max 20
- moduleType: must be one of the 12 `ModuleType` values
- borderStyle: must be one of the 4 `BorderStyle` values
- fontFamily: must be one of the 3 `FontFamily` values

**Module-type-specific control visibility**:
- Title, Subtitle: only `bodyTextColor` and `fontFamily` are user-editable. Other properties exist in the data, are not shown in the editor, and must be preserved from the server-loaded values when the user saves.
- All other 10 types: all 9 properties are user-editable.

**Control behavior rules**:
- When `borderStyle = None`, the `borderColor`, `borderWidth`, and `borderRadius` inputs are disabled until the user selects a non-`None` border style.

### SystemStylePreset (existing — `src/lib/types/styles.ts`)

A read-only, platform-provided preset containing a complete set of 12 styles.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | `string` | UUID | Server-assigned |
| name | `string` | Non-empty | Display name (e.g., "Classic", "Ocean") |
| displayOrder | `number` | Integer, 1–5 | Sorting order |
| isDefault | `boolean` | — | Whether this is the default preset for new notebooks |
| styles | `NotebookModuleStyle[]` | Exactly 12 entries | One per module type |

**Notes**: Read-only from frontend. Exactly 5 system presets exist.

### UserSavedPreset (existing — `src/lib/types/styles.ts`)

A user-created preset containing a name and 12 style entries. Globally scoped per-user.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | `string` | UUID | Server-assigned |
| name | `string` | Non-empty, max 50 chars | Must be unique per user |
| styles | `StyleEntry[]` | Exactly 12 entries | Serialized style data |

**Validation rules**:
- name: required, 1–50 chars, unique per user (server-enforced, client shows inline error)
- Maximum 20 presets per user (server-enforced, client disables "Save as Preset" at limit)
- Duplicate style payloads are allowed across presets; uniqueness is enforced on `name`, not on serialized style content
- Preset browser display order: newest first, preserving the response order from `GET /users/me/presets`

### StyleEntry (existing — `src/lib/types/styles.ts`)

A serialized style record within a user-saved preset.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| moduleType | `string` | One of 12 module type values | Maps to `ModuleType` |
| stylesJson | `string` | Valid JSON string | Serialized style properties (excl. id, notebookId, moduleType) |

**Notes**: `stylesJson` deserializes to an object with keys: `backgroundColor`, `borderColor`, `borderStyle`, `borderWidth`, `borderRadius`, `headerBgColor`, `headerTextColor`, `bodyTextColor`, `fontFamily`.

**Serialization contract (v1)**:
- `stylesJson` stores a JSON object serialized as a string using the exact camelCase keys listed above.
- All 9 style keys are required in v1; omitted fields are not allowed.
- The serialized object does not include `id`, `notebookId`, or `moduleType` because those are carried externally.
- v1 does not embed a separate version property; contract versioning is controlled by the API/documentation for this feature.

## New Types (to be added)

### UpdateNotebookStyleInput (to add to `src/lib/types/notebooks.ts`)

Used for the bulk PUT endpoint to update all 12 styles at once.

```typescript
export type UpdateNotebookStyleInput = Omit<NotebookModuleStyle, 'id' | 'notebookId'>;
```

**Notes**: Identical to `CreateNotebookStyleInput` — shares the same shape. May be aliased or reused.

### ModuleStyleFormValues (feature-local, `src/features/styling/utils/style-schema.ts`)

Form-level type derived from the Zod schema, representing the editable style properties.

```typescript
// Inferred from Zod schema
type ModuleStyleFormValues = {
  backgroundColor: string;
  borderColor: string;
  borderStyle: BorderStyle;
  borderWidth: number;
  borderRadius: number;
  headerBgColor: string;
  headerTextColor: string;
  bodyTextColor: string;
  fontFamily: FontFamily;
};

type StyleEditorFormValues = {
  styles: Record<ModuleType, ModuleStyleFormValues>;
};
```

## Relationships

```
Notebook (1) ──── has ────> (12) NotebookModuleStyle
    │                              ▲
    │                              │ (same shape, different source)
    │                              │
SystemStylePreset ── contains ──> (12) NotebookModuleStyle
UserSavedPreset ── contains ──> (12) StyleEntry [serialized]

User (1) ──── owns ────> (0..20) UserSavedPreset
```

## State Transitions

### Style Editor Lifecycle

```
[Closed] ──(open editor)──> [Loading] ──(styles fetched)──> [Editing]
[Editing] ──(switch tab)──> [Editing]  (same form, different tab view)
[Editing] ──(modify field)──> [Dirty]
[Dirty] ──(click Save)──> [Saving] ──(success)──> [Editing] (form reset to saved values)
[Saving] ──(error)──> [Dirty] (form retains local edits, error toast)
[Dirty] ──(apply preset)──> [Confirm Apply] ──(confirm)──> [Saving] (call preset-apply endpoint, auto-persist, form reset to preset values)
[Confirm Apply] ──(cancel)──> [Dirty]
[Editing] ──(apply preset)──> [Saving] (call preset-apply endpoint, auto-persist, form reset to preset values)
[Editing/Dirty] ──(close editor)──> [Closed] (unsaved changes discarded)
```

### User Preset Lifecycle

```
[Non-existent] ──(Save as Preset)──> [Created]
[Created] ──(Save as Preset with duplicate style payload + unique name)──> [Created] (new sibling preset allowed)
[Created] ──(click pencil icon)──> [Renaming]
[Renaming] ──(Enter/blur + unique name)──> [Renamed]
[Renaming] ──(Enter/blur + duplicate name)──> [Renaming] (inline duplicate-name error)
[Renaming] ──(Escape)──> [Created] (rename cancelled)
[Created] ──(delete + confirm)──> [Deleted]
[Created] ──(delete + cancel)──> [Created] (no change)
```

## Query Key Mapping

| Data | Query Key | staleTime | Notes |
|------|-----------|-----------|-------|
| Notebook styles | `["notebooks", notebookId, "styles"]` | 0 | Refetch on focus; treated as immediately stale after save/apply |
| System presets | `["presets"]` | 300000 (5 min) | Low-churn reference data; no live refresh required during an open editor session |
| User presets | `["user", "presets"]` | 0 | Refetch on focus |
