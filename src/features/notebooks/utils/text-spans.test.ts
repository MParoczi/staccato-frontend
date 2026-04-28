import { describe, expect, it } from 'vitest';
import {
  mergeAdjacentSpans,
  splitSpanAt,
  splitSpansAtSelection,
  totalLength,
} from './text-spans';
import type { TextSpan } from '@/lib/types';

const span = (text: string, bold = false): TextSpan => ({ text, bold });

describe('totalLength', () => {
  it('returns 0 for empty array', () => {
    expect(totalLength([])).toBe(0);
  });

  it('sums text lengths', () => {
    expect(totalLength([span('ab'), span('cde'), span('')])).toBe(5);
  });
});

describe('splitSpanAt', () => {
  it('returns unchanged copy when offset is 0', () => {
    const input = [span('hello', true)];
    const out = splitSpanAt(input, 0, 0);
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
  });

  it('returns unchanged copy when offset equals span length', () => {
    const input = [span('hello', true)];
    const out = splitSpanAt(input, 0, 5);
    expect(out).toEqual(input);
  });

  it('splits mid-span into two pieces preserving bold', () => {
    const out = splitSpanAt([span('hello', true)], 0, 2);
    expect(out).toEqual([span('he', true), span('llo', true)]);
  });

  it('splits without affecting siblings', () => {
    const out = splitSpanAt(
      [span('aa', false), span('bbcc', true), span('dd', false)],
      1,
      2,
    );
    expect(out).toEqual([
      span('aa', false),
      span('bb', true),
      span('cc', true),
      span('dd', false),
    ]);
  });

  it('throws on out-of-range spanIndex', () => {
    expect(() => splitSpanAt([span('a')], 1, 0)).toThrow(RangeError);
    expect(() => splitSpanAt([span('a')], -1, 0)).toThrow(RangeError);
  });

  it('throws on out-of-range charOffset', () => {
    expect(() => splitSpanAt([span('hi')], 0, 3)).toThrow(RangeError);
    expect(() => splitSpanAt([span('hi')], 0, -1)).toThrow(RangeError);
  });
});

describe('splitSpansAtSelection', () => {
  it('returns empty selection unchanged', () => {
    const input = [span('hello')];
    const result = splitSpansAtSelection(
      input,
      { spanIndex: 0, charOffset: 2 },
      { spanIndex: 0, charOffset: 2 },
    );
    expect(result.spans).toEqual(input);
    expect(result.selectedIndices).toEqual([]);
  });

  it('handles empty input', () => {
    const result = splitSpansAtSelection(
      [],
      { spanIndex: 0, charOffset: 0 },
      { spanIndex: 0, charOffset: 0 },
    );
    expect(result.spans).toEqual([]);
    expect(result.selectedIndices).toEqual([]);
  });

  it('splits within a single span into 3 pieces and selects the middle', () => {
    const result = splitSpansAtSelection(
      [span('hello')],
      { spanIndex: 0, charOffset: 1 },
      { spanIndex: 0, charOffset: 4 },
    );
    expect(result.spans).toEqual([span('h'), span('ell'), span('o')]);
    expect(result.selectedIndices).toEqual([1]);
  });

  it('produces 2-piece split when selection touches the start boundary', () => {
    const result = splitSpansAtSelection(
      [span('hello')],
      { spanIndex: 0, charOffset: 0 },
      { spanIndex: 0, charOffset: 3 },
    );
    expect(result.spans).toEqual([span('hel'), span('lo')]);
    expect(result.selectedIndices).toEqual([0]);
  });

  it('produces 2-piece split when selection touches the end boundary', () => {
    const result = splitSpansAtSelection(
      [span('hello')],
      { spanIndex: 0, charOffset: 2 },
      { spanIndex: 0, charOffset: 5 },
    );
    expect(result.spans).toEqual([span('he'), span('llo')]);
    expect(result.selectedIndices).toEqual([1]);
  });

  it('selects an entire span when selection spans its full range', () => {
    const result = splitSpansAtSelection(
      [span('aa'), span('bb'), span('cc')],
      { spanIndex: 1, charOffset: 0 },
      { spanIndex: 1, charOffset: 2 },
    );
    expect(result.spans).toEqual([span('aa'), span('bb'), span('cc')]);
    expect(result.selectedIndices).toEqual([1]);
  });

  it('splits across 3 spans correctly at both ends', () => {
    const result = splitSpansAtSelection(
      [span('aaaa'), span('bbbb'), span('cccc')],
      { spanIndex: 0, charOffset: 2 },
      { spanIndex: 2, charOffset: 2 },
    );
    expect(result.spans).toEqual([
      span('aa'),
      span('aa'),
      span('bbbb'),
      span('cc'),
      span('cc'),
    ]);
    // Selected: middle of split-aa, all of bbbb, first half of split-cc
    expect(result.selectedIndices).toEqual([1, 2, 3]);
  });

  it('normalises a reversed selection (focus before anchor)', () => {
    const forward = splitSpansAtSelection(
      [span('hello')],
      { spanIndex: 0, charOffset: 1 },
      { spanIndex: 0, charOffset: 4 },
    );
    const reversed = splitSpansAtSelection(
      [span('hello')],
      { spanIndex: 0, charOffset: 4 },
      { spanIndex: 0, charOffset: 1 },
    );
    expect(reversed).toEqual(forward);
  });

  it('throws on invalid positions', () => {
    expect(() =>
      splitSpansAtSelection(
        [span('a')],
        { spanIndex: 0, charOffset: 5 },
        { spanIndex: 0, charOffset: 0 },
      ),
    ).toThrow(RangeError);
  });
});

describe('mergeAdjacentSpans', () => {
  it('returns empty for empty input', () => {
    expect(mergeAdjacentSpans([])).toEqual([]);
  });

  it('returns single-element input as a fresh equivalent', () => {
    const out = mergeAdjacentSpans([span('a', true)]);
    expect(out).toEqual([span('a', true)]);
  });

  it('drops zero-length spans', () => {
    expect(
      mergeAdjacentSpans([span(''), span('a'), span(''), span('b'), span('')]),
    ).toEqual([span('ab')]);
  });

  it('merges adjacent spans with the same bold', () => {
    expect(
      mergeAdjacentSpans([span('a', false), span('b', false), span('c', true)]),
    ).toEqual([span('ab', false), span('c', true)]);
  });

  it('preserves order and survivor bold', () => {
    expect(
      mergeAdjacentSpans([
        span('a', true),
        span('b', false),
        span('c', false),
        span('d', true),
      ]),
    ).toEqual([span('a', true), span('bc', false), span('d', true)]);
  });

  it('is idempotent', () => {
    const input = [span('a', true), span('b', true), span('c', false), span('', false)];
    const once = mergeAdjacentSpans(input);
    const twice = mergeAdjacentSpans(once);
    expect(twice).toEqual(once);
  });
});

