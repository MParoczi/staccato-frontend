import { describe, it, expect } from 'vitest';
import { createNotebookSchema } from './create-notebook-schema';

const valid = {
  title: 'My Notebook',
  instrumentId: 'some-uuid',
  pageSize: 'A4' as const,
  coverColor: '#8B4513',
};

function parseError(data: Record<string, unknown>, field: string) {
  const result = createNotebookSchema.safeParse(data);
  if (result.success) return null;
  return result.error.issues.find((i) => i.path[0] === field)?.message ?? null;
}

describe('createNotebookSchema', () => {
  it('passes with valid input', () => {
    const result = createNotebookSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coverColor).toBe('#8B4513');
    }
  });

  it('rejects empty title', () => {
    expect(parseError({ ...valid, title: '' }, 'title')).toBe(
      'notebooks.create.titleRequired',
    );
  });

  it('rejects whitespace-only title', () => {
    expect(parseError({ ...valid, title: '   ' }, 'title')).toBe(
      'notebooks.create.titleRequired',
    );
  });

  it('rejects title exceeding 200 characters', () => {
    expect(parseError({ ...valid, title: 'A'.repeat(201) }, 'title')).toBe(
      'notebooks.create.titleMaxLength',
    );
  });

  it('rejects missing instrumentId', () => {
    expect(parseError({ ...valid, instrumentId: '' }, 'instrumentId')).toBe(
      'notebooks.create.instrumentRequired',
    );
  });

  it('rejects invalid pageSize', () => {
    expect(parseError({ ...valid, pageSize: 'Letter' }, 'pageSize')).toBe(
      'notebooks.create.pageSizeRequired',
    );
  });

  it('accepts valid 6-digit hex with #', () => {
    const result = createNotebookSchema.safeParse({
      ...valid,
      coverColor: '#FF00AA',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coverColor).toBe('#FF00AA');
    }
  });

  it('accepts valid 6-digit hex without # and normalizes', () => {
    const result = createNotebookSchema.safeParse({
      ...valid,
      coverColor: 'FF00AA',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.coverColor).toBe('#FF00AA');
    }
  });

  it('rejects 3-digit hex shorthand', () => {
    expect(parseError({ ...valid, coverColor: '#F0A' }, 'coverColor')).toBe(
      'notebooks.create.invalidHex',
    );
  });

  it('rejects non-hex string', () => {
    expect(parseError({ ...valid, coverColor: 'red' }, 'coverColor')).toBe(
      'notebooks.create.invalidHex',
    );
  });

  it('rejects empty coverColor', () => {
    expect(parseError({ ...valid, coverColor: '' }, 'coverColor')).toBe(
      'notebooks.create.invalidHex',
    );
  });
});
