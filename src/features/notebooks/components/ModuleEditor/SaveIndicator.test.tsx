import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SaveIndicator } from './SaveIndicator';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

describe('SaveIndicator', () => {
  it('renders nothing when idle', () => {
    const { container } = render(<SaveIndicator status="idle" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders polite status with spinner copy when saving', () => {
    render(<SaveIndicator status="saving" />);
    const node = screen.getByRole('status');
    expect(node).toHaveAttribute('aria-live', 'polite');
    expect(node).toHaveTextContent('editor.saving');
  });

  it('renders saved copy and auto-fades after 1500ms', () => {
    vi.useFakeTimers();
    try {
      render(<SaveIndicator status="saved" />);
      const node = screen.getByRole('status');
      expect(node).toHaveTextContent('editor.saved');
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.queryByRole('status')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders role=alert with destructive copy when failed', () => {
    render(<SaveIndicator status="failed" />);
    const node = screen.getByRole('alert');
    expect(node).toHaveTextContent('editor.saveFailed');
  });
});

