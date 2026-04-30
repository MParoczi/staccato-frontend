import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorLoadingShell } from './EditorLoadingShell';

describe('EditorLoadingShell', () => {
  it('renders a polite busy status node', () => {
    render(<EditorLoadingShell />);
    const node = screen.getByRole('status');
    expect(node).toHaveAttribute('aria-busy', 'true');
    expect(node).toHaveAttribute('aria-live', 'polite');
  });

  it('applies minHeight inline style when provided', () => {
    render(<EditorLoadingShell minHeight={120} />);
    const node = screen.getByRole('status');
    expect(node).toHaveStyle({ minHeight: '120px' });
  });
});

