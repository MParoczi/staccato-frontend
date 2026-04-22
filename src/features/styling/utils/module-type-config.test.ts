import { describe, it, expect } from 'vitest';
import {
  getVisibleControls,
  isControlVisible,
  isBorderControlDisabled,
  type ModuleStyleControl,
} from './module-type-config';
import type { BorderStyle, ModuleType } from '@/lib/types';

const ALL_TYPES: ModuleType[] = [
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
];

describe('getVisibleControls', () => {
  it('returns only bodyTextColor and fontFamily for Title', () => {
    expect(getVisibleControls('Title')).toEqual(['bodyTextColor', 'fontFamily']);
  });

  it('returns only bodyTextColor and fontFamily for Subtitle', () => {
    expect(getVisibleControls('Subtitle')).toEqual([
      'bodyTextColor',
      'fontFamily',
    ]);
  });

  it.each(ALL_TYPES.filter((t) => t !== 'Title' && t !== 'Subtitle'))(
    'returns all nine controls for %s',
    (moduleType) => {
      expect(getVisibleControls(moduleType)).toEqual([
        'backgroundColor',
        'borderColor',
        'borderStyle',
        'borderWidth',
        'borderRadius',
        'headerBgColor',
        'headerTextColor',
        'bodyTextColor',
        'fontFamily',
      ]);
    },
  );
});

describe('isControlVisible', () => {
  it('hides backgroundColor for Title', () => {
    expect(isControlVisible('Title', 'backgroundColor')).toBe(false);
  });

  it('shows bodyTextColor for Title', () => {
    expect(isControlVisible('Title', 'bodyTextColor')).toBe(true);
  });

  it('hides borderColor for Subtitle', () => {
    expect(isControlVisible('Subtitle', 'borderColor')).toBe(false);
  });

  it('shows fontFamily for Subtitle', () => {
    expect(isControlVisible('Subtitle', 'fontFamily')).toBe(true);
  });

  it('shows every control for a full-control module type', () => {
    const controls: ModuleStyleControl[] = [
      'backgroundColor',
      'borderColor',
      'borderStyle',
      'borderWidth',
      'borderRadius',
      'headerBgColor',
      'headerTextColor',
      'bodyTextColor',
      'fontFamily',
    ];
    for (const control of controls) {
      expect(isControlVisible('Theory', control)).toBe(true);
    }
  });
});

describe('isBorderControlDisabled', () => {
  const borderDependent: ModuleStyleControl[] = [
    'borderColor',
    'borderWidth',
    'borderRadius',
  ];

  const nonBorderDependent: ModuleStyleControl[] = [
    'backgroundColor',
    'borderStyle',
    'headerBgColor',
    'headerTextColor',
    'bodyTextColor',
    'fontFamily',
  ];

  const otherBorderStyles: BorderStyle[] = ['Solid', 'Dashed', 'Dotted'];

  it.each(borderDependent)(
    'disables %s when borderStyle is None',
    (control) => {
      expect(isBorderControlDisabled('None', control)).toBe(true);
    },
  );

  it.each(otherBorderStyles.flatMap((bs) => borderDependent.map((c) => [bs, c] as const)))(
    'enables border-dependent control %s when borderStyle is %s',
    (bs, control) => {
      expect(isBorderControlDisabled(bs, control)).toBe(false);
    },
  );

  it.each(nonBorderDependent)(
    'never disables non-border-dependent control %s (borderStyle=None)',
    (control) => {
      expect(isBorderControlDisabled('None', control)).toBe(false);
    },
  );

  it.each(nonBorderDependent)(
    'never disables non-border-dependent control %s (borderStyle=Solid)',
    (control) => {
      expect(isBorderControlDisabled('Solid', control)).toBe(false);
    },
  );
});
