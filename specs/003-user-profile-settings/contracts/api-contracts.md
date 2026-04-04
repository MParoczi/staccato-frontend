# API Contracts: 003-user-profile-settings

**Date**: 2026-03-31

All endpoints require authentication (Bearer token) unless noted otherwise.

## User Profile

### GET /users/me

**Response 200**: `User` object

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "language": "en",
  "defaultPageSize": "A5",
  "defaultInstrumentId": "uuid-or-null",
  "avatarUrl": "https://api.example.com/avatars/uuid.jpg",
  "scheduledDeletionAt": null
}
```

### PUT /users/me

**Request body**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "language": "hu",
  "defaultPageSize": "A5",
  "defaultInstrumentId": "uuid-or-null"
}
```

**Fields**: `firstName` (required), `lastName` (required), `language` (required: "en"|"hu"), `defaultPageSize` (optional: PageSize|null), `defaultInstrumentId` (optional: UUID|null)

**Response 200**: Updated `User` object

### PUT /users/me/avatar

**Content-Type**: `multipart/form-data`

**Form field**: `File` — image file (JPG, PNG, WebP), max 2MB

**Response 200**: Updated `User` object (with new `avatarUrl`)

**Error 400**: Invalid file type or size → `{ "code": "INVALID_FILE", "message": "..." }`

### DELETE /users/me/avatar

**Response 204**: No content (avatar removed)

### DELETE /users/me

Schedules account for deletion in 30 days.

**Response 204**: No content

**Error 409**: `{ "code": "ACCOUNT_DELETION_ALREADY_SCHEDULED", "message": "Account is already scheduled for deletion" }`

### POST /users/me/cancel-deletion

Cancels a scheduled deletion.

**Response 204**: No content

**Error 400**: `{ "code": "ACCOUNT_DELETION_NOT_SCHEDULED", "message": "No deletion is scheduled" }`

## User Presets (read-only for this feature)

### GET /users/me/presets

**Response 200**: `UserSavedPreset[]`

```json
[
  { "id": "uuid", "name": "My Custom Preset", "styles": [...] }
]
```

## Instruments (public, no auth required)

### GET /instruments

**Response 200**: `Instrument[]` (cached server-side for 5 minutes)

```json
[
  { "id": "uuid", "key": "Guitar6String", "name": "6-String Guitar", "stringCount": 6 }
]
```
