import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditButton } from './EditButton';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

describe('EditButton', () => {
  it('renders with i18n aria-label', () => {
    render(<EditButton onActivate={() => undefined} />);
    expect(
      screen.getByRole('button', { name: 'editor.edit' }),
    ).toBeInTheDocument();
  });

  it('activates on click', async () => {
    const onActivate = vi.fn();
    const user = userEvent.setup();
    render(<EditButton onActivate={onActivate} />);
    await user.click(screen.getByRole('button', { name: 'editor.edit' }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('activates on Enter and Space (native button keyboard handling)', async () => {
    const onActivate = vi.fn();
    const user = userEvent.setup();
    render(<EditButton onActivate={onActivate} />);
    const btn = screen.getByRole('button', { name: 'editor.edit' });
    btn.focus();
    await user.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it('carries data-prevent-edit-entry to short-circuit ModuleCard gestures', () => {
    render(<EditButton onActivate={() => undefined} />);
    const btn = screen.getByRole('button', { name: 'editor.edit' });
    expect(btn).toHaveAttribute('data-prevent-edit-entry', 'true');
  });
});

