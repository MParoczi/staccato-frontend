import type { LucideIcon } from 'lucide-react'
import {
  Heading,
  Type,
  AlignLeft,
  ListOrdered,
  List,
  SquareCheck,
  Table2,
  Guitar,
  Music,
  Music2,
  FileMusic,
  ScrollText,
} from 'lucide-react'

export type ModuleType =
  | 'Title'
  | 'Subtitle'
  | 'TextBlock'
  | 'OrderedList'
  | 'UnorderedList'
  | 'CheckboxList'
  | 'Table'
  | 'ChordDiagram'
  | 'ChordProgression'
  | 'ChordTablatureGroup'
  | 'MusicalNotes'
  | 'SheetMusic'

export const MODULE_TYPES = [
  'Title',
  'Subtitle',
  'TextBlock',
  'OrderedList',
  'UnorderedList',
  'CheckboxList',
  'Table',
  'ChordDiagram',
  'ChordProgression',
  'ChordTablatureGroup',
  'MusicalNotes',
  'SheetMusic',
] as const satisfies readonly ModuleType[]

interface ModuleTypeDef {
  label: string
  icon: LucideIcon
  minWidth: number
  minHeight: number
  defaultWidth: number
  defaultHeight: number
  headerColor: string
}

export const MODULE_TYPE_REGISTRY: Record<ModuleType, ModuleTypeDef> = {
  Title:               { label: 'Title',           icon: Heading,      minWidth: 8, minHeight: 2, defaultWidth: 8,  defaultHeight: 2,  headerColor: '#f59e0b' },
  Subtitle:            { label: 'Subtitle',         icon: Type,         minWidth: 6, minHeight: 2, defaultWidth: 6,  defaultHeight: 2,  headerColor: '#fbbf24' },
  TextBlock:           { label: 'Text Block',       icon: AlignLeft,    minWidth: 4, minHeight: 3, defaultWidth: 6,  defaultHeight: 4,  headerColor: '#3b82f6' },
  OrderedList:         { label: 'Ordered List',     icon: ListOrdered,  minWidth: 4, minHeight: 3, defaultWidth: 5,  defaultHeight: 4,  headerColor: '#3b82f6' },
  UnorderedList:       { label: 'Unordered List',   icon: List,         minWidth: 4, minHeight: 3, defaultWidth: 5,  defaultHeight: 4,  headerColor: '#3b82f6' },
  CheckboxList:        { label: 'Checklist',        icon: SquareCheck,  minWidth: 4, minHeight: 3, defaultWidth: 5,  defaultHeight: 4,  headerColor: '#22c55e' },
  Table:               { label: 'Table',            icon: Table2,       minWidth: 6, minHeight: 4, defaultWidth: 8,  defaultHeight: 5,  headerColor: '#a855f7' },
  ChordDiagram:        { label: 'Chord Diagram',    icon: Guitar,       minWidth: 3, minHeight: 4, defaultWidth: 4,  defaultHeight: 5,  headerColor: '#f97316' },
  ChordProgression:    { label: 'Progression',      icon: Music,        minWidth: 4, minHeight: 3, defaultWidth: 6,  defaultHeight: 4,  headerColor: '#f97316' },
  ChordTablatureGroup: { label: 'Tablature',        icon: Music2,       minWidth: 6, minHeight: 4, defaultWidth: 8,  defaultHeight: 5,  headerColor: '#f97316' },
  MusicalNotes:        { label: 'Notes',            icon: FileMusic,    minWidth: 6, minHeight: 3, defaultWidth: 8,  defaultHeight: 4,  headerColor: '#ef4444' },
  SheetMusic:          { label: 'Sheet Music',      icon: ScrollText,   minWidth: 8, minHeight: 5, defaultWidth: 10, defaultHeight: 6,  headerColor: '#ef4444' },
}
