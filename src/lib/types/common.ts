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
