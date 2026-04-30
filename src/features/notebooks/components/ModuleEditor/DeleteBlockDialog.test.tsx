import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteBlockDialog } from './DeleteBlockDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

describe('DeleteBlockDialog', () => {
  it('renders title, description, and both action buttons when open', () => {
    render(
      <DeleteBlockDialog
        open
        onOpenChange={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByText('editor.deleteBlockTitle')).toBeInTheDocument();
    expect(screen.getByText('editor.deleteBlockDescription')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'editor.deleteBlockConfirm' })).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <DeleteBlockDialog
        open={false}
        onOpenChange={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(screen.queryByText('editor.deleteBlockTitle')).toBeNull();
  });

  it('calls onConfirm when the destructive action is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteBlockDialog open onOpenChange={() => undefined} onConfirm={onConfirm} />,
    );
    await user.click(screen.getByRole('button', { name: 'editor.deleteBlockConfirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteBlockDialog open onOpenChange={onOpenChange} onConfirm={() => undefined} />,
    );
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

