import type { FontFamily, ModuleType } from '@/lib/types';

export type StylingSwatchGroup = 'neutrals' | 'earthy' | 'accents';

export type StylingColorSwatch = {
  readonly value: string;
  readonly group: StylingSwatchGroup;
};

export const STYLING_SWATCH_GROUP_ORDER = [
  'neutrals',
  'earthy',
  'accents',
] as const satisfies readonly StylingSwatchGroup[];

export const STYLING_SWATCH_GRID_COLUMNS = 6;
export const STYLING_SWATCH_GRID_ROWS = 4;

export const STYLING_COLOR_SWATCHES = [
  { value: '#FFF9F0', group: 'neutrals' },
  { value: '#F5EBDD', group: 'neutrals' },
  { value: '#E8DCCB', group: 'neutrals' },
  { value: '#D8CBB8', group: 'neutrals' },
  { value: '#C4B49D', group: 'neutrals' },
  { value: '#A89B88', group: 'neutrals' },
  { value: '#6F665D', group: 'neutrals' },
  { value: '#2F2A26', group: 'neutrals' },
  { value: '#C97A4A', group: 'earthy' },
  { value: '#A65C38', group: 'earthy' },
  { value: '#7C4A2D', group: 'earthy' },
  { value: '#556B2F', group: 'earthy' },
  { value: '#6E7F4F', group: 'earthy' },
  { value: '#8A9A5B', group: 'earthy' },
  { value: '#2F6F62', group: 'earthy' },
  { value: '#355C7D', group: 'earthy' },
  { value: '#D94F70', group: 'accents' },
  { value: '#C06C84', group: 'accents' },
  { value: '#8C5E99', group: 'accents' },
  { value: '#5B6EE1', group: 'accents' },
  { value: '#2A9D8F', group: 'accents' },
  { value: '#E9C46A', group: 'accents' },
  { value: '#F4A261', group: 'accents' },
  { value: '#E76F51', group: 'accents' },
] as const satisfies readonly StylingColorSwatch[];

export const MODULE_STYLE_TAB_ORDER = [
  'Title',
  'Breadcrumb',
  'Subtitle',
  'Theory',
  'Practice',
  'Example',
  'Important',
  'Tip',
  'Homework',
  'Question',
  'ChordTablature',
  'FreeText',
] as const satisfies readonly ModuleType[];

export type FontFamilyPreviewOption = {
  readonly value: FontFamily;
  readonly labelKey: string;
  readonly previewClassName: string;
};

export const FONT_FAMILY_PREVIEW_SAMPLE_KEY = 'styling.preview.fontSample';

export const FONT_FAMILY_PREVIEW_OPTIONS = [
  {
    value: 'Default',
    labelKey: 'styling.controls.fontFamilyOptions.default',
    previewClassName: 'font-sans',
  },
  {
    value: 'Monospace',
    labelKey: 'styling.controls.fontFamilyOptions.monospace',
    previewClassName: 'font-mono',
  },
  {
    value: 'Serif',
    labelKey: 'styling.controls.fontFamilyOptions.serif',
    previewClassName: 'font-serif',
  },
] as const satisfies readonly FontFamilyPreviewOption[];

