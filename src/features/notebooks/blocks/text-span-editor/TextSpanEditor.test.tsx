import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { TextSpan } from '@/lib/types';
import { TextSpanEditor } from './TextSpanEditor';

/**
 * Build a minimal ClipboardEvent-compatible payload that satisfies
 * React's synthetic event signature in jsdom (which lacks `DataTransfer`).
 */
function pasteText(target: Element, text: string, html?: string) {
  const clipboardData = {
    getData: (type: string) => {
      if (type === 'text/plain') return text;
      if (type === 'text/html') return html ?? '';
      return '';
    },
  };
  fireEvent.paste(target, { clipboardData });
}

/**
 * Controlled host that mirrors what ModuleEditor will do — keeps `value` in
 * state and forwards onChange. Lets us assert on rendered DOM after edits.
 */
function Host({
  initial,
  onChangeCb,
  initialBold = false,
}: {
  initial: TextSpan[];
  onChangeCb?: (next: TextSpan[]) => void;
  initialBold?: boolean;
}) {
  const [spans, setSpans] = useState<TextSpan[]>(initial);
  const [bold, setBold] = useState(initialBold);
  return (
    <TextSpanEditor
      value={spans}
      onChange={(next) => {
        setSpans(next);
        onChangeCb?.(next);
      }}
      isBoldActive={bold}
      onBoldStateChange={setBold}
    />
  );
}

describe('TextSpanEditor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders value as a span chain with correct font-weight per bold flag', () => {
    render(
      <Host
        initial={[
          { text: 'plain', bold: false },
          { text: 'BOLD', bold: true },
        ]}
      />,
    );
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    expect(root).toBeTruthy();
    const spans = root.querySelectorAll('[data-span-index]');
    expect(spans).toHaveLength(2);
    expect((spans[0] as HTMLElement).textContent).toBe('plain');
    expect((spans[0] as HTMLElement).getAttribute('data-bold')).toBe('false');
    expect((spans[1] as HTMLElement).textContent).toBe('BOLD');
    expect((spans[1] as HTMLElement).getAttribute('data-bold')).toBe('true');
    expect((spans[1] as HTMLElement).style.fontWeight).toBe('700');
  });

  it('reports updated spans via onChange after user-driven DOM mutation', async () => {
    const onChangeCb = vi.fn();
    render(<Host initial={[{ text: 'hi', bold: false }]} onChangeCb={onChangeCb} />);
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    const span = root.querySelector('[data-span-index="0"]') as HTMLElement;

    // Place caret at end of span before pasting.
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(span.firstChild!, 2);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    pasteText(root, ' there');

    expect(onChangeCb).toHaveBeenCalled();
    const last = onChangeCb.mock.calls.at(-1)![0] as TextSpan[];
    const fullText = last.map((s) => s.text).join('');
    expect(fullText).toBe('hi there');
  });

  it('Ctrl+B with collapsed caret flips pendingBold via onBoldStateChange', async () => {
    const onBoldChange = vi.fn();
    function CollapsedHost() {
      const [bold, setBold] = useState(false);
      return (
        <TextSpanEditor
          value={[{ text: 'abc', bold: false }]}
          onChange={() => {}}
          isBoldActive={bold}
          onBoldStateChange={(next) => {
            setBold(next);
            onBoldChange(next);
          }}
        />
      );
    }
    render(<CollapsedHost />);
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    const span = root.querySelector('[data-span-index="0"]') as HTMLElement;
    // Place collapsed caret mid-span.
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(span.firstChild!, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    const user = userEvent.setup();
    await user.click(root);
    sel.removeAllRanges();
    sel.addRange(range);
    await user.keyboard('{Control>}b{/Control}');
    expect(onBoldChange).toHaveBeenCalledWith(true);
  });

  it('Ctrl+B with mixed-bold selection normalises to bold for both spans', async () => {
    const onChangeCb = vi.fn();
    render(
      <Host
        initial={[
          { text: 'plain', bold: false },
          { text: 'BOLD', bold: true },
        ]}
        onChangeCb={onChangeCb}
      />,
    );
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    const span0 = root.querySelector('[data-span-index="0"]') as HTMLElement;
    const span1 = root.querySelector('[data-span-index="1"]') as HTMLElement;

    // Select from mid-span0 through mid-span1 (mixed bold).
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(span0.firstChild!, 2);
    range.setEnd(span1.firstChild!, 2);
    sel.removeAllRanges();
    sel.addRange(range);

    const user = userEvent.setup();
    await user.click(root);
    sel.removeAllRanges();
    sel.addRange(range);
    await user.keyboard('{Control>}b{/Control}');

    expect(onChangeCb).toHaveBeenCalled();
    const last = onChangeCb.mock.calls.at(-1)![0] as TextSpan[];
    // After flip: every span between the cuts is bold; merged result should
    // have the entire stretch ('ain' + 'BO') bold = true.
    const fullText = last.map((s) => s.text).join('');
    expect(fullText).toBe('plainBOLD');
    // Find the merged middle slice — a contiguous run with bold=true that
    // includes 'ain' (last 3 chars of "plain") and 'BO' (first 2 of "BOLD").
    const boldSlice = last.find(
      (s) => s.bold && s.text.includes('ain') && s.text.includes('BO'),
    );
    expect(boldSlice).toBeTruthy();
  });

  it('paste of HTML inserts literal text — no DOM injection (XSS regression)', async () => {
    const onChangeCb = vi.fn();
    render(<Host initial={[{ text: '', bold: false }]} onChangeCb={onChangeCb} />);
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    const span = root.querySelector('[data-span-index="0"]') as HTMLElement;
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(span, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    pasteText(root, '<b>HTML</b>', '<b>HTML</b>');

    const last = onChangeCb.mock.calls.at(-1)![0] as TextSpan[];
    const fullText = last.map((s) => s.text).join('');
    expect(fullText).toBe('<b>HTML</b>');
    // No actual <b> element should be in the DOM.
    expect(root.querySelector('b')).toBeNull();
  });

  it('empty value plus focus surfaces data-empty="true" for placeholder CSS', async () => {
    render(<Host initial={[]} />);
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    expect(root.getAttribute('data-empty')).toBe('true');
  });

  it('publishes a toggleBold imperative API via onReady', () => {
    const onReady = vi.fn();
    render(
      <TextSpanEditor
        value={[{ text: 'abc', bold: false }]}
        onChange={() => {}}
        isBoldActive={false}
        onBoldStateChange={() => {}}
        onReady={onReady}
      />,
    );
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(typeof onReady.mock.calls[0][0].toggleBold).toBe('function');
  });

  it('exposes role=textbox with aria-multiline=false and aria-label', () => {
    render(<Host initial={[{ text: 'x', bold: false }]} />);
    // i18n is not initialised in test setup so the raw key is the visible name.
    const editor = screen.getByRole('textbox');
    expect(editor).toBeTruthy();
    expect(editor.getAttribute('aria-multiline')).toBe('false');
    expect(editor.getAttribute('contenteditable')).toBe('true');
    expect(editor.getAttribute('aria-label')).toBeTruthy();
  });

  it('inserts a literal space when user presses Spacebar (gap 01-08-A)', () => {
    // Reproduces the ModuleCard wrapper's onKeyDown handler that intercepts
    // Space/Enter for "select module". Pre-fix that handler called
    // preventDefault on every Space — including those bubbling up from a
    // descendant contentEditable — so typing Space inside a Text block
    // produced no character. Post-fix the handler bails out when
    // event.target !== event.currentTarget, so the contentEditable receives
    // the keystroke and the browser inserts a space.
    const wrapperKeyDown = vi.fn((event: React.KeyboardEvent<HTMLDivElement>) => {
      // Mirror of ModuleCard's post-fix guard.
      if (event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
      }
    });
    function ModuleCardLike({ children }: { children: React.ReactNode }) {
      return (
        <div role="button" tabIndex={0} onKeyDown={wrapperKeyDown}>
          {children}
        </div>
      );
    }
    const onChangeCb = vi.fn();
    render(
      <ModuleCardLike>
        <Host initial={[{ text: 'hi', bold: false }]} onChangeCb={onChangeCb} />
      </ModuleCardLike>,
    );
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    const span = root.querySelector('[data-span-index="0"]') as HTMLElement;

    // Place caret at end of "hi".
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(span.firstChild!, 2);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // Dispatch the Space keydown that bubbles to the wrapper. Post-fix the
    // wrapper does NOT preventDefault, so we then simulate the browser-level
    // text insertion + the input event the contentEditable would emit.
    const keyEvent = fireEvent.keyDown(root, { key: ' ', code: 'Space' });
    expect(keyEvent).toBe(true); // not preventDefaulted

    // Simulate browser inserting the space char into the DOM and firing input.
    span.firstChild!.textContent = 'hi ';
    range.setStart(span.firstChild!, 3);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    fireEvent.input(root);

    expect(onChangeCb).toHaveBeenCalled();
    const last = onChangeCb.mock.calls.at(-1)![0] as TextSpan[];
    const fullText = last.map((s) => s.text).join('');
    expect(fullText).toBe('hi ');
  });

  it('applies overflow-wrap:anywhere to the editable root (gap 01-08-B)', () => {
    render(<Host initial={[{ text: 'x', bold: false }]} />);
    const root = document.querySelector('[data-text-span-editor]') as HTMLElement;
    // Long unbroken strings (URLs, hashes) must reflow within the module's
    // overflow-hidden clip rect. `whitespace: pre-wrap` alone wraps only at
    // soft break opportunities; `overflow-wrap: anywhere` is required to
    // break inside non-word strings.
    expect(root.style.overflowWrap).toBe('anywhere');
    expect(root.style.whiteSpace).toBe('pre-wrap');
  });
});


