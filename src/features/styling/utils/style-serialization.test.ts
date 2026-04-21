import { describe, it, expect } from 'vitest';
import {
  serializeModuleStyle,
  deserializeModuleStyle,
  notebookStylesToEntries,
  formStylesToEntries,
  entriesToFormStyles,
} from './style-serialization';
import { MODULE_TYPES, type ModuleStyleFormValues } from './style-schema';
import type { ModuleType, NotebookModuleStyle, StyleEntry } from '@/lib/types';

const baseStyle: ModuleStyleFormValues = {
  backgroundColor: '#FFFFFF',
  borderColor: '#CCCCCC',
  borderStyle: 'Solid',
  borderWidth: 1,
  borderRadius: 4,
  headerBgColor: '#F0E6D3',
  headerTextColor: '#333333',
  bodyTextColor: '#333333',
  fontFamily: 'Default',
};

function buildNotebookStyles(): NotebookModuleStyle[] {
  return MODULE_TYPES.map((moduleType, idx) => ({
    id: `id-${idx}`,
    notebookId: 'nb-1',
    moduleType,
    ...baseStyle,
  }));
}

function buildEntries(): StyleEntry[] {
  return MODULE_TYPES.map((moduleType) => ({
    moduleType,
    stylesJson: serializeModuleStyle(baseStyle),
  }));
}

describe('serializeModuleStyle / deserializeModuleStyle', () => {
  it('serializes and round-trips an editable style', () => {
    const json = serializeModuleStyle(baseStyle);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(baseStyle);

    const roundTripped = deserializeModuleStyle(json);
    expect(roundTripped).toEqual(baseStyle);
  });

  it('does not include id/notebookId/moduleType in the serialized payload', () => {
    const withExtras = {
      ...baseStyle,
      id: 'x',
      notebookId: 'y',
      moduleType: 'Theory' as const,
    } as unknown as ModuleStyleFormValues;
    const json = serializeModuleStyle(withExtras);
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).sort()).toEqual(
      [
        'backgroundColor',
        'bodyTextColor',
        'borderColor',
        'borderRadius',
        'borderStyle',
        'borderWidth',
        'fontFamily',
        'headerBgColor',
        'headerTextColor',
      ].sort(),
    );
  });

  it('throws on malformed JSON', () => {
    expect(() => deserializeModuleStyle('{not json')).toThrow(/malformed/i);
  });

  it('throws when JSON is not an object (string primitive)', () => {
    expect(() => deserializeModuleStyle('"oops"')).toThrow(/not an object/i);
  });

  it('throws when JSON is null', () => {
    expect(() => deserializeModuleStyle('null')).toThrow(/not an object/i);
  });

  it('throws when a required key is missing', () => {
    const partial = { ...baseStyle } as Partial<ModuleStyleFormValues>;
    delete partial.fontFamily;
    const json = JSON.stringify(partial);
    expect(() => deserializeModuleStyle(json)).toThrow(/fontFamily/);
  });
});

describe('notebookStylesToEntries', () => {
  it('produces 12 entries in MODULE_TYPES order regardless of input order', () => {
    const styles = buildNotebookStyles();
    // shuffle the styles
    const shuffled = [...styles].reverse();
    const entries = notebookStylesToEntries(shuffled);
    expect(entries).toHaveLength(12);
    expect(entries.map((e) => e.moduleType)).toEqual(MODULE_TYPES);
    for (const entry of entries) {
      expect(JSON.parse(entry.stylesJson)).toEqual(baseStyle);
    }
  });

  it('throws when a module type is missing', () => {
    const styles = buildNotebookStyles().slice(1); // missing Title
    expect(() => notebookStylesToEntries(styles)).toThrow(/Title/);
  });
});

describe('formStylesToEntries', () => {
  it('emits entries in MODULE_TYPES order from a form-values map', () => {
    const form: Record<ModuleType, ModuleStyleFormValues> = Object.fromEntries(
      MODULE_TYPES.map((t) => [t, baseStyle]),
    ) as Record<ModuleType, ModuleStyleFormValues>;

    const entries = formStylesToEntries(form);
    expect(entries.map((e) => e.moduleType)).toEqual(MODULE_TYPES);
    expect(entries.every((e) => JSON.parse(e.stylesJson).borderStyle === 'Solid')).toBe(
      true,
    );
  });
});

describe('entriesToFormStyles', () => {
  it('produces a complete form-values map keyed by ModuleType', () => {
    const entries = buildEntries();
    const form = entriesToFormStyles(entries);
    for (const moduleType of MODULE_TYPES) {
      expect(form[moduleType]).toEqual(baseStyle);
    }
  });

  it('throws on an unknown module type', () => {
    const entries: StyleEntry[] = [
      { moduleType: 'Bogus', stylesJson: serializeModuleStyle(baseStyle) },
      ...buildEntries().slice(1),
    ];
    expect(() => entriesToFormStyles(entries)).toThrow(/Unknown module type "Bogus"/);
  });

  it('throws when a module type is missing from the entries', () => {
    const entries = buildEntries().slice(1); // missing Title
    expect(() => entriesToFormStyles(entries)).toThrow(/Title/);
  });
});
