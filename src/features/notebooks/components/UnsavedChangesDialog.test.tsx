import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('UnsavedChangesDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <UnsavedChangesDialog
        open={false}
        onKeepEditing={() => undefined}
        onDiscard={() => undefined}
      />,
    );
    expect(screen.queryByText('editor.unsavedTitle')).toBeNull();
  });

  it('renders title, description, and both action buttons when open', () => {
    render(
      <UnsavedChangesDialog
        open
        onKeepEditing={() => undefined}
        onDiscard={() => undefined}
      />,
    );
    expect(screen.getByText('editor.unsavedTitle')).toBeInTheDocument();
    expect(screen.getByText('editor.unsavedDescription')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'editor.unsavedKeepEditing' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'editor.unsavedDiscard' }),
    ).toBeInTheDocument();
  });

  it('Cancel ("Keep editing") receives default focus on open (Radix AlertDialog default)', async () => {
    render(
      <UnsavedChangesDialog
        open
        onKeepEditing={() => undefined}
        onDiscard={() => undefined}
      />,
    );
    const cancel = screen.getByRole('button', {
      name: 'editor.unsavedKeepEditing',
    });
    // Radix AlertDialog auto-focuses AlertDialogCancel on mount (the
    // non-destructive default action). Wait one microtask for the focus
    // trap to mount.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.activeElement).toBe(cancel);
  });

  it('Discard button uses destructive button variant', () => {
    render(
      <UnsavedChangesDialog
        open
        onKeepEditing={() => undefined}
        onDiscard={() => undefined}
      />,
    );
    const discard = screen.getByRole('button', {
      name: 'editor.unsavedDiscard',
    });
    // Destructive variant emits a `bg-destructive` class via shadcn buttonVariants.
    expect(discard.className).toMatch(/bg-destructive/);
  });

  it('clicking Keep editing fires onKeepEditing', () => {
    const onKeep = vi.fn();
    render(
      <UnsavedChangesDialog
        open
        onKeepEditing={onKeep}
        onDiscard={() => undefined}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'editor.unsavedKeepEditing' }),
    );
    expect(onKeep).toHaveBeenCalledTimes(1);
  });

  it('clicking Discard fires onDiscard', () => {
    const onDiscard = vi.fn();
    render(
      <UnsavedChangesDialog
        open
        onKeepEditing={() => undefined}
        onDiscard={onDiscard}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'editor.unsavedDiscard' }),
    );
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

