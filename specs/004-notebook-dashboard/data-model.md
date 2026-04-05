# Data Model: 004-notebook-dashboard

**Date**: 2026-04-04

## Existing Entities (no changes needed)

### NotebookSummary

**File**: `src/lib/types/notebooks.ts`

```typescript
interface NotebookSummary {
  id: string;              // UUID
  title: string;
  instrumentName: string;  // resolved instrument name from backend
  pageSize: PageSize;      // 'A4' | 'A5' | 'A6' | 'B5' | 'B6'
  coverColor: string;      // hex color (e.g., "#8B4513")
  lessonCount: number;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

Used in: notebook card grid on dashboard.

### NotebookDetail

**File**: `src/lib/types/notebooks.ts`

```typescript
interface NotebookDetail {
  id: string;
  title: string;
  instrumentId: string;
  instrumentName: string;
  pageSize: PageSize;
  coverColor: string;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
  styles: NotebookModuleStyle[];
}
```

Returned by: POST /notebooks (creation response). Used for redirect after creation.

### NotebookModuleStyle

**File**: `src/lib/types/notebooks.ts`

```typescript
interface NotebookModuleStyle {
  id: string;
  notebookId: string;
  moduleType: ModuleType;
  backgroundColor: string;
  borderColor: string;
  borderStyle: BorderStyle;
  borderWidth: number;
  borderRadius: number;
  headerBgColor: string;
  headerTextColor: string;
  bodyTextColor: string;
  fontFamily: FontFamily;
}
```

Used in: preset thumbnails (reading `backgroundColor` and `headerBgColor` from system presets).

### Instrument

**File**: `src/lib/types/chords.ts`

```typescript
interface Instrument {
  id: string;
  key: InstrumentKey;
  name: string;
  stringCount: number;
}
```

Used in: instrument dropdown in creation wizard (display `name`, submit `id`).

### SystemStylePreset

**File**: `src/lib/types/styles.ts`

```typescript
interface SystemStylePreset {
  id: string;
  name: string;
  displayOrder: number;
  isDefault: boolean;
  styles: NotebookModuleStyle[];
}
```

Used in: preset selector thumbnails. The `isDefault: true` entry identifies the "Colorful" preset.

### User (read from cache)

**File**: `src/lib/types/auth.ts`

```typescript
interface User {
  // ... other fields
  defaultPageSize: PageSize | null;
  defaultInstrumentId: string | null;
}
```

Used in: pre-filling instrument and page size in the creation wizard.

### Supporting Types

**File**: `src/lib/types/common.ts`

```typescript
type PageSize = 'A4' | 'A5' | 'A6' | 'B5' | 'B6';
type ModuleType = 'Title' | 'Breadcrumb' | 'Subtitle' | 'Theory' | 'Practice'
  | 'Example' | 'Important' | 'Tip' | 'Homework' | 'Question'
  | 'ChordTablature' | 'FreeText';
```

## New Types

### CreateNotebookRequest

**File**: `src/lib/types/notebooks.ts` (add to existing file)

```typescript
interface CreateNotebookRequest {
  title: string;
  instrumentId: string;
  pageSize: PageSize;
  coverColor: string;
  styles?: CreateNotebookStyleInput[];
}

type CreateNotebookStyleInput = Omit<NotebookModuleStyle, 'id' | 'notebookId'>;
```

Represents the POST /notebooks request body. The `styles` field is optional — when a system preset is selected, the preset's styles are mapped (stripping `id` and `notebookId`) and included. When no preset is selected, the `isDefault` preset's styles are used. If no default preset exists, `styles` is omitted.

## New Constants

### COVER_COLORS

**File**: `src/lib/constants/notebook-colors.ts`

```typescript
interface CoverColor {
  hex: string;
  labelKey: string;  // i18n key for color name
}

const COVER_COLORS: CoverColor[] = [
  { hex: '#8B4513', labelKey: 'notebooks.colors.leatherBrown' },
  { hex: '#1B2A4A', labelKey: 'notebooks.colors.darkNavy' },
  { hex: '#2D5016', labelKey: 'notebooks.colors.forestGreen' },
  { hex: '#722F37', labelKey: 'notebooks.colors.burgundy' },
  { hex: '#36454F', labelKey: 'notebooks.colors.charcoal' },
  { hex: '#4A6274', labelKey: 'notebooks.colors.slateBlue' },
  { hex: '#1A5653', labelKey: 'notebooks.colors.deepTeal' },
  { hex: '#C75B39', labelKey: 'notebooks.colors.warmTerracotta' },
];

const DEFAULT_COVER_COLOR = '#8B4513'; // Leather brown
```

### Existing: PAGE_SIZE_DIMENSIONS

**File**: `src/lib/constants/grid.ts` (already exists, no changes)

```typescript
const PAGE_SIZE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 42, height: 59 },
  A5: { width: 29, height: 42 },
  A6: { width: 21, height: 29 },
  B5: { width: 35, height: 50 },
  B6: { width: 25, height: 35 },
};
```

Used in: PageSizeSelector component for aspect ratios and grid dimension subtitles.

## Validation Rules

### Create Notebook Form (Zod schema)

| Field | Type | Constraints |
|-------|------|-------------|
| title | string | Required, 1-200 characters, trimmed, whitespace-only rejected |
| instrumentId | string | Required, must be a valid UUID from instruments list |
| pageSize | PageSize | Required, one of A4/A5/A6/B5/B6 |
| coverColor | string | Required, valid 6-digit hex color (with or without #) |

Note: `styles` is not validated by the form schema — it's derived from the selected preset and injected at submission time.

## Query Cache Shape

| Query Key | Data Type | staleTime | Source | Fetched When |
|-----------|-----------|-----------|--------|--------------|
| `["notebooks"]` | `NotebookSummary[]` | 0 (refetch on focus) | GET /notebooks | Dashboard mount |
| `["instruments"]` | `Instrument[]` | 300,000ms | GET /instruments | Creation dialog opens |
| `["presets"]` | `SystemStylePreset[]` | 300,000ms | GET /presets/system | Creation dialog opens |
| `["user", "profile"]` | `User` | 30,000ms | GET /users/me | Already cached from AppLayout |

## Mutation Operations

| Operation | API Call | Cache Update | Optimistic? |
|-----------|----------|--------------|-------------|
| Create notebook | POST /notebooks | Invalidate `["notebooks"]` | No (redirect on success) |
| Delete notebook | DELETE /notebooks/{id} | Remove from `["notebooks"]` cache, restore on error | Yes |
