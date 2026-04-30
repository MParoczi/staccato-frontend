import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorToolbar } from './EditorToolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

const baseProps = {
  moduleType: 'Theory' as const,
  canUndo: true,
  canRedo: true,
  isBoldActive: false,
  saveStatus: 'idle' as const,
  onAddBlock: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onToggleBold: vi.fn(),
  onCancel: vi.fn(),
  onSave: vi.fn(),
};

describe('EditorToolbar', () => {
  it('renders all controls with i18n a11y labels', () => {
    render(<EditorToolbar {...baseProps} />);
    expect(screen.getByRole('toolbar', { name: 'editor.edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'editor.addBlock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'editor.bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'editor.undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'editor.redo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument();
  });

  it('Bold button reflects aria-pressed=isBoldActive and fires onToggleBold', async () => {
    const onToggleBold = vi.fn();
    const user = userEvent.setup();
    render(<EditorToolbar {...baseProps} isBoldActive onToggleBold={onToggleBold} />);
    const bold = screen.getByRole('button', { name: 'editor.bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    await user.click(bold);
    expect(onToggleBold).toHaveBeenCalledTimes(1);
  });

  it('disables Undo/Redo when canUndo/canRedo are false', () => {
    render(<EditorToolbar {...baseProps} canUndo={false} canRedo={false} />);
    expect(screen.getByRole('button', { name: 'editor.undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'editor.redo' })).toBeDisabled();
  });

  it('Cancel and Save buttons fire their respective handlers', async () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<EditorToolbar {...baseProps} onCancel={onCancel} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    await user.click(screen.getByRole('button', { name: 'common.save' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('shows save indicator when status is saving', () => {
    render(<EditorToolbar {...baseProps} saveStatus="saving" />);
    expect(screen.getByRole('status')).toHaveTextContent('editor.saving');
  });

  it('disables Save and AddBlock when moduleType is Breadcrumb', () => {
    render(<EditorToolbar {...baseProps} moduleType="Breadcrumb" />);
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'editor.addBlock' })).toBeDisabled();
  });
});

