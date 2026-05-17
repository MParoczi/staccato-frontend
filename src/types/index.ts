export interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName: string | null
  lastName: string | null
  language: string
  defaultPageSize: string | null
  defaultInstrumentId: string | null
  avatarUrl: string | null
  scheduledDeletionAt: string | null
}

export interface Notebook {
  id: string
  title: string
  instrumentId: string | null
  pageSize: string
  coverColor: string
  stylePreset: string
  createdAt: string
  updatedAt: string
}

export interface CreateNotebookPayload {
  title: string
  instrumentId?: string | null
  pageSize?: string
  coverColor?: string
  stylePreset?: string
}

export interface UpdateNotebookPayload {
  title?: string
  instrumentId?: string | null
  pageSize?: string
  coverColor?: string
  stylePreset?: string
}

export const COVER_COLORS = [
  '#E8D5C4',
  '#C8E6C9',
  '#BBDEFB',
  '#F8BBD0',
  '#E1BEE7',
  '#FFF9C4',
  '#B2EBF2',
  '#FFCCBC',
  '#D7CCC8',
  '#CFD8DC',
] as const

export type CoverColor = (typeof COVER_COLORS)[number]

export const NOTEBOOK_STYLE_PRESETS = ['Classic', 'Colorful', 'Dark', 'Minimal', 'Pastel'] as const

export type NotebookStylePreset = (typeof NOTEBOOK_STYLE_PRESETS)[number]

export const NOTEBOOK_PAGE_SIZES = ['A4', 'A5', 'Letter'] as const

export type NotebookPageSize = (typeof NOTEBOOK_PAGE_SIZES)[number]
