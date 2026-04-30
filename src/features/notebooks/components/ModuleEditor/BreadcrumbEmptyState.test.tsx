import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BreadcrumbEmptyState } from './BreadcrumbEmptyState';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

describe('BreadcrumbEmptyState', () => {
  it('renders a note role with auto-gen copy', () => {
    render(<BreadcrumbEmptyState />);
    const note = screen.getByRole('note', { name: 'editor.breadcrumbAutoGen' });
    expect(note).toHaveTextContent('editor.breadcrumbAutoGen');
  });

  it('passes through className overrides', () => {
    render(<BreadcrumbEmptyState className="custom-class" />);
    expect(screen.getByRole('note')).toHaveClass('custom-class');
  });
});

