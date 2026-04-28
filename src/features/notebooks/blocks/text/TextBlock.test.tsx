import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { BuildingBlock } from '@/lib/types';
import { TextBlockEditor, TextBlockRenderer } from './TextBlock';

function pasteText(target: Element, text: string) {
  const clipboardData = {
    getData: (type: string) => (type === 'text/plain' ? text : ''),
  };
  fireEvent.paste(target, { clipboardData });
}

describe('TextBlockRenderer', () => {
  it('renders bold and non-bold spans with correct font-weight', () => {
    const block: BuildingBlock = {
      type: 'Text',
      spans: [
        { text: 'plain ', bold: false },
        { text: 'bold!', bold: true },
      ],
    };
    const { container } = render(<TextBlockRenderer block={block} />);
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(2);
    expect((spans[0] as HTMLElement).style.fontWeight).toBe('inherit');
    expect((spans[1] as HTMLElement).style.fontWeight).toBe('700');
    expect(container.textContent).toBe('plain bold!');
  });

  it('renders empty paragraph when block has no spans', () => {
    const block: BuildingBlock = { type: 'Text', spans: [] };
    const { container } = render(<TextBlockRenderer block={block} />);
    expect(container.querySelector('p')).toBeTruthy();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('treats missing/non-array spans as empty (defensive parsing)', () => {
    const block: BuildingBlock = { type: 'Text' };
    const { container } = render(<TextBlockRenderer block={block} />);
    expect(container.querySelector('p')).toBeTruthy();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });
});

describe('TextBlockEditor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('passes spans through to TextSpanEditor and forwards onChange wrapped as a block update', () => {
    const onChange = vi.fn();
    const initial: BuildingBlock = {
      type: 'Text',
      spans: [{ text: 'hi', bold: false }],
    };
    render(<TextBlockEditor block={initial} onChange={onChange} />);
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    const span = root.querySelector('[data-span-index="0"]') as HTMLElement;

    // Place caret at end and paste ' world'.
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(span.firstChild!, 2);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    pasteText(root, ' world');

    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)![0] as BuildingBlock;
    expect(next.type).toBe('Text');
    expect(Array.isArray(next.spans)).toBe(true);
    const fullText = (next.spans as { text: string }[])
      .map((s) => s.text)
      .join('');
    expect(fullText).toBe('hi world');
  });

  it('round-trips: Renderer of an Editor onChange payload preserves text', () => {
    const initial: BuildingBlock = {
      type: 'Text',
      spans: [{ text: 'abc', bold: false }],
    };
    let captured: BuildingBlock | null = null;
    const { unmount } = render(
      <TextBlockEditor
        block={initial}
        onChange={(next) => {
          captured = next;
        }}
      />,
    );
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    const span = root.querySelector('[data-span-index="0"]') as HTMLElement;
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(span.firstChild!, 3);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    pasteText(root, 'def');

    expect(captured).not.toBeNull();
    unmount();

    const { container } = render(<TextBlockRenderer block={captured!} />);
    expect(container.textContent).toBe('abcdef');
  });

  it('handles empty initial block (defensive)', () => {
    const onChange = vi.fn();
    const block: BuildingBlock = { type: 'Text' };
    render(<TextBlockEditor block={block} onChange={onChange} />);
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.getAttribute('data-empty')).toBe('true');
  });
});

