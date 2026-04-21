import { describe, it, expect } from 'vitest';
import {
  borderRadiusSchema,
  borderStyleSchema,
  borderWidthSchema,
  fontFamilySchema,
  hexColorSchema,
  moduleStyleSchema,
  presetNameSchema,
  styleEditorSchema,
  MODULE_TYPES,
} from './style-schema';

const validStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: '#CCCCCC',
  borderStyle: 'Solid' as const,
  borderWidth: 1,
  borderRadius: 4,
  headerBgColor: '#F0E6D3',
  headerTextColor: '#333333',
  bodyTextColor: '#333333',
  fontFamily: 'Default' as const,
};

describe('hexColorSchema', () => {
  it.each(['#000000', '#FFFFFF', '#AbCdEf', '#123456'])(
    'accepts valid hex %s',
    (hex) => {
      expect(hexColorSchema.parse(hex)).toBe(hex);
    },
  );

  it.each([
    '',
    '#FFF',
    'FFFFFF',
    '#GGGGGG',
    '#1234567',
    '#12345',
    'rgb(0,0,0)',
  ])('rejects invalid hex %s', (hex) => {
    expect(hexColorSchema.safeParse(hex).success).toBe(false);
  });

  it('returns the invalidHex error message key', () => {
    const result = hexColorSchema.safeParse('zzz');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('styling.errors.invalidHex');
    }
  });
});

describe('borderStyleSchema', () => {
  it.each(['None', 'Solid', 'Dashed', 'Dotted'])('accepts %s', (v) => {
    expect(borderStyleSchema.parse(v)).toBe(v);
  });

  it('rejects unknown values', () => {
    expect(borderStyleSchema.safeParse('Wavy').success).toBe(false);
  });
});

describe('fontFamilySchema', () => {
  it.each(['Default', 'Monospace', 'Serif'])('accepts %s', (v) => {
    expect(fontFamilySchema.parse(v)).toBe(v);
  });

  it('rejects unknown values', () => {
    expect(fontFamilySchema.safeParse('Comic').success).toBe(false);
  });
});

describe('borderWidthSchema', () => {
  it.each([0, 1, 5, 10])('accepts integer %s', (n) => {
    expect(borderWidthSchema.parse(n)).toBe(n);
  });

  it.each([-1, 11, 1.5, Number.NaN])('rejects %s', (n) => {
    expect(borderWidthSchema.safeParse(n).success).toBe(false);
  });

  it('rejects non-numbers', () => {
    expect(borderWidthSchema.safeParse('3' as unknown as number).success).toBe(
      false,
    );
  });
});

describe('borderRadiusSchema', () => {
  it.each([0, 1, 10, 20])('accepts integer %s', (n) => {
    expect(borderRadiusSchema.parse(n)).toBe(n);
  });

  it.each([-1, 21, 2.5])('rejects %s', (n) => {
    expect(borderRadiusSchema.safeParse(n).success).toBe(false);
  });
});

describe('moduleStyleSchema', () => {
  it('accepts a fully valid style object', () => {
    expect(moduleStyleSchema.parse(validStyle)).toEqual(validStyle);
  });

  it('rejects when a required key is missing', () => {
    const { backgroundColor: _ignored, ...missing } = validStyle;
    void _ignored;
    expect(moduleStyleSchema.safeParse(missing).success).toBe(false);
  });

  it('rejects when a color is malformed', () => {
    expect(
      moduleStyleSchema.safeParse({ ...validStyle, backgroundColor: 'red' })
        .success,
    ).toBe(false);
  });
});

describe('styleEditorSchema', () => {
  it('requires all 12 module types to be present', () => {
    const styles = Object.fromEntries(
      MODULE_TYPES.map((m) => [m, validStyle]),
    );
    expect(styleEditorSchema.parse({ styles }).styles).toBeDefined();
  });

  it('fails when one module type is missing', () => {
    const styles = Object.fromEntries(
      MODULE_TYPES.filter((_, i) => i !== 0).map((m) => [m, validStyle]),
    );
    expect(styleEditorSchema.safeParse({ styles }).success).toBe(false);
  });
});

describe('presetNameSchema', () => {
  it('accepts a trimmed 1–50 char name', () => {
    expect(presetNameSchema.parse('  My Preset  ')).toBe('My Preset');
  });

  it('rejects empty name', () => {
    const result = presetNameSchema.safeParse('   ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'styling.errors.presetNameRequired',
      );
    }
  });

  it('rejects names longer than 50 characters', () => {
    const result = presetNameSchema.safeParse('a'.repeat(51));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'styling.errors.presetNameMaxLength',
      );
    }
  });
});
