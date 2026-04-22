import { describe, it, expect } from 'vitest';
import { buildPageSequence } from './page-sequence';
import type { NotebookIndex, LessonPage } from '@/lib/types';

const NOTEBOOK_ID = 'nb-1';
const BASE = `/app/notebooks/${NOTEBOOK_ID}`;

function makeIndex(
  entries: Array<{ lessonId: string; title: string; startPageNumber: number }>,
): NotebookIndex {
  return {
    entries: entries.map((e) => ({
      ...e,
      createdAt: '2026-01-01T00:00:00Z',
    })),
  };
}

function makePages(lessonId: string, ids: string[]): LessonPage[] {
  return ids.map((id, i) => ({
    id,
    lessonId,
    pageNumber: i + 1,
    moduleCount: 0,
  }));
}

describe('buildPageSequence', () => {
  it('returns cover + index only when there are no lessons', () => {
    const seq = buildPageSequence(NOTEBOOK_ID, makeIndex([]), new Map());

    expect(seq).toHaveLength(2);
    expect(seq[0]).toEqual({
      globalPageNumber: 0,
      url: BASE,
      type: 'cover',
    });
    expect(seq[1]).toEqual({
      globalPageNumber: 1,
      url: `${BASE}/index`,
      type: 'index',
    });
  });

  it('returns 3 entries for a single lesson with 1 page using the real page id in the URL', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([{ lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 }]),
      new Map([['l1', makePages('l1', ['page-a'])]]),
    );

    expect(seq).toHaveLength(3);
    expect(seq[2]).toEqual({
      globalPageNumber: 2,
      url: `${BASE}/lessons/l1/pages/page-a`,
      type: 'lesson',
      lessonId: 'l1',
      pageId: 'page-a',
      lessonTitle: 'Lesson 1',
      pageNumberInLesson: 1,
      totalPagesInLesson: 1,
    });
  });

  it('numbers pages correctly for a single lesson with multiple pages and emits id-based URLs', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([{ lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 }]),
      new Map([['l1', makePages('l1', ['pa', 'pb', 'pc'])]]),
    );

    expect(seq).toHaveLength(5); // cover + index + 3 pages
    expect(seq[2].pageNumberInLesson).toBe(1);
    expect(seq[3].pageNumberInLesson).toBe(2);
    expect(seq[4].pageNumberInLesson).toBe(3);
    expect(seq[2].totalPagesInLesson).toBe(3);
    expect(seq[3].totalPagesInLesson).toBe(3);
    expect(seq[4].totalPagesInLesson).toBe(3);
    expect(seq[2].url).toBe(`${BASE}/lessons/l1/pages/pa`);
    expect(seq[3].url).toBe(`${BASE}/lessons/l1/pages/pb`);
    expect(seq[4].url).toBe(`${BASE}/lessons/l1/pages/pc`);
    expect(seq[2].pageId).toBe('pa');
    expect(seq[3].pageId).toBe('pb');
    expect(seq[4].pageId).toBe('pc');
  });

  it('sorts pages within a lesson by pageNumber ascending regardless of input order', () => {
    const unordered: LessonPage[] = [
      { id: 'pc', lessonId: 'l1', pageNumber: 3, moduleCount: 0 },
      { id: 'pa', lessonId: 'l1', pageNumber: 1, moduleCount: 0 },
      { id: 'pb', lessonId: 'l1', pageNumber: 2, moduleCount: 0 },
    ];

    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([{ lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 }]),
      new Map([['l1', unordered]]),
    );

    expect(seq[2].pageId).toBe('pa');
    expect(seq[3].pageId).toBe('pb');
    expect(seq[4].pageId).toBe('pc');
  });

  it('handles multiple lessons with correct cross-lesson sequence', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([
        { lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 },
        { lessonId: 'l2', title: 'Lesson 2', startPageNumber: 4 },
      ]),
      new Map([
        ['l1', makePages('l1', ['l1p1', 'l1p2'])],
        ['l2', makePages('l2', ['l2p1', 'l2p2', 'l2p3'])],
      ]),
    );

    expect(seq).toHaveLength(7); // cover + index + 2 + 3
    // Lesson 1 pages
    expect(seq[2].lessonId).toBe('l1');
    expect(seq[3].lessonId).toBe('l1');
    // Lesson 2 pages
    expect(seq[4].lessonId).toBe('l2');
    expect(seq[5].lessonId).toBe('l2');
    expect(seq[6].lessonId).toBe('l2');
  });

  it('handles cross-lesson boundaries with correct prev/next URLs', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([
        { lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 },
        { lessonId: 'l2', title: 'Lesson 2', startPageNumber: 4 },
      ]),
      new Map([
        ['l1', makePages('l1', ['l1p1', 'l1p2'])],
        ['l2', makePages('l2', ['l2p1'])],
      ]),
    );

    // Last page of Lesson 1 (index 3) and first page of Lesson 2 (index 4) are adjacent
    const lastL1 = seq[3];
    const firstL2 = seq[4];
    expect(lastL1.url).toBe(`${BASE}/lessons/l1/pages/l1p2`);
    expect(firstL2.url).toBe(`${BASE}/lessons/l2/pages/l2p1`);
    // They are adjacent in the sequence
    expect(firstL2.globalPageNumber).toBe(lastL1.globalPageNumber + 1);
  });

  it('assigns sequential global page numbers throughout', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([
        { lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 },
        { lessonId: 'l2', title: 'Lesson 2', startPageNumber: 5 },
      ]),
      new Map([
        ['l1', makePages('l1', ['a', 'b', 'c'])],
        ['l2', makePages('l2', ['d', 'e'])],
      ]),
    );

    for (let i = 0; i < seq.length; i++) {
      expect(seq[i].globalPageNumber).toBe(i);
    }
  });

  it('skips lessons whose pages are not present in the map', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([
        { lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 },
        { lessonId: 'l2', title: 'Lesson 2', startPageNumber: 4 },
      ]),
      new Map([['l1', makePages('l1', ['l1p1'])]]),
    );

    // Only cover + index + l1's single page; l2 is skipped because its
    // pages have not been hydrated yet.
    expect(seq).toHaveLength(3);
    expect(seq[2].lessonId).toBe('l1');
  });

  it('cover is the first entry (no prev URL possible)', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([{ lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 }]),
      new Map([['l1', makePages('l1', ['p1'])]]),
    );

    expect(seq[0].type).toBe('cover');
    expect(seq[0].globalPageNumber).toBe(0);
    // There is no entry before index 0
    expect(seq[-1]).toBeUndefined();
  });

  it('last page is the final entry (no next URL possible)', () => {
    const seq = buildPageSequence(
      NOTEBOOK_ID,
      makeIndex([{ lessonId: 'l1', title: 'Lesson 1', startPageNumber: 2 }]),
      new Map([['l1', makePages('l1', ['p1', 'p2'])]]),
    );

    const last = seq[seq.length - 1];
    expect(last.type).toBe('lesson');
    expect(last.globalPageNumber).toBe(3);
    // There is no entry after the last
    expect(seq[seq.length]).toBeUndefined();
  });
});
