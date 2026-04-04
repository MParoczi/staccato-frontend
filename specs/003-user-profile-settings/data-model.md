# Data Model: 003-user-profile-settings

**Date**: 2026-03-31

## Existing Entities (no changes needed)

### User

**File**: `src/lib/types/auth.ts`

```typescript
interface User {
  id: string;                          // UUID
  email: string;
  firstName: string;
  lastName: string;
  language: Language;                  // 'en' | 'hu'
  defaultPageSize: PageSize | null;   // 'A4' | 'A5' | 'A6' | 'B5' | 'B6' | null
  defaultInstrumentId: string | null; // UUID or null
  avatarUrl: string | null;           // URL or null
  scheduledDeletionAt: string | null; // ISO 8601 datetime or null
}
```

**State transitions** (scheduledDeletionAt):
- `null` → `string`: DELETE /users/me (schedules deletion 30 days from now)
- `string` → `null`: POST /users/me/cancel-deletion (cancels scheduled deletion)

### Instrument

**File**: `src/lib/types/chords.ts`

```typescript
interface Instrument {
  id: string;
  key: InstrumentKey;
  name: string;        // e.g. "6-String Guitar"
  stringCount: number;
}
```

Used in: default instrument dropdown (only `id` and `name` are displayed).

### UserSavedPreset

**File**: `src/lib/types/styles.ts`

```typescript
interface UserSavedPreset {
  id: string;
  name: string;
  styles: StyleEntry[];
}
```

Used in: read-only preset list on profile page (only `name` is displayed).

### Supporting Types

**File**: `src/lib/types/common.ts`

```typescript
type PageSize = 'A4' | 'A5' | 'A6' | 'B5' | 'B6';
type Language = 'en' | 'hu';
```

## New Types

### UpdateProfileRequest

**File**: `src/lib/types/auth.ts` (add to existing file)

```typescript
interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  language: Language;
  defaultPageSize: PageSize | null;
  defaultInstrumentId: string | null;
}
```

Represents the PUT /users/me request body. All fields are required per backend contract (firstName, lastName, language are required; defaultPageSize and defaultInstrumentId are optional but always sent as null or a value).

## Validation Rules

### Profile Edit Form (Zod schema)

| Field | Type | Constraints |
|-------|------|-------------|
| firstName | string | Required, 1-100 characters, trimmed |
| lastName | string | Required, 1-100 characters, trimmed |

### Avatar Upload (client-side validation)

| Field | Type | Constraints |
|-------|------|-------------|
| file | File | Required, max 2MB, MIME: image/jpeg, image/png, image/webp |

### Preferences (auto-save, no form — individual selectors)

| Field | Type | Constraints |
|-------|------|-------------|
| language | Language | Required, 'en' or 'hu' |
| defaultPageSize | PageSize or null | Optional, one of A4/A5/A6/B5/B6 or null |
| defaultInstrumentId | string or null | Optional, valid UUID from instruments list or null |

## Query Cache Shape

| Query Key | Data Type | staleTime | Source |
|-----------|-----------|-----------|--------|
| `["user", "profile"]` | `User` | 30,000ms | GET /users/me |
| `["instruments"]` | `Instrument[]` | 300,000ms | GET /instruments |
| `["user", "presets"]` | `UserSavedPreset[]` | 0 (default) | GET /users/me/presets |

## Mutation Operations

| Operation | API Call | Invalidates | Optimistic? |
|-----------|----------|-------------|-------------|
| Update profile (name) | PUT /users/me | `["user", "profile"]` | No (Save button flow) |
| Update preferences | PUT /users/me | `["user", "profile"]` | Yes (auto-save) |
| Upload avatar | PUT /users/me/avatar | `["user", "profile"]` | No (async upload) |
| Delete avatar | DELETE /users/me/avatar | `["user", "profile"]` | No |
| Delete account | DELETE /users/me | `["user", "profile"]` | No |
| Cancel deletion | POST /users/me/cancel-deletion | `["user", "profile"]` | No |
