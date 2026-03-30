// Type definitions — populated in Phase 8 (US6)
// Temporary placeholder types for API stubs

export type ModuleType =
  | 'Title' | 'Breadcrumb' | 'Subtitle' | 'Theory' | 'Practice'
  | 'Example' | 'Important' | 'Tip' | 'Homework' | 'Question'
  | 'ChordTablature' | 'FreeText';

export type BuildingBlockType =
  | 'SectionHeading' | 'Date' | 'Text' | 'BulletList' | 'NumberedList'
  | 'CheckboxList' | 'Table' | 'MusicalNotes' | 'ChordProgression'
  | 'ChordTablatureGroup';

export type BorderStyle = 'None' | 'Solid' | 'Dashed' | 'Dotted';
export type FontFamily = 'Default' | 'Monospace' | 'Serif';
export type PageSize = 'A4' | 'A5' | 'A6' | 'B5' | 'B6';
export type InstrumentKey =
  | 'Guitar6String' | 'Guitar7String' | 'Bass4String' | 'Bass5String'
  | 'Ukulele4String' | 'Banjo4String' | 'Banjo5String';
export type Language = 'en' | 'hu';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: Language;
  defaultPageSize: PageSize | null;
  defaultInstrumentId: string | null;
  avatarUrl: string | null;
  scheduledDeletionAt: string | null;
}

export interface NotebookSummary {
  id: string;
  title: string;
  instrumentName: string;
  pageSize: PageSize;
  coverColor: string;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookDetail {
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

export interface NotebookModuleStyle {
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

export interface NotebookIndex {
  entries: NotebookIndexEntry[];
}

export interface NotebookIndexEntry {
  lessonId: string;
  title: string;
  createdAt: string;
  startPageNumber: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  createdAt: string;
  pageCount: number;
}

export interface LessonDetail {
  id: string;
  notebookId: string;
  title: string;
  createdAt: string;
  pages: LessonPage[];
}

export interface LessonPage {
  id: string;
  lessonId: string;
  pageNumber: number;
  moduleCount: number;
}

export interface BuildingBlock {
  type: BuildingBlockType;
  [key: string]: unknown;
}

export interface Module {
  id: string;
  lessonPageId: string;
  moduleType: ModuleType;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  zIndex: number;
  content: BuildingBlock[];
}

export interface Instrument {
  id: string;
  key: InstrumentKey;
  name: string;
  stringCount: number;
}

export interface ChordSummary {
  id: string;
  instrumentKey: InstrumentKey;
  name: string;
  root: string;
  quality: string;
  extension: string | null;
  alternation: string | null;
  previewPosition: ChordPosition;
}

export interface ChordDetail {
  id: string;
  instrumentKey: InstrumentKey;
  name: string;
  root: string;
  quality: string;
  extension: string | null;
  alternation: string | null;
  positions: ChordPosition[];
}

export interface ChordPosition {
  label: string;
  baseFret: number;
  barre: ChordBarre | null;
  strings: ChordString[];
}

export interface ChordBarre {
  fret: number;
  fromString: number;
  toString: number;
}

export interface ChordString {
  string: number;
  state: 'open' | 'fretted' | 'muted';
  fret: number | null;
  finger: number | null;
}

export interface PdfExport {
  id: string;
  notebookId: string;
  notebookTitle: string;
  status: 'Pending' | 'Processing' | 'Ready' | 'Failed';
  createdAt: string;
  completedAt: string | null;
  lessonIds: string[] | null;
}

export interface SystemStylePreset {
  id: string;
  name: string;
  displayOrder: number;
  isDefault: boolean;
  styles: NotebookModuleStyle[];
}

export interface StyleEntry {
  moduleType: string;
  stylesJson: string;
}

export interface UserSavedPreset {
  id: string;
  name: string;
  styles: StyleEntry[];
}
