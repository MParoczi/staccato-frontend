import { describe, it, expect } from 'vitest';
import { lessonTitleSchema } from './lesson-title-schema';

const valid = { title: 'My Lesson' };

function parseError(data: Record<string, unknown>) {
  const result = lessonTitleSchema.safeParse(data);
  if (result.success) return null;
  return result.error.issues.find((i) => i.path[0] === 'title')?.message ?? null;
}

describe('lessonTitleSchema', () => {
  it('passes with valid input', () => {
    const result = lessonTitleSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('trims whitespace from title', () => {
    const result = lessonTitleSchema.safeParse({ title: '  My Lesson  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Lesson');
    }
  });

  it('rejects empty title', () => {
    expect(parseError({ title: '' })).toBe('notebooks.shell.lessonTitle.required');
  });

  it('rejects whitespace-only title', () => {
    expect(parseError({ title: '   ' })).toBe('notebooks.shell.lessonTitle.required');
  });

  it('accepts title at 200 characters', () => {
    const result = lessonTitleSchema.safeParse({ title: 'A'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('rejects title exceeding 200 characters', () => {
    expect(parseError({ title: 'A'.repeat(201) })).toBe(
      'notebooks.shell.lessonTitle.maxLength',
    );
  });

  it('accepts single character title', () => {
    const result = lessonTitleSchema.safeParse({ title: 'A' });
    expect(result.success).toBe(true);
  });

  it('rejects missing title field', () => {
    const result = lessonTitleSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
