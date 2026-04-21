import { describe, expect, it } from 'vitest';
import {
  FONT_FAMILY_PREVIEW_OPTIONS,
  FONT_FAMILY_PREVIEW_SAMPLE_KEY,
  MODULE_STYLE_TAB_ORDER,
  STYLING_COLOR_SWATCHES,
  STYLING_SWATCH_GRID_COLUMNS,
  STYLING_SWATCH_GRID_ROWS,
} from './style-defaults';

describe('style-defaults', () => {
  it('defines a full 6x4 curated swatch grid with unique colors', () => {
    expect(STYLING_COLOR_SWATCHES).toHaveLength(
      STYLING_SWATCH_GRID_COLUMNS * STYLING_SWATCH_GRID_ROWS,
    );
    expect(new Set(STYLING_COLOR_SWATCHES.map((swatch) => swatch.value)).size).toBe(24);
    expect(STYLING_COLOR_SWATCHES.slice(0, 8).every((swatch) => swatch.group === 'neutrals')).toBe(true);
    expect(STYLING_COLOR_SWATCHES.slice(8, 16).every((swatch) => swatch.group === 'earthy')).toBe(true);
    expect(STYLING_COLOR_SWATCHES.slice(16).every((swatch) => swatch.group === 'accents')).toBe(true);
  });

  it('keeps the module tabs in the spec-defined order', () => {
    expect(MODULE_STYLE_TAB_ORDER).toEqual([
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
    ]);
  });

  it('maps font preview options to the supported font stacks', () => {
    expect(FONT_FAMILY_PREVIEW_SAMPLE_KEY).toBe('styling.preview.fontSample');
    expect(FONT_FAMILY_PREVIEW_OPTIONS).toEqual([
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
    ]);
  });
});

