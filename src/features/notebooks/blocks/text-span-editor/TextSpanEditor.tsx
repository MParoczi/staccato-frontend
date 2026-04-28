import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { TextSpan } from '@/lib/types';
import {
  mergeAdjacentSpans,
  splitSpanAt,
  splitSpansAtSelection,
  totalLength,
} from '../../utils/text-spans';
import {
  captureSelection,
  restoreSelection,
  type SelectionCoords,
  type SpanCoord,
} from './selection-utils';

export interface TextSpanEditorProps {
  value: TextSpan[];
  onChange: (next: TextSpan[]) => void;
  /** Bold toggle state mirrored by the toolbar button. */
  isBoldActive: boolean;
  /** Editor reports a new active-bold flag (selection change or pendingBold flip). */
  onBoldStateChange: (next: boolean) => void;
  /** Imperative handle published once on mount. */
  onReady?: (api: { toggleBold: () => void }) => void;
  /** i18n: defaults to `editor.textSpanPlaceholder`. */
  placeholder?: string;
  /** i18n: defaults to `editor.textSpanLabel`. */
  ariaLabel?: string;
}

/**
 * Read the current DOM children of `root` and project them back to
 * `TextSpan[]`. We trust that React's render placed exactly one
 * `<span data-span-index>` per TextSpan; if the user typed, those spans now
 * carry the freshly-edited textContent.
 */
function readSpansFromDom(root: HTMLElement, prev: readonly TextSpan[]): TextSpan[] {
  const spanEls = Array.from(
    root.querySelectorAll<HTMLElement>('[data-span-index]'),
  );
  if (spanEls.length === 0) return [];
  // Map by current data-span-index so we can recover bold flag from `prev`.
  const out: TextSpan[] = [];
  for (const el of spanEls) {
    const idx = Number.parseInt(el.getAttribute('data-span-index') ?? '', 10);
    const bold = el.getAttribute('data-bold') === 'true';
    const text = el.textContent ?? '';
    // Prefer the bold from prev[idx] if available — it's the source of truth
    // and matches `data-bold` attribute we just rendered.
    const fallback = !Number.isNaN(idx) ? prev[idx] : undefined;
    out.push({ text, bold: fallback?.bold ?? bold });
  }
  return out;
}

/**
 * The contentEditable TextSpan editor (UI-SPEC §4.8, plan 01-04).
 *
 * Hard rules:
 * - Never assigns `innerHTML` or `dangerouslySetInnerHTML` (XSS-safe).
 * - Bold toggle uses `splitSpansAtSelection` + `mergeAdjacentSpans`, not
 *   `document.execCommand`.
 * - Paste handler inserts `text/plain` only.
 */
export function TextSpanEditor({
  value,
  onChange,
  isBoldActive,
  onBoldStateChange,
  onReady,
  placeholder,
  ariaLabel,
}: TextSpanEditorProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  /** Pending bold for collapsed insertion (next typed char inherits this). */
  const pendingBoldRef = useRef<boolean>(isBoldActive);
  /** Selection coords to restore after the next render. */
  const restoreRef = useRef<SelectionCoords | null>(null);
  /** True while an IME composition is in flight — suppress reconciliation. */
  const composingRef = useRef(false);
  /** Latest props captured for use inside imperative `toggleBold`. */
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onBoldStateChangeRef = useRef(onBoldStateChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onBoldStateChangeRef.current = onBoldStateChange;
  }, [onBoldStateChange]);

  // Keep pendingBold in sync when caller flips isBoldActive externally
  // (e.g. toolbar Bold pressed while caret is collapsed).
  useEffect(() => {
    pendingBoldRef.current = isBoldActive;
  }, [isBoldActive]);

  /**
   * Compute target bold for a non-collapsed selection: if any selected span
   * is non-bold, set all to TRUE; else (all bold already) set all to FALSE.
   */
  const computeTargetBold = useCallback(
    (spans: readonly TextSpan[], selectedIndices: number[]): boolean => {
      if (selectedIndices.length === 0) return !pendingBoldRef.current;
      return selectedIndices.some((i) => !spans[i].bold);
    },
    [],
  );

  /** Toggle bold over the current selection (or pendingBold if collapsed). */
  const toggleBold = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const sel = captureSelection(root);
    if (!sel) return;
    const collapsed =
      sel.anchor.spanIndex === sel.focus.spanIndex &&
      sel.anchor.charOffset === sel.focus.charOffset;

    if (collapsed) {
      const next = !pendingBoldRef.current;
      pendingBoldRef.current = next;
      onBoldStateChangeRef.current(next);
      return;
    }

    const result = splitSpansAtSelection(
      valueRef.current,
      sel.anchor,
      sel.focus,
    );
    const target = computeTargetBold(result.spans, result.selectedIndices);
    const flipped = result.spans.map((s, i) =>
      result.selectedIndices.includes(i) ? { ...s, bold: target } : s,
    );
    const merged = mergeAdjacentSpans(flipped);
    // Selection coords need to survive a merge — collect the (non-merged)
    // boundary char positions in absolute terms, then map back to merged.
    const absStart = sumLenBefore(result.spans, result.selectedIndices[0] ?? 0);
    const absEnd =
      absStart +
      result.selectedIndices.reduce(
        (acc, i) => acc + result.spans[i].text.length,
        0,
      );
    restoreRef.current = absRangeToCoords(merged, absStart, absEnd);
    pendingBoldRef.current = target;
    onBoldStateChangeRef.current(target);
    onChangeRef.current(merged);
  }, [computeTargetBold]);

  // Publish imperative API once.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });
  useEffect(() => {
    onReadyRef.current?.({ toggleBold });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Restore selection after every render that requested it. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (restoreRef.current) {
      restoreSelection(root, restoreRef.current);
      restoreRef.current = null;
    }
  });

  const handleBeforeInput = useCallback((e: FormEvent<HTMLDivElement>) => {
    // React's beforeInput synthetic event surfaces inputType.
    const native = (e.nativeEvent as InputEvent) ?? null;
    const inputType = native?.inputType;
    if (inputType === 'historyUndo' || inputType === 'historyRedo') {
      // Parent owns history — block the browser-native undo/redo.
      e.preventDefault();
    }
  }, []);

  const handleInput = useCallback(() => {
    if (composingRef.current) return;
    const root = rootRef.current;
    if (!root) return;
    // Capture selection coords BEFORE we propagate state; the next render
    // will recreate the DOM nodes and React's diff may collapse the caret.
    const coords = captureSelection(root);
    const projected = readSpansFromDom(root, valueRef.current);
    const merged = mergeAdjacentSpans(projected);
    if (coords) {
      // Map captured coords (in pre-merge index space) onto merged spans.
      const abs = coordToAbs(projected, coords.anchor);
      const absFocus = coordToAbs(projected, coords.focus);
      restoreRef.current = {
        anchor: absToCoord(merged, abs),
        focus: absToCoord(merged, absFocus),
      };
    }
    onChangeRef.current(merged);
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const root = rootRef.current;
      if (!root) return;
      const text = e.clipboardData.getData('text/plain');
      if (!text) return;
      const sel = captureSelection(root);
      if (!sel) return;

      const collapsed =
        sel.anchor.spanIndex === sel.focus.spanIndex &&
        sel.anchor.charOffset === sel.focus.charOffset;
      const inserted: TextSpan = { text, bold: pendingBoldRef.current };

      let beforeAdj: TextSpan[];
      let after: TextSpan[];

      if (collapsed) {
        // Split at the caret if mid-span; insertion goes between halves.
        const cur = valueRef.current;
        if (cur.length === 0) {
          beforeAdj = [];
          after = [];
        } else {
          const split = splitSpanAt(cur, sel.anchor.spanIndex, sel.anchor.charOffset);
          // After splitSpanAt at offset 0 or end, the array is unchanged so
          // the boundary is at sel.anchor.spanIndex (offset 0) or +1 (end).
          const boundaryIdx =
            sel.anchor.charOffset === 0
              ? sel.anchor.spanIndex
              : sel.anchor.spanIndex + 1;
          beforeAdj = split.slice(0, boundaryIdx);
          after = split.slice(boundaryIdx);
        }
      } else {
        const result = splitSpansAtSelection(
          valueRef.current,
          sel.anchor,
          sel.focus,
        );
        const startIdx = result.selectedIndices[0] ?? 0;
        const endIdx =
          (result.selectedIndices[result.selectedIndices.length - 1] ?? -1) + 1;
        beforeAdj = result.spans.slice(0, startIdx);
        after = result.spans.slice(endIdx);
      }

      const merged = mergeAdjacentSpans([...beforeAdj, inserted, ...after]);
      const absInsertEnd = sumLenBefore(beforeAdj, beforeAdj.length) + text.length;
      restoreRef.current = {
        anchor: absToCoord(merged, absInsertEnd),
        focus: absToCoord(merged, absInsertEnd),
      };
      onChangeRef.current(merged);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleBold();
        return;
      }
    },
    [toggleBold],
  );

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    composingRef.current = false;
    handleInput();
  }, [handleInput]);

  /**
   * Update pendingBold and notify caller when the caret moves and the new
   * position has a different bold context than the current pending flag.
   */
  const handleSelect = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const sel = captureSelection(root);
    if (!sel) return;
    const collapsed =
      sel.anchor.spanIndex === sel.focus.spanIndex &&
      sel.anchor.charOffset === sel.focus.charOffset;
    if (!collapsed) return;
    const span = valueRef.current[sel.anchor.spanIndex];
    if (!span) return;
    const ctxBold = span.bold;
    if (pendingBoldRef.current !== ctxBold) {
      pendingBoldRef.current = ctxBold;
      onBoldStateChangeRef.current(ctxBold);
    }
  }, []);

  const isEmpty = totalLength(value) === 0;
  const labelText = ariaLabel ?? t('editor.textSpanLabel');
  const placeholderText = placeholder ?? t('editor.textSpanPlaceholder');

  const editorStyle: CSSProperties = {
    caretColor: 'var(--color-primary)',
    minHeight: '1.5em',
    outline: 'none',
    whiteSpace: 'pre-wrap',
  };

  return (
    <div
      ref={rootRef}
      data-text-span-editor=""
      data-empty={isEmpty ? 'true' : 'false'}
      data-placeholder={placeholderText}
      role="textbox"
      aria-multiline="false"
      aria-label={labelText}
      contentEditable
      suppressContentEditableWarning
      style={editorStyle}
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onSelect={handleSelect}
    >
      {value.length === 0 ? (
        // Render a single empty span so DOM coords are always resolvable.
        <span data-span-index="0" data-bold="false" />
      ) : (
        value.map((span, i) => (
          <span
            key={i}
            data-span-index={i}
            data-bold={span.bold ? 'true' : 'false'}
            style={{ fontWeight: span.bold ? 700 : 'inherit' }}
          >
            {span.text}
          </span>
        ))
      )}
    </div>
  );
}

// ---------- abs-position helpers ----------

/** Sum of `text.length` for `spans[0..idx)` (idx exclusive). */
function sumLenBefore(spans: readonly TextSpan[], idx: number): number {
  let total = 0;
  for (let i = 0; i < Math.min(idx, spans.length); i++) total += spans[i].text.length;
  return total;
}

/** Convert a (spanIndex, charOffset) into an absolute character offset. */
function coordToAbs(spans: readonly TextSpan[], coord: SpanCoord): number {
  return sumLenBefore(spans, coord.spanIndex) + coord.charOffset;
}

/** Convert an absolute character offset into a (spanIndex, charOffset) on `spans`. */
function absToCoord(spans: readonly TextSpan[], abs: number): SpanCoord {
  if (spans.length === 0) return { spanIndex: 0, charOffset: 0 };
  let remaining = Math.max(0, abs);
  for (let i = 0; i < spans.length; i++) {
    const len = spans[i].text.length;
    if (remaining <= len) return { spanIndex: i, charOffset: remaining };
    remaining -= len;
  }
  // Past end: clamp to end of last span.
  const last = spans.length - 1;
  return { spanIndex: last, charOffset: spans[last].text.length };
}

/** Convert an absolute (start, end) range into selection coords on `spans`. */
function absRangeToCoords(
  spans: readonly TextSpan[],
  start: number,
  end: number,
): SelectionCoords {
  return { anchor: absToCoord(spans, start), focus: absToCoord(spans, end) };
}







