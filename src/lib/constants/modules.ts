import type { ModuleType, BuildingBlockType } from '@/lib/types';

export const MODULE_MIN_SIZES: Record<ModuleType, { minWidth: number; minHeight: number }> = {
  Title: { minWidth: 20, minHeight: 4 },
  Breadcrumb: { minWidth: 20, minHeight: 3 },
  Subtitle: { minWidth: 10, minHeight: 3 },
  Theory: { minWidth: 8, minHeight: 5 },
  Practice: { minWidth: 8, minHeight: 5 },
  Example: { minWidth: 8, minHeight: 5 },
  Important: { minWidth: 8, minHeight: 4 },
  Tip: { minWidth: 8, minHeight: 4 },
  Homework: { minWidth: 8, minHeight: 5 },
  Question: { minWidth: 8, minHeight: 4 },
  ChordTablature: { minWidth: 8, minHeight: 10 },
  FreeText: { minWidth: 4, minHeight: 4 },
};

export const MODULE_ALLOWED_BLOCKS: Record<ModuleType, BuildingBlockType[]> = {
  Title: ['Date', 'Text'],
  Breadcrumb: [],
  Subtitle: ['Text'],
  Theory: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'Table', 'MusicalNotes'],
  Practice: ['SectionHeading', 'Text', 'ChordProgression', 'ChordTablatureGroup', 'MusicalNotes'],
  Example: ['SectionHeading', 'Text', 'ChordProgression', 'MusicalNotes'],
  Important: ['SectionHeading', 'Text', 'MusicalNotes'],
  Tip: ['SectionHeading', 'Text', 'MusicalNotes'],
  Homework: ['SectionHeading', 'Text', 'BulletList', 'NumberedList', 'CheckboxList'],
  Question: ['SectionHeading', 'Text'],
  ChordTablature: ['ChordTablatureGroup', 'MusicalNotes'],
  FreeText: [
    'SectionHeading', 'Date', 'Text', 'BulletList', 'NumberedList',
    'CheckboxList', 'Table', 'MusicalNotes', 'ChordProgression', 'ChordTablatureGroup',
  ],
};
