/**
 * DOM ↔ TextSpan-coordinate helpers for the contentEditable TextSpanEditor
 * (Plan 01-04, F9 / EDIT-01).
 *
 * The editor root contains exactly one
 * `<span data-span-index="N" data-bold="true|false">text</span>` element per
 * TextSpan, with at most one text-node child per span (no nested DOM). These
 * helpers convert between DOM `(node, offset)` pairs (used by the
 * `Selection`/`Range` APIs) and `(spanIndex, charOffset)` pairs (used by the
 * pure TextSpan utilities in `utils/text-spans.ts`).
 *
 * Pure / no React. Tested via jsdom.
 */

export interface SpanCoord {
  spanIndex: number;
  charOffset: number;
}

export interface SelectionCoords {
  anchor: SpanCoord;
  focus: SpanCoord;
}

const SPAN_INDEX_ATTR = 'data-span-index';

/** True when `node` is a descendant of `root` (or `root` itself). */
function isWithin(root: Node, node: Node): boolean {
  return root === node || root.contains(node);
}

/** Find the `<span data-span-index>` element that the given node belongs to, if any. */
function findOwningSpan(node: Node, root: HTMLElement): HTMLElement | null {
  let cur: Node | null = node;
  while (cur && cur !== root) {
    if (cur.nodeType === Node.ELEMENT_NODE) {
      const el = cur as HTMLElement;
      if (el.hasAttribute(SPAN_INDEX_ATTR)) return el;
    }
    cur = cur.parentNode;
  }
  return null;
}

/** Read all `data-span-index` spans inside `root`, ordered by their attribute value. */
function listSpans(root: HTMLElement): HTMLElement[] {
  const els = Array.from(
    root.querySelectorAll<HTMLElement>(`[${SPAN_INDEX_ATTR}]`),
  );
  els.sort((a, b) => {
    const ai = Number.parseInt(a.getAttribute(SPAN_INDEX_ATTR) ?? '0', 10);
    const bi = Number.parseInt(b.getAttribute(SPAN_INDEX_ATTR) ?? '0', 10);
    return ai - bi;
  });
  return els;
}

/**
 * Convert a DOM `(node, offset)` pair (as produced by `Range`/`Selection`)
 * into a `(spanIndex, charOffset)` coordinate. Returns `null` if the position
 * is not inside `root` or cannot be resolved to a span.
 */
export function domToSpanCoord(
  root: HTMLElement,
  node: Node,
  offset: number,
): SpanCoord | null {
  if (!isWithin(root, node)) return null;

  // Case 1: position is inside a text node — owning span gives spanIndex,
  // offset is the char offset directly.
  if (node.nodeType === Node.TEXT_NODE) {
    const span = findOwningSpan(node, root);
    if (!span) return null;
    const spanIndex = Number.parseInt(
      span.getAttribute(SPAN_INDEX_ATTR) ?? '',
      10,
    );
    if (Number.isNaN(spanIndex)) return null;
    return { spanIndex, charOffset: offset };
  }

  // Case 2: position is on an element. Two sub-cases:
  // 2a. The element IS a span[data-span-index] — offset selects between its
  //     children. Since we constrain spans to one text-node child, offset 0
  //     means the start of the span (charOffset 0) and offset >= 1 means the
  //     end of the span (charOffset = text length).
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (el.hasAttribute(SPAN_INDEX_ATTR)) {
      const spanIndex = Number.parseInt(
        el.getAttribute(SPAN_INDEX_ATTR) ?? '',
        10,
      );
      if (Number.isNaN(spanIndex)) return null;
      const text = el.textContent ?? '';
      const charOffset = offset === 0 ? 0 : text.length;
      return { spanIndex, charOffset };
    }

    // 2b. The element is the editor root (or another wrapper). Offset is the
    //     child index — the position sits BETWEEN child[offset-1] and
    //     child[offset]. Map to (spanIndex, charOffset) by consulting the
    //     child to the left when possible (end of that span), else the child
    //     to the right (start of that span).
    if (el === root || isWithin(root, el)) {
      const spans = listSpans(root);
      if (spans.length === 0) return { spanIndex: 0, charOffset: 0 };
      const childAtOffset = el.childNodes[offset] ?? null;
      const childBefore = offset > 0 ? el.childNodes[offset - 1] ?? null : null;

      if (childBefore && childBefore.nodeType === Node.ELEMENT_NODE) {
        const beforeEl = childBefore as HTMLElement;
        if (beforeEl.hasAttribute(SPAN_INDEX_ATTR)) {
          const spanIndex = Number.parseInt(
            beforeEl.getAttribute(SPAN_INDEX_ATTR) ?? '',
            10,
          );
          if (!Number.isNaN(spanIndex)) {
            return {
              spanIndex,
              charOffset: (beforeEl.textContent ?? '').length,
            };
          }
        }
      }

      if (childAtOffset && childAtOffset.nodeType === Node.ELEMENT_NODE) {
        const atEl = childAtOffset as HTMLElement;
        if (atEl.hasAttribute(SPAN_INDEX_ATTR)) {
          const spanIndex = Number.parseInt(
            atEl.getAttribute(SPAN_INDEX_ATTR) ?? '',
            10,
          );
          if (!Number.isNaN(spanIndex)) {
            return { spanIndex, charOffset: 0 };
          }
        }
      }

      // Fallback: clamp to last span end.
      const last = spans[spans.length - 1];
      const lastIndex = Number.parseInt(
        last.getAttribute(SPAN_INDEX_ATTR) ?? '0',
        10,
      );
      return {
        spanIndex: Number.isNaN(lastIndex) ? 0 : lastIndex,
        charOffset: (last.textContent ?? '').length,
      };
    }
  }

  return null;
}

/**
 * Convert a `(spanIndex, charOffset)` coordinate to a DOM `(node, offset)`
 * pair suitable for `Range.setStart` / `Range.setEnd`. Returns `null` if the
 * span isn't present in `root`.
 */
export function spanCoordToDom(
  root: HTMLElement,
  coord: SpanCoord,
): { node: Node; offset: number } | null {
  const spans = listSpans(root);
  const span = spans.find(
    (el) =>
      Number.parseInt(el.getAttribute(SPAN_INDEX_ATTR) ?? '', 10) ===
      coord.spanIndex,
  );
  if (!span) return null;

  // Span has at most one text-node child. If absent (empty span), point at
  // the span element with offset 0.
  const textNode = Array.from(span.childNodes).find(
    (n): n is Text => n.nodeType === Node.TEXT_NODE,
  );
  if (!textNode) {
    return { node: span, offset: 0 };
  }
  const clamped = Math.max(0, Math.min(coord.charOffset, textNode.length));
  return { node: textNode, offset: clamped };
}

/**
 * Capture the current `Selection` inside `root` as TextSpan coordinates.
 * Returns `null` if there is no selection or the selection is outside
 * `root`.
 */
export function captureSelection(root: HTMLElement): SelectionCoords | null {
  const sel = root.ownerDocument?.defaultView?.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  if (!sel.anchorNode || !sel.focusNode) return null;
  if (!isWithin(root, sel.anchorNode) || !isWithin(root, sel.focusNode)) {
    return null;
  }
  const anchor = domToSpanCoord(root, sel.anchorNode, sel.anchorOffset);
  const focus = domToSpanCoord(root, sel.focusNode, sel.focusOffset);
  if (!anchor || !focus) return null;
  return { anchor, focus };
}

/**
 * Restore the given selection coordinates inside `root`. Silent no-op if
 * either coord cannot be resolved.
 */
export function restoreSelection(
  root: HTMLElement,
  coords: SelectionCoords,
): void {
  const win = root.ownerDocument?.defaultView;
  const sel = win?.getSelection();
  if (!sel) return;
  const anchorDom = spanCoordToDom(root, coords.anchor);
  const focusDom = spanCoordToDom(root, coords.focus);
  if (!anchorDom || !focusDom) return;

  const range = root.ownerDocument!.createRange();
  range.setStart(anchorDom.node, anchorDom.offset);
  range.setEnd(focusDom.node, focusDom.offset);
  sel.removeAllRanges();
  // Use addRange for a collapsed-or-forward range; for reverse selection
  // (focus before anchor) we'd need setBaseAndExtent, but Range.setStart/
  // setEnd auto-orders so the resulting selection is forward — acceptable
  // for our editor (we don't preserve directionality across re-renders).
  sel.addRange(range);
}

