import { describe, it, expect } from 'vitest';
import {
  getVisibleControls,
  isControlVisible,
  isBorderControlDisabled,
  MODULE_ALLOWED_BLOCKS,
  isBlockAllowed,
  type ModuleStyleControl,
} from './module-type-config';
import type { BorderStyle, BuildingBlockType, ModuleType } from '@/lib/types';

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

describe('MODULE_ALLOWED_BLOCKS', () => {
  const ALL_BLOCK_TYPES: BuildingBlockType[] = [
    'SectionHeading',
    'Date',
    'Text',
    'BulletList',
    'NumberedList',
    'CheckboxList',
    'Table',
    'MusicalNotes',
    'ChordProgression',
    'ChordTablatureGroup',
  ];

  it('exhaustively keys every ModuleType', () => {
    const keys = Object.keys(MODULE_ALLOWED_BLOCKS).sort();
    expect(keys).toEqual([...ALL_TYPES].sort());
  });

  it('only references real BuildingBlockType values', () => {
    const known = new Set<BuildingBlockType>(ALL_BLOCK_TYPES);
    for (const moduleType of Object.keys(MODULE_ALLOWED_BLOCKS) as ModuleType[]) {
      for (const block of MODULE_ALLOWED_BLOCKS[moduleType]) {
        expect(known.has(block)).toBe(true);
      }
    }
  });

  it('Title allows exactly [Date, Text]', () => {
    expect(MODULE_ALLOWED_BLOCKS.Title).toEqual(['Date', 'Text']);
  });

  it('Breadcrumb allows nothing', () => {
    expect(MODULE_ALLOWED_BLOCKS.Breadcrumb).toEqual([]);
  });

  it('FreeText allows all 10 BuildingBlockType values', () => {
    expect(MODULE_ALLOWED_BLOCKS.FreeText.length).toBe(10);
    const set = new Set(MODULE_ALLOWED_BLOCKS.FreeText);
    for (const block of ALL_BLOCK_TYPES) {
      expect(set.has(block)).toBe(true);
    }
  });
});

describe('isBlockAllowed', () => {
  it('Title accepts Text', () => {
    expect(isBlockAllowed('Title', 'Text')).toBe(true);
  });

  it('Title rejects BulletList', () => {
    expect(isBlockAllowed('Title', 'BulletList')).toBe(false);
  });

  it('Breadcrumb rejects Text (Breadcrumb is closed)', () => {
    expect(isBlockAllowed('Breadcrumb', 'Text')).toBe(false);
  });

  it('FreeText accepts ChordProgression', () => {
    expect(isBlockAllowed('FreeText', 'ChordProgression')).toBe(true);
  });
});

