import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  Calendar,
  CheckSquare,
  Heading,
  List,
  ListOrdered,
  Music2,
  Music3,
  Music4,
  Table2,
  Type,
} from 'lucide-react';
import type { BuildingBlockType } from '@/lib/types';
import { BLOCK_REGISTRY, getBlockDescriptor } from './registry';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'editor.placeholderBlockA11y' && opts && typeof opts.type === 'string') {
        return `${opts.type} block — coming soon`;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

const ALL_TYPES: BuildingBlockType[] = [
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

describe('BLOCK_REGISTRY', () => {
  it.each(ALL_TYPES)('has an entry for %s', (type) => {
    expect(BLOCK_REGISTRY[type]).toBeDefined();
    expect(typeof BLOCK_REGISTRY[type].create).toBe('function');
    expect(typeof BLOCK_REGISTRY[type].labelKey).toBe('string');
    expect(BLOCK_REGISTRY[type].icon).toBeDefined();
  });

  it('maps each type to the expected Lucide icon (UI-SPEC §8)', () => {
    expect(BLOCK_REGISTRY.SectionHeading.icon).toBe(Heading);
    expect(BLOCK_REGISTRY.Date.icon).toBe(Calendar);
    expect(BLOCK_REGISTRY.Text.icon).toBe(Type);
    expect(BLOCK_REGISTRY.BulletList.icon).toBe(List);
    expect(BLOCK_REGISTRY.NumberedList.icon).toBe(ListOrdered);
    expect(BLOCK_REGISTRY.CheckboxList.icon).toBe(CheckSquare);
    expect(BLOCK_REGISTRY.Table.icon).toBe(Table2);
    expect(BLOCK_REGISTRY.MusicalNotes.icon).toBe(Music2);
    expect(BLOCK_REGISTRY.ChordProgression.icon).toBe(Music3);
    expect(BLOCK_REGISTRY.ChordTablatureGroup.icon).toBe(Music4);
  });

  it.each(ALL_TYPES)('create() returns a BuildingBlock with type=%s', (type) => {
    const block = BLOCK_REGISTRY[type].create();
    expect(block.type).toBe(type);
  });

  it('marks all entries as not yet implemented (plan 01-04 flips Text to true)', () => {
    for (const type of ALL_TYPES) {
      expect(BLOCK_REGISTRY[type].implemented).toBe(false);
    }
  });

  it.each(ALL_TYPES)('Renderer for %s falls back to PlaceholderBlock', (type) => {
    const { Renderer } = BLOCK_REGISTRY[type];
    const { unmount } = render(<Renderer block={{ type }} />);
    const node = screen.getByRole('note');
    expect(node.className).toContain('border-dashed');
    expect(node.textContent).toContain('— coming soon');
    unmount();
  });

  it.each(ALL_TYPES)('Editor for %s falls back to PlaceholderBlock', (type) => {
    const { Editor } = BLOCK_REGISTRY[type];
    const { unmount } = render(<Editor block={{ type }} onChange={() => {}} />);
    const node = screen.getByRole('note');
    expect(node.className).toContain('border-dashed');
    unmount();
  });
});

describe('getBlockDescriptor', () => {
  it('returns the descriptor for a known type', () => {
    const d = getBlockDescriptor('Text');
    expect(d).toBe(BLOCK_REGISTRY.Text);
    expect(d.icon).toBe(Type);
  });

  it('throws for an unknown type (defense-in-depth)', () => {
    expect(() => getBlockDescriptor('NotAType' as BuildingBlockType)).toThrow(
      /No descriptor registered/,
    );
  });
});

/**
 * Compile-time exhaustiveness check — `BLOCK_REGISTRY` is typed as
 * `Record<BuildingBlockType, BlockDescriptor>`, so omitting any union member
 * is a TypeScript error. We assert it shape-wise here at runtime as a
 * secondary guard.
 */
describe('BLOCK_REGISTRY exhaustiveness', () => {
  it('contains exactly the 10 BuildingBlockType keys with no extras', () => {
    const keys = Object.keys(BLOCK_REGISTRY).sort();
    const expected = [...ALL_TYPES].sort();
    expect(keys).toEqual(expected);
  });
});

