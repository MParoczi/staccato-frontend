# Data Model: Project Infrastructure Setup

**Branch**: `001-project-infra-setup` | **Date**: 2026-03-30

This document defines all TypeScript types, enums, and constants that mirror the backend API contract. These are the canonical type definitions for the entire frontend.

## Enums (src/lib/types/common.ts)

### ModuleType
```typescript
type ModuleType =
  | 'Title' | 'Breadcrumb' | 'Subtitle' | 'Theory' | 'Practice'
  | 'Example' | 'Important' | 'Tip' | 'Homework' | 'Question'
  | 'ChordTablature' | 'FreeText';
```
12 values. Each module on the grid canvas has exactly one type. The type determines allowed building blocks and minimum grid dimensions.

### BuildingBlockType
```typescript
type BuildingBlockType =
  | 'SectionHeading' | 'Date' | 'Text' | 'BulletList' | 'NumberedList'
  | 'CheckboxList' | 'Table' | 'MusicalNotes' | 'ChordProgression'
  | 'ChordTablatureGroup';
```
10 values. Content elements inside modules. Stored as ordered JSON array in `Module.content`.

### BorderStyle
```typescript
type BorderStyle = 'None' | 'Solid' | 'Dashed' | 'Dotted';
```

### FontFamily
```typescript
type FontFamily = 'Default' | 'Monospace' | 'Serif';
```

### PageSize
```typescript
type PageSize = 'A4' | 'A5' | 'A6' | 'B5' | 'B6';
```
Chosen at notebook creation, immutable afterward. Determines grid dimensions.

### InstrumentKey
```typescript
type InstrumentKey =
  | 'Guitar6String' | 'Guitar7String' | 'Bass4String' | 'Bass5String'
  | 'Ukulele4String' | 'Banjo4String' | 'Banjo5String';
```

### Language
```typescript
type Language = 'en' | 'hu';
```

## Interfaces — Auth Domain (src/lib/types/auth.ts)

### User
```typescript
interface User {
  id: string;                          // UUID
  email: string;
  firstName: string;
  lastName: string;
  language: Language;
  defaultPageSize: PageSize | null;
  defaultInstrumentId: string | null;  // UUID
  avatarUrl: string | null;            // proxied avatar endpoint URL
  scheduledDeletionAt: string | null;  // ISO 8601 datetime
}
```
Relationships: owns Notebooks, owns UserSavedPresets.

## Interfaces — Notebooks Domain (src/lib/types/notebooks.ts)

### NotebookSummary
```typescript
interface NotebookSummary {
  id: string;
  title: string;
  instrumentName: string;
  pageSize: PageSize;
  coverColor: string;        // hex #RRGGBB
  lessonCount: number;
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}
```
Used in the dashboard list view.

### NotebookDetail
```typescript
interface NotebookDetail {
  id: string;
  title: string;
  instrumentId: string;      // UUID
  instrumentName: string;
  pageSize: PageSize;
  coverColor: string;        // hex
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
  styles: NotebookModuleStyle[];  // always 12 items (one per ModuleType)
}
```
Used in the notebook view (cover, index, editor).

### NotebookModuleStyle
```typescript
interface NotebookModuleStyle {
  id: string;
  notebookId: string;
  moduleType: ModuleType;
  backgroundColor: string;    // hex
  borderColor: string;        // hex
  borderStyle: BorderStyle;
  borderWidth: number;        // px
  borderRadius: number;       // px
  headerBgColor: string;      // hex
  headerTextColor: string;    // hex
  bodyTextColor: string;      // hex
  fontFamily: FontFamily;
}
```
12 per notebook (one per ModuleType). Title and Subtitle modules only use `bodyTextColor` and `fontFamily`.

### NotebookIndex
```typescript
interface NotebookIndex {
  entries: NotebookIndexEntry[];
}
```

### NotebookIndexEntry
```typescript
interface NotebookIndexEntry {
  lessonId: string;
  title: string;
  createdAt: string;
  startPageNumber: number;   // global page number where lesson begins
}
```

## Interfaces — Lessons Domain (src/lib/types/lessons.ts)

### LessonSummary
```typescript
interface LessonSummary {
  id: string;
  title: string;
  createdAt: string;
  pageCount: number;
}
```

### LessonDetail
```typescript
interface LessonDetail {
  id: string;
  notebookId: string;
  title: string;
  createdAt: string;
  pages: LessonPage[];
}
```

### LessonPage
```typescript
interface LessonPage {
  id: string;
  lessonId: string;
  pageNumber: number;       // 1-based within lesson
  moduleCount: number;
}
```

## Interfaces — Modules Domain (src/lib/types/modules.ts)

### Module
```typescript
interface Module {
  id: string;
  lessonPageId: string;
  moduleType: ModuleType;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
  content: BuildingBlock[];  // deserialized from ContentJson
}
```
`BuildingBlock` is a discriminated union on the `type` field. The full building block type definitions will be added when the editor feature is implemented — for now, `BuildingBlock` is typed as a base interface with `type: BuildingBlockType` and additional fields as `unknown`.

## Interfaces — Chords Domain (src/lib/types/chords.ts)

### Instrument
```typescript
interface Instrument {
  id: string;
  key: InstrumentKey;
  name: string;             // e.g. "6-String Guitar"
  stringCount: number;
}
```

### ChordSummary
```typescript
interface ChordSummary {
  id: string;
  instrumentKey: InstrumentKey;
  name: string;              // e.g. "F Major"
  root: string;              // e.g. "F"
  quality: string;           // e.g. "major"
  extension: string | null;  // e.g. "maj7"
  alternation: string | null;
  previewPosition: ChordPosition;
}
```

### ChordDetail
```typescript
interface ChordDetail {
  id: string;
  instrumentKey: InstrumentKey;
  name: string;
  root: string;
  quality: string;
  extension: string | null;
  alternation: string | null;
  positions: ChordPosition[];
}
```

### ChordPosition
```typescript
interface ChordPosition {
  label: string;             // e.g. "Barre 1st position"
  baseFret: number;          // 1 = nut
  barre: ChordBarre | null;
  strings: ChordString[];   // one per string
}
```

### ChordBarre
```typescript
interface ChordBarre {
  fret: number;
  fromString: number;        // 1 = highest pitched
  toString: number;
}
```

### ChordString
```typescript
interface ChordString {
  string: number;            // 1 = highest pitched, N = lowest pitched
  state: 'open' | 'fretted' | 'muted';
  fret: number | null;       // null if open/muted
  finger: number | null;     // 1-4 (index through pinky); null if open/muted
}
```

## Interfaces — Exports Domain (src/lib/types/exports.ts)

### PdfExport
```typescript
interface PdfExport {
  id: string;
  notebookId: string;
  notebookTitle: string;
  status: 'Pending' | 'Processing' | 'Ready' | 'Failed';
  createdAt: string;
  completedAt: string | null;
  lessonIds: string[] | null;  // null = whole notebook export
}
```

## Interfaces — Styles Domain (src/lib/types/styles.ts)

### SystemStylePreset
```typescript
interface SystemStylePreset {
  id: string;
  name: string;              // "Classic" | "Colorful" | "Dark" | "Minimal" | "Pastel"
  displayOrder: number;
  isDefault: boolean;
  styles: NotebookModuleStyle[];  // 12 items
}
```

### StyleEntry
```typescript
interface StyleEntry {
  moduleType: string;        // ModuleType enum value
  stylesJson: string;        // JSON string containing style properties
}
```

### UserSavedPreset
```typescript
interface UserSavedPreset {
  id: string;
  name: string;
  styles: StyleEntry[];      // 12 items, one per ModuleType
}
```

## Constants (src/lib/constants/)

### PAGE_SIZE_DIMENSIONS (grid.ts)

| PageSize | Grid Width | Grid Height |
|----------|-----------|-------------|
| A4 | 42 | 59 |
| A5 | 29 | 42 |
| A6 | 21 | 29 |
| B5 | 35 | 50 |
| B6 | 25 | 35 |

```typescript
const PAGE_SIZE_DIMENSIONS: Record<PageSize, { width: number; height: number }>;
```

### MODULE_MIN_SIZES (modules.ts)

| ModuleType | Min Width | Min Height |
|------------|----------|------------|
| Title | 20 | 4 |
| Breadcrumb | 20 | 3 |
| Subtitle | 10 | 3 |
| Theory | 8 | 5 |
| Practice | 8 | 5 |
| Example | 8 | 5 |
| Important | 8 | 4 |
| Tip | 8 | 4 |
| Homework | 8 | 5 |
| Question | 8 | 4 |
| ChordTablature | 8 | 10 |
| FreeText | 4 | 4 |

```typescript
const MODULE_MIN_SIZES: Record<ModuleType, { minWidth: number; minHeight: number }>;
```

### MODULE_ALLOWED_BLOCKS (modules.ts)

| ModuleType | Allowed BuildingBlockTypes |
|------------|--------------------------|
| Title | Date, Text |
| Breadcrumb | *(none — auto-generated)* |
| Subtitle | Text |
| Theory | SectionHeading, Text, BulletList, NumberedList, Table, MusicalNotes |
| Practice | SectionHeading, Text, ChordProgression, ChordTablatureGroup, MusicalNotes |
| Example | SectionHeading, Text, ChordProgression, MusicalNotes |
| Important | SectionHeading, Text, MusicalNotes |
| Tip | SectionHeading, Text, MusicalNotes |
| Homework | SectionHeading, Text, BulletList, NumberedList, CheckboxList |
| Question | SectionHeading, Text |
| ChordTablature | ChordTablatureGroup, MusicalNotes |
| FreeText | *(all building block types)* |

```typescript
const MODULE_ALLOWED_BLOCKS: Record<ModuleType, BuildingBlockType[]>;
```

### CHROMATIC_SCALE (music.ts)

```typescript
const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
```

12 notes in order. Used for the MusicalNotes building block to render note badges and calculate intervals (1 semitone = "S", 2 semitones = "W").

## Zustand Stores (src/stores/)

### AuthStore (authStore.ts)

| Field | Type | Description |
|-------|------|-------------|
| accessToken | `string \| null` | JWT access token; null when logged out |
| setAccessToken | `(token: string) => void` | Set token after login/refresh |
| clearAuth | `() => void` | Clear token (logout / refresh failure) |

No persistence — in-memory only (Constitution Principle III).

### UIStore (uiStore.ts)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| sidebarOpen | `boolean` | `true` | Sidebar visibility |
| selectedModuleId | `string \| null` | `null` | Currently selected module on canvas |
| zoom | `number` | `1` | Canvas zoom level (1 = 100%). Bounded: min 0.25, max 3.0 |
| theme | `'light' \| 'dark' \| 'system'` | `'system'` | Theme preference |
| setSidebarOpen | `(open: boolean) => void` | — | Toggle sidebar |
| setSelectedModuleId | `(id: string \| null) => void` | — | Select/deselect module |
| setZoom | `(zoom: number) => void` | — | Update zoom level |
| setTheme | `(theme: 'light' \| 'dark' \| 'system') => void` | — | Update theme |

Theme preference stored in localStorage for persistence across sessions.
