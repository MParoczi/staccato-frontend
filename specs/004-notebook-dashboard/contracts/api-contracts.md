# API Contracts: 004-notebook-dashboard

**Date**: 2026-04-04

All endpoints require authentication (Bearer token) unless noted otherwise.

## Notebooks

### GET /notebooks

Returns all notebooks for the authenticated user.

**Response 200**: `NotebookSummary[]`

```json
[
  {
    "id": "uuid",
    "title": "Guitar Basics",
    "instrumentName": "6-String Guitar",
    "pageSize": "A4",
    "coverColor": "#8B4513",
    "lessonCount": 12,
    "createdAt": "2026-03-01T10:00:00Z",
    "updatedAt": "2026-04-03T14:30:00Z"
  }
]
```

### POST /notebooks

Creates a new notebook.

**Request body**:
```json
{
  "title": "Guitar Basics",
  "instrumentId": "uuid",
  "pageSize": "A4",
  "coverColor": "#8B4513",
  "styles": [
    {
      "moduleType": "Title",
      "backgroundColor": "#FEFCE8",
      "borderColor": "#A16207",
      "borderStyle": "Solid",
      "borderWidth": 2,
      "borderRadius": 8,
      "headerBgColor": "#FEF08A",
      "headerTextColor": "#713F12",
      "bodyTextColor": "#422006",
      "fontFamily": "Default"
    }
  ]
}
```

**Fields**:
- `title` (required): string, 1-200 characters
- `instrumentId` (required): UUID of an instrument from GET /instruments
- `pageSize` (required): one of "A4", "A5", "A6", "B5", "B6"
- `coverColor` (required): hex color string (e.g., "#8B4513")
- `styles` (optional): array of style definitions (12 entries, one per ModuleType). If omitted, backend applies the default "Colorful" preset.

**Response 201**: `NotebookDetail`

```json
{
  "id": "uuid",
  "title": "Guitar Basics",
  "instrumentId": "uuid",
  "instrumentName": "6-String Guitar",
  "pageSize": "A4",
  "coverColor": "#8B4513",
  "lessonCount": 0,
  "createdAt": "2026-04-04T10:00:00Z",
  "updatedAt": "2026-04-04T10:00:00Z",
  "styles": [...]
}
```

**Error 400**: Validation error (missing/invalid fields)
```json
{
  "errors": {
    "title": ["Title is required"],
    "instrumentId": ["Invalid instrument"]
  }
}
```

### DELETE /notebooks/{id}

Permanently deletes a notebook and all its lessons and content.

**Response 204**: No content

**Error 404**: Notebook not found
```json
{
  "code": "NOTEBOOK_NOT_FOUND",
  "message": "Notebook not found"
}
```

## Instruments (public, no auth required)

### GET /instruments

Returns all available instruments. Cached server-side for 5 minutes.

**Response 200**: `Instrument[]`

```json
[
  { "id": "uuid", "key": "Guitar6String", "name": "6-String Guitar", "stringCount": 6 },
  { "id": "uuid", "key": "Bass4String", "name": "4-String Bass", "stringCount": 4 }
]
```

## System Style Presets (public, no auth required)

### GET /presets/system

Returns all system style presets. Each preset contains 12 style definitions (one per ModuleType).

**Response 200**: `SystemStylePreset[]`

```json
[
  {
    "id": "uuid",
    "name": "Colorful",
    "displayOrder": 1,
    "isDefault": true,
    "styles": [
      {
        "id": "uuid",
        "notebookId": "00000000-0000-0000-0000-000000000000",
        "moduleType": "Title",
        "backgroundColor": "#FEFCE8",
        "borderColor": "#A16207",
        "borderStyle": "Solid",
        "borderWidth": 2,
        "borderRadius": 8,
        "headerBgColor": "#FEF08A",
        "headerTextColor": "#713F12",
        "bodyTextColor": "#422006",
        "fontFamily": "Default"
      }
    ]
  }
]
```

Note: The `id` and `notebookId` fields in preset styles are template values. When sending styles in `POST /notebooks`, these fields must be stripped (they are server-generated for the new notebook).
