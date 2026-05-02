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
/** Zero-width space used inside the empty-state placeholder span so the
 * contentEditable caret reliably lands INSIDE the span (browsers don't
 * place the caret inside a truly empty inline element, which causes the
 * first typed character to land as a sibling text node and corrupts the
 * React-owned DOM). Stripped on read. */
const EMPTY_ANCHOR = '\u200B';

function stripAnchor(s: string): string {
  return s.replace(/\u200B/g, '');
}

/** Structural equality on span arrays — used to short-circuit DOM rebuilds. */
function spansEqual(
  a: readonly TextSpan[],
  b: readonly TextSpan[],
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].text !== b[i].text || a[i].bold !== b[i].bold) return false;
  }
  return true;
}

/**
 * Imperatively (re)build `root`'s children to mirror `spans`. Always wipes
 * existing children first — caller is responsible for capturing/restoring
 * caret position around this. Banned from using innerHTML/dangerouslySet*
 * per the editor's XSS-safety contract; uses createElement/createTextNode.
 *
 * Empty `spans` is rendered as a single span carrying a ZERO WIDTH SPACE
 * so contentEditable can anchor the caret inside it on focus.
 */
function buildDomFromSpans(
  root: HTMLElement,
  spans: readonly TextSpan[],
): void {
  while (root.firstChild) root.removeChild(root.firstChild);
  const doc = root.ownerDocument;
  if (!doc) return;
  if (spans.length === 0) {
    const span = doc.createElement('span');
    span.setAttribute('data-span-index', '0');
    span.setAttribute('data-bold', 'false');
    span.appendChild(doc.createTextNode(EMPTY_ANCHOR));
    root.appendChild(span);
    return;
  }
  spans.forEach((s, i) => {
    const span = doc.createElement('span');
    span.setAttribute('data-span-index', String(i));
    span.setAttribute('data-bold', s.bold ? 'true' : 'false');
    if (s.bold) span.style.fontWeight = '700';
    span.appendChild(doc.createTextNode(s.text));
    root.appendChild(span);
  });
}

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
    const text = stripAnchor(el.textContent ?? '');
    // Prefer the bold from prev[idx] if available — it's the source of truth
    // and matches `data-bold` attribute we just rendered.
    const fallback = !Number.isNaN(idx) ? prev[idx] : undefined;
    out.push({ text, bold: fallback?.bold ?? bold });
  }
  // Drop empty placeholder spans created by the empty-state render so the
  // caller sees a true [] when the user has erased everything.
  const filtered = out.filter((s) => s.text.length > 0);
  return filtered.length === 0 ? [] : out;
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
  /**
   * Mirror of the spans currently realised in the DOM. The layout effect
   * compares incoming `value` against this ref to decide whether to wipe
   * and rebuild the contentEditable subtree. Imperative span mutations
   * (toggleBold, paste, undo/redo) and `handleInput` (which trusts the
   * browser-mutated DOM) keep this in sync so React's reconciler never
   * touches the contentEditable's children directly.
   */
  const domValueRef = useRef<readonly TextSpan[]>(value);

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
    // Bold toggle is a programmatic span mutation — rebuild DOM so the
    // updated bold attributes/styles land before selection restore.
    if (rootRef.current) {
      buildDomFromSpans(rootRef.current, merged);
      domValueRef.current = merged;
    }
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
      // Subtract any ZWSP characters that precede the captured offset so
      // the absolute position reflects post-strip text, matching `merged`.
      const stripBeforeAnchor = countAnchorsBefore(root, coords.anchor);
      const stripBeforeFocus = countAnchorsBefore(root, coords.focus);
      const abs = Math.max(
        0,
        coordToAbs(projected, coords.anchor) - stripBeforeAnchor,
      );
      const absFocus = Math.max(
        0,
        coordToAbs(projected, coords.focus) - stripBeforeFocus,
      );
      restoreRef.current = {
        anchor: absToCoord(merged, abs),
        focus: absToCoord(merged, absFocus),
      };
    }
    // Empty-state recovery: when the user deletes all content, browsers
    // (notably Chrome) strip the `[data-span-index]` spans out of the
    // contentEditable and leave a bare `<br>` or an empty root. Without
    // intervention the layoutEffect won't restore the anchor span
    // (because `value` will already equal `domValueRef.current = []`),
    // so the next keystroke lands in an orphan text node and is silently
    // dropped — only on a later re-render does the DOM realign. Rebuild
    // the empty-state span now and re-anchor the caret inside it so the
    // very next keystroke types into a tracked span.
    if (
      merged.length === 0 &&
      !root.querySelector('[data-span-index]')
    ) {
      buildDomFromSpans(root, merged);
      // Place caret at start of the freshly-rebuilt empty-anchor span.
      restoreSelection(root, {
        anchor: { spanIndex: 0, charOffset: 0 },
        focus: { spanIndex: 0, charOffset: 0 },
      });
      // The selection we just restored is authoritative — drop any stale
      // restoreRef set above so the layoutEffect doesn't overwrite it.
      restoreRef.current = null;
    }
    // Mark DOM as in-sync with `merged` BEFORE calling onChange so the
    // layoutEffect on the resulting parent re-render skips the rebuild
    // (the user's typed DOM is already correct — we mustn't wipe it).
    domValueRef.current = merged;
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
      // Paste replaces a selection — rebuild DOM imperatively so the
      // browser's native paste DOM (which we just suppressed via
      // preventDefault) isn't carried into our span structure.
      buildDomFromSpans(root, merged);
      domValueRef.current = merged;
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

  // ─── Imperative DOM management ───────────────────────────────────────
  // Render NO React children inside the contentEditable root. The
  // children are constructed and updated imperatively from `value` via
  // `buildDomFromSpans` so React's reconciler never tries to diff against
  // a browser-mutated DOM (which causes text duplication, lost typed
  // characters, and `removeChild: not a child` crashes when the user
  // types or deletes). `domValueRef` (declared at top of component) is
  // the truthful mirror of what's in the DOM. Imperative span mutations
  // (toggleBold, paste) and `handleInput` (which trusts the
  // browser-mutated DOM after typing) keep the ref in sync. The
  // layoutEffect below rebuilds DOM ONLY when `value` differs
  // structurally from `domValueRef` — i.e., genuine external changes
  // (undo/redo, parent-driven resets). For typing, `value` will
  // eventually equal `domValueRef` once history.push catches up; until
  // then the in-DOM content is the truth and is preserved.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!spansEqual(value, domValueRef.current)) {
      // External (programmatic) value change — rebuild DOM.
      buildDomFromSpans(root, value);
      domValueRef.current = value;
    }
    if (restoreRef.current) {
      restoreSelection(root, restoreRef.current);
      restoreRef.current = null;
    }
  }, [value]);

  // Build initial DOM on mount (covers the very first render).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || root.childNodes.length > 0) return;
    buildDomFromSpans(root, value);
    domValueRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editorStyle: CSSProperties = {
    caretColor: 'var(--color-primary)',
    minHeight: '1.5em',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    // Break long unbroken strings (URLs, hashes) so the contentEditable
    // reflows inside the module's overflow-hidden clip rect instead of
    // overflowing horizontally. `anywhere` is required (rather than
    // `break-word`) because `break-word` only breaks at word boundaries.
    overflowWrap: 'anywhere',
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
    />
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

/**
 * Count ZERO WIDTH SPACE characters that precede the captured DOM
 * coord, summed across all earlier spans plus the in-span prefix. Used
 * by `handleInput` to translate a DOM-relative caret offset (which can
 * include ZWSPs) into a stripped-text-relative absolute offset.
 */
function countAnchorsBefore(root: HTMLElement, coord: SpanCoord): number {
  const spanEls = Array.from(
    root.querySelectorAll<HTMLElement>('[data-span-index]'),
  );
  let count = 0;
  for (let i = 0; i < spanEls.length; i++) {
    const text = spanEls[i].textContent ?? '';
    if (i < coord.spanIndex) {
      count += (text.match(/\u200B/g) ?? []).length;
    } else if (i === coord.spanIndex) {
      const prefix = text.slice(0, coord.charOffset);
      count += (prefix.match(/\u200B/g) ?? []).length;
      break;
    }
  }
  return count;
}







