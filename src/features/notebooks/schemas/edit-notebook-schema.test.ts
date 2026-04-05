import { describe, it, expect } from 'vitest';
import { editNotebookSchema } from './edit-notebook-schema';

const valid = {
  title: 'My Notebook',
  coverColor: '#8B4513',
};

function parseError(data: Record<string, unknown>, field: string) {
  const result = editNotebookSchema.safeParse(data);
  if (result.success) return null;
  return result.error.issues.find((i) => i.path[0] === field)?.message ?? null;
}

describe('editNotebookSchema', () => {
  it('passes with valid input', () => {
    const result = editNotebookSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('trims whitespace from title', () => {
    const result = editNotebookSchema.safeParse({ ...valid, title: '  My Notebook  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Notebook');
    }
  });

  it('rejects empty title', () => {
    expect(parseError({ ...valid, title: '' }, 'title')).toBe(
      'notebooks.shell.edit.titleRequired',
    );
  });

  it('rejects whitespace-only title', () => {
    expect(parseError({ ...valid, title: '   ' }, 'title')).toBe(
      'notebooks.shell.edit.titleRequired',
    );
  });

  it('accepts title at 200 characters', () => {
    const result = editNotebookSchema.safeParse({ ...valid, title: 'A'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('rejects title exceeding 200 characters', () => {
    expect(parseError({ ...valid, title: 'A'.repeat(201) }, 'title')).toBe(
      'notebooks.shell.edit.titleMaxLength',
    );
  });

  it('accepts valid 6-digit hex with #', () => {
    const result = editNotebookSchema.safeParse({ ...valid, coverColor: '#FF00AA' });
    expect(result.success).toBe(true);
  });

  it('rejects hex without # prefix', () => {
    expect(parseError({ ...valid, coverColor: 'FF00AA' }, 'coverColor')).toBe(
      'notebooks.shell.edit.invalidHex',
    );
  });

  it('rejects 3-digit hex shorthand', () => {
    expect(parseError({ ...valid, coverColor: '#F0A' }, 'coverColor')).toBe(
      'notebooks.shell.edit.invalidHex',
    );
  });

  it('rejects non-hex string', () => {
    expect(parseError({ ...valid, coverColor: 'red' }, 'coverColor')).toBe(
      'notebooks.shell.edit.invalidHex',
    );
  });

  it('rejects empty coverColor', () => {
    expect(parseError({ ...valid, coverColor: '' }, 'coverColor')).toBe(
      'notebooks.shell.edit.invalidHex',
    );
  });

  it('rejects 8-digit hex (with alpha)', () => {
    expect(parseError({ ...valid, coverColor: '#8B4513FF' }, 'coverColor')).toBe(
      'notebooks.shell.edit.invalidHex',
    );
  });
});
