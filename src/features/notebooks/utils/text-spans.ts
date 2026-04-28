import type { TextSpan } from '@/lib/types';

/**
 * Pure TextSpan operations used by the inline-bold editor (F9 / EDIT-01).
 *
 * All functions are total on legal inputs (`spans` whose `text` strings are
 * any UTF-16 string, `bold` is boolean) and pure — they never mutate the
 * input arrays or span objects. Returned arrays are always fresh references
 * so React diffing detects changes; spans inside the returned array MAY be
 * referentially equal to inputs when no split is needed.
 */

/**
 * Total text length across all spans (sum of `text.length`).
 */
export function totalLength(spans: readonly TextSpan[]): number {
  let total = 0;
  for (const s of spans) total += s.text.length;
  return total;
}

/**
 * Split the span at array index `spanIndex` at character offset
 * `charOffset`, returning a new TextSpan[] with the same overall text but a
 * span boundary at the requested point.
 *
 * - If `charOffset` is `0` or equal to `spans[spanIndex].text.length`, the
 *   array is returned as a fresh copy unchanged (no zero-length span).
 * - Throws `RangeError` if `spanIndex` is out of bounds, or if `charOffset`
 *   is outside `[0, span.text.length]`.
 */
export function splitSpanAt(
  spans: readonly TextSpan[],
  spanIndex: number,
  charOffset: number,
): TextSpan[] {
  if (spanIndex < 0 || spanIndex >= spans.length) {
    throw new RangeError(
      `splitSpanAt: spanIndex ${spanIndex} out of range (length=${spans.length})`,
    );
  }
  const target = spans[spanIndex];
  if (charOffset < 0 || charOffset > target.text.length) {
    throw new RangeError(
      `splitSpanAt: charOffset ${charOffset} out of range (text length=${target.text.length})`,
    );
  }
  // No-op at boundaries: return a fresh array with the same span references.
  if (charOffset === 0 || charOffset === target.text.length) {
    return spans.slice();
  }
  const left: TextSpan = {
    text: target.text.slice(0, charOffset),
    bold: target.bold,
  };
  const right: TextSpan = {
    text: target.text.slice(charOffset),
    bold: target.bold,
  };
  const out = spans.slice();
  out.splice(spanIndex, 1, left, right);
  return out;
}

interface Position {
  spanIndex: number;
  charOffset: number;
}

/** Compare two positions; negative if `a` precedes `b`, 0 if equal, positive otherwise. */
function comparePositions(a: Position, b: Position): number {
  if (a.spanIndex !== b.spanIndex) return a.spanIndex - b.spanIndex;
  return a.charOffset - b.charOffset;
}

/**
 * Split spans so the half-open range [start, end) (after normalising
 * `anchor`/`focus`) sits exactly on span boundaries, and return the indices
 * of all spans that lie entirely inside the resulting selection. Callers
 * use those indices to flip `bold` on the selected slice.
 *
 * - A collapsed selection (anchor equals focus) returns `spans` unchanged
 *   plus `selectedIndices: []`.
 * - A reversed selection (focus before anchor) is normalised silently.
 */
export function splitSpansAtSelection(
  spans: readonly TextSpan[],
  anchor: Position,
  focus: Position,
): { spans: TextSpan[]; selectedIndices: number[] } {
  if (spans.length === 0) {
    return { spans: [], selectedIndices: [] };
  }

  // Validate positions before any work.
  for (const p of [anchor, focus]) {
    if (p.spanIndex < 0 || p.spanIndex >= spans.length) {
      throw new RangeError(
        `splitSpansAtSelection: spanIndex ${p.spanIndex} out of range`,
      );
    }
    const len = spans[p.spanIndex].text.length;
    if (p.charOffset < 0 || p.charOffset > len) {
      throw new RangeError(
        `splitSpansAtSelection: charOffset ${p.charOffset} out of range for span length ${len}`,
      );
    }
  }

  // Collapsed selection short-circuit.
  if (comparePositions(anchor, focus) === 0) {
    return { spans: spans.slice(), selectedIndices: [] };
  }

  // Normalise: ensure start <= end.
  const [start, end] =
    comparePositions(anchor, focus) < 0 ? [anchor, focus] : [focus, anchor];

  // Apply end split first (higher index) so start indices stay stable.
  let working = spans.slice();
  let endSpanIndex = end.spanIndex;
  let endOffset = end.charOffset;

  // Split at end position. If split actually happens, working grows by 1 at
  // endSpanIndex; the "end boundary" is then between endSpanIndex and
  // endSpanIndex+1. If at boundary already, the boundary is just before the
  // current position.
  const endTargetLen = working[endSpanIndex].text.length;
  if (endOffset > 0 && endOffset < endTargetLen) {
    working = splitSpanAt(working, endSpanIndex, endOffset);
    // After split, the boundary is between endSpanIndex (left half) and
    // endSpanIndex+1 (right half). Selected range ends at exclusive index
    // endSpanIndex+1.
    endSpanIndex = endSpanIndex + 1;
  } else if (endOffset === endTargetLen) {
    // Boundary is between endSpanIndex and endSpanIndex+1; exclusive end is
    // endSpanIndex+1.
    endSpanIndex = endSpanIndex + 1;
  }
  // else endOffset === 0: boundary is before endSpanIndex; exclusive end is
  // endSpanIndex (unchanged).

  let startSpanIndex = start.spanIndex;
  const startOffset = start.charOffset;
  const startTargetLen = working[startSpanIndex].text.length;
  if (startOffset > 0 && startOffset < startTargetLen) {
    working = splitSpanAt(working, startSpanIndex, startOffset);
    // After split, span at startSpanIndex is the left half (before
    // selection), span at startSpanIndex+1 is the right half (start of
    // selection). The end-boundary index shifts by +1.
    startSpanIndex = startSpanIndex + 1;
    endSpanIndex = endSpanIndex + 1;
  } else if (startOffset === startTargetLen) {
    // Boundary just after startSpanIndex; selection begins at startSpanIndex+1.
    startSpanIndex = startSpanIndex + 1;
  }
  // else startOffset === 0: boundary before startSpanIndex; selection
  // begins at startSpanIndex (unchanged).

  const selectedIndices: number[] = [];
  for (let i = startSpanIndex; i < endSpanIndex; i++) {
    selectedIndices.push(i);
  }
  return { spans: working, selectedIndices };
}

/**
 * Collapse adjacent spans with identical `bold`. Drops zero-length entries.
 *
 * Idempotent: `mergeAdjacentSpans(mergeAdjacentSpans(x))` deep-equals
 * `mergeAdjacentSpans(x)`.
 */
export function mergeAdjacentSpans(spans: readonly TextSpan[]): TextSpan[] {
  const out: TextSpan[] = [];
  for (const s of spans) {
    if (s.text.length === 0) continue;
    const prev = out[out.length - 1];
    if (prev && prev.bold === s.bold) {
      out[out.length - 1] = { text: prev.text + s.text, bold: prev.bold };
    } else {
      out.push({ text: s.text, bold: s.bold });
    }
  }
  return out;
}

