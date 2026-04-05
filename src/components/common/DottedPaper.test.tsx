import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DottedPaper } from './DottedPaper';

describe('DottedPaper', () => {
  it('renders children', () => {
    render(
      <DottedPaper pageSize="A5">
        <span>Hello</span>
      </DottedPaper>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('sets aspect ratio based on page size dimensions', () => {
    const { container } = render(<DottedPaper pageSize="A5" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.aspectRatio).toBe('29 / 42');
  });

  it('sets aspect ratio for A4 page size', () => {
    const { container } = render(<DottedPaper pageSize="A4" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.aspectRatio).toBe('42 / 59');
  });

  it('uses a fixed dot radius of 1px in the background gradient', () => {
    const { container } = render(<DottedPaper pageSize="A5" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.backgroundImage).toBe(
      'radial-gradient(circle, var(--notebook-dot) 1px, transparent 1px)',
    );
  });

  it('uses 20px dot spacing in the background', () => {
    const { container } = render(<DottedPaper pageSize="A5" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.backgroundSize).toBe('20px 20px');
  });

  it('applies custom className', () => {
    const { container } = render(
      <DottedPaper pageSize="A5" className="w-full max-w-lg" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('max-w-lg');
  });
});
