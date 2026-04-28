import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DottedPaper } from './DottedPaper';
import {
  GRID_BASE_UNIT_PX,
  GRID_CANVAS_STYLE_TOKENS,
  PAGE_SIZE_DIMENSIONS,
} from '@/lib/constants/grid';

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

  it('renders the page at true grid pixel dimensions at the default zoom', () => {
    const { container } = render(<DottedPaper pageSize="A5" />);
    const el = container.firstElementChild as HTMLElement;
    const dims = PAGE_SIZE_DIMENSIONS.A5;
    expect(el.style.width).toBe(`${dims.width * GRID_BASE_UNIT_PX}px`);
    expect(el.style.height).toBe(`${dims.height * GRID_BASE_UNIT_PX}px`);
  });

  it('scales width, height, and dot spacing with the zoom prop', () => {
    const { container } = render(<DottedPaper pageSize="A5" zoom={2} />);
    const el = container.firstElementChild as HTMLElement;
    const dims = PAGE_SIZE_DIMENSIONS.A5;
    expect(el.style.width).toBe(`${dims.width * GRID_BASE_UNIT_PX * 2}px`);
    expect(el.style.height).toBe(`${dims.height * GRID_BASE_UNIT_PX * 2}px`);
    expect(el.style.backgroundSize).toBe(
      `${GRID_BASE_UNIT_PX * 2}px ${GRID_BASE_UNIT_PX * 2}px`,
    );
  });

  it('uses a fixed dot radius of 1px in the background gradient', () => {
    const { container } = render(<DottedPaper pageSize="A5" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.backgroundImage).toContain('radial-gradient(circle');
    expect(el.style.backgroundImage).toContain('1px');
  });

  it('uses the canvas paper, dot, border, and page-shadow review tokens', () => {
    const { container } = render(<DottedPaper pageSize="A5" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.backgroundColor).toBe(GRID_CANVAS_STYLE_TOKENS.paper);
    expect(el.style.backgroundImage).toContain(GRID_CANVAS_STYLE_TOKENS.dot);
    expect(el.style.borderColor).toBe(GRID_CANVAS_STYLE_TOKENS.pageBorder);
    expect(el.style.boxShadow).toBe(GRID_CANVAS_STYLE_TOKENS.pageShadow);
  });

  it('uses one base-unit-square dot spacing at zoom 1', () => {
    const { container } = render(<DottedPaper pageSize="A5" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.backgroundSize).toBe(
      `${GRID_BASE_UNIT_PX}px ${GRID_BASE_UNIT_PX}px`,
    );
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
