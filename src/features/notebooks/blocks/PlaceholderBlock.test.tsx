import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { BuildingBlockType } from '@/lib/types';
import { PlaceholderBlock } from './PlaceholderBlock';
import { camelCaseLabelKeyFor } from './block-labels';

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

describe('camelCaseLabelKeyFor', () => {
  it.each(ALL_TYPES)('lower-cases the first letter for %s', (type) => {
    const out = camelCaseLabelKeyFor(type);
    expect(out.charAt(0)).toBe(type.charAt(0).toLowerCase());
    expect(out.slice(1)).toBe(type.slice(1));
  });

  it('matches expected mappings for known types', () => {
    expect(camelCaseLabelKeyFor('SectionHeading')).toBe('sectionHeading');
    expect(camelCaseLabelKeyFor('ChordTablatureGroup')).toBe('chordTablatureGroup');
    expect(camelCaseLabelKeyFor('Text')).toBe('text');
  });
});

describe('PlaceholderBlock', () => {
  it('renders a note with the resolved label and "coming soon" copy', () => {
    render(<PlaceholderBlock type="Text" />);
    const node = screen.getByRole('note');
    expect(node.textContent).toContain('editor.blockType.text');
    expect(node.textContent).toContain('— coming soon');
  });

  it('exposes role="note" and aria-label reflecting the type', () => {
    render(<PlaceholderBlock type="ChordTablatureGroup" />);
    const node = screen.getByRole('note');
    expect(node.getAttribute('aria-label')).toBe(
      'editor.blockType.chordTablatureGroup block — coming soon',
    );
  });

  it('uses italic muted dashed-border styling per UI-SPEC §4.9', () => {
    render(<PlaceholderBlock type="Date" />);
    const node = screen.getByRole('note');
    const cls = node.className;
    expect(cls).toContain('italic');
    expect(cls).toContain('border-dashed');
    expect(cls).toContain('text-muted-foreground');
  });

  it.each(ALL_TYPES)('never throws for type %s', (type) => {
    expect(() => render(<PlaceholderBlock type={type} />)).not.toThrow();
  });
});

