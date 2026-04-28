import { describe, expect, it, beforeEach } from 'vitest';
import {
  captureSelection,
  domToSpanCoord,
  restoreSelection,
  spanCoordToDom,
  type SpanCoord,
} from './selection-utils';

/**
 * Build a synthetic editor root containing one `<span data-span-index>`
 * per supplied span. Mimics the DOM that `TextSpanEditor` renders.
 */
function buildRoot(spans: { text: string; bold: boolean }[]): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-text-span-editor', '');
  spans.forEach((s, i) => {
    const el = document.createElement('span');
    el.setAttribute('data-span-index', String(i));
    el.setAttribute('data-bold', s.bold ? 'true' : 'false');
    if (s.text.length > 0) el.appendChild(document.createTextNode(s.text));
    root.appendChild(el);
  });
  document.body.appendChild(root);
  return root;
}

describe('selection-utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('domToSpanCoord ↔ spanCoordToDom round-trip', () => {
    it('round-trips every char position across a 3-span fixture', () => {
      const spans = [
        { text: 'hello', bold: false },
        { text: ' brave ', bold: true },
        { text: 'world', bold: false },
      ];
      const root = buildRoot(spans);

      for (let spanIndex = 0; spanIndex < spans.length; spanIndex++) {
        const len = spans[spanIndex].text.length;
        for (let charOffset = 0; charOffset <= len; charOffset++) {
          const coord: SpanCoord = { spanIndex, charOffset };
          const dom = spanCoordToDom(root, coord);
          expect(dom, `dom for ${spanIndex}/${charOffset}`).not.toBeNull();
          const back = domToSpanCoord(root, dom!.node, dom!.offset);
          expect(back).toEqual(coord);
        }
      }
    });
  });

  describe('boundary positions', () => {
    it('charOffset = 0 resolves to start of span', () => {
      const root = buildRoot([{ text: 'abc', bold: false }]);
      const dom = spanCoordToDom(root, { spanIndex: 0, charOffset: 0 })!;
      expect(domToSpanCoord(root, dom.node, dom.offset)).toEqual({
        spanIndex: 0,
        charOffset: 0,
      });
    });

    it('charOffset = text.length resolves to end of span', () => {
      const root = buildRoot([{ text: 'abc', bold: false }]);
      const dom = spanCoordToDom(root, { spanIndex: 0, charOffset: 3 })!;
      expect(domToSpanCoord(root, dom.node, dom.offset)).toEqual({
        spanIndex: 0,
        charOffset: 3,
      });
    });

    it('position between spans (root element offset) resolves to end of preceding span', () => {
      const root = buildRoot([
        { text: 'abc', bold: false },
        { text: 'def', bold: true },
      ]);
      // offset = 1 on root means "between child 0 and child 1" → end of span 0
      const coord = domToSpanCoord(root, root, 1);
      expect(coord).toEqual({ spanIndex: 0, charOffset: 3 });
    });

    it('position before first span resolves to start of span 0', () => {
      const root = buildRoot([{ text: 'abc', bold: false }]);
      const coord = domToSpanCoord(root, root, 0);
      expect(coord).toEqual({ spanIndex: 0, charOffset: 0 });
    });

    it('empty span (no text node) resolves to span element offset 0', () => {
      const root = buildRoot([{ text: '', bold: false }]);
      const dom = spanCoordToDom(root, { spanIndex: 0, charOffset: 0 })!;
      expect(dom.node.nodeType).toBe(Node.ELEMENT_NODE);
      expect(dom.offset).toBe(0);
    });
  });

  describe('captureSelection / restoreSelection', () => {
    it('captures a non-collapsed selection across two spans', () => {
      const root = buildRoot([
        { text: 'hello', bold: false },
        { text: 'world', bold: true },
      ]);
      const span0Text = root.querySelector('[data-span-index="0"]')!.firstChild!;
      const span1Text = root.querySelector('[data-span-index="1"]')!.firstChild!;

      const range = document.createRange();
      range.setStart(span0Text, 2); // mid-span 0
      range.setEnd(span1Text, 3); // mid-span 1
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      const coords = captureSelection(root);
      expect(coords).toEqual({
        anchor: { spanIndex: 0, charOffset: 2 },
        focus: { spanIndex: 1, charOffset: 3 },
      });
    });

    it('round-trips through capture → restore → capture', () => {
      const root = buildRoot([
        { text: 'foo', bold: false },
        { text: 'bar', bold: true },
        { text: 'baz', bold: false },
      ]);
      const original = {
        anchor: { spanIndex: 0, charOffset: 1 },
        focus: { spanIndex: 2, charOffset: 2 },
      };
      restoreSelection(root, original);
      const re = captureSelection(root);
      expect(re).toEqual(original);
    });

    it('returns null when no selection exists', () => {
      const root = buildRoot([{ text: 'x', bold: false }]);
      window.getSelection()?.removeAllRanges();
      expect(captureSelection(root)).toBeNull();
    });
  });

  describe('out-of-root positions', () => {
    it('domToSpanCoord returns null when node is not inside root', () => {
      const root = buildRoot([{ text: 'abc', bold: false }]);
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      expect(domToSpanCoord(root, outside, 0)).toBeNull();
    });

    it('captureSelection returns null when selection is outside root', () => {
      const root = buildRoot([{ text: 'abc', bold: false }]);
      const outside = document.createElement('p');
      outside.textContent = 'elsewhere';
      document.body.appendChild(outside);
      const range = document.createRange();
      range.selectNodeContents(outside);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      expect(captureSelection(root)).toBeNull();
    });
  });

  describe('spanCoordToDom edge cases', () => {
    it('returns null when spanIndex does not exist', () => {
      const root = buildRoot([{ text: 'abc', bold: false }]);
      expect(spanCoordToDom(root, { spanIndex: 99, charOffset: 0 })).toBeNull();
    });

    it('clamps charOffset beyond text length', () => {
      const root = buildRoot([{ text: 'abc', bold: false }]);
      const dom = spanCoordToDom(root, { spanIndex: 0, charOffset: 999 });
      expect(dom).not.toBeNull();
      expect(dom!.offset).toBe(3);
    });
  });
});

