import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SavePresetDialog } from './SavePresetDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

interface RenderArgs {
  open?: boolean;
  onSubmit?: (name: string) => void;
  onOpenChange?: (open: boolean) => void;
  isSubmitting?: boolean;
  hasDuplicateNameError?: boolean;
}

function renderDialog(args: RenderArgs = {}) {
  const onSubmit = args.onSubmit ?? vi.fn();
  const onOpenChange = args.onOpenChange ?? vi.fn();
  const utils = render(
    <SavePresetDialog
      open={args.open ?? true}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={args.isSubmitting ?? false}
      hasDuplicateNameError={args.hasDuplicateNameError ?? false}
    />,
  );
  return { ...utils, onSubmit, onOpenChange };
}

describe('SavePresetDialog', () => {
  it('renders the dialog title and description when open', () => {
    renderDialog();
    expect(
      screen.getByText('styling.presets.saveDialogTitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('styling.presets.saveDialogDescription'),
    ).toBeInTheDocument();
  });

  it('shows a required-name inline error when submitting an empty name', async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    fireEvent.click(
      screen.getByRole('button', { name: 'common.save' }),
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-slot="save-preset-name-error"]'),
      ).not.toBeNull();
    });
    expect(
      document.querySelector('[data-slot="save-preset-name-error"]')
        ?.textContent,
    ).toBe('styling.errors.presetNameRequired');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects names longer than 50 characters', async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    const input = screen.getByLabelText('styling.presets.nameLabel');
    fireEvent.change(input, { target: { value: 'x'.repeat(51) } });
    fireEvent.click(
      screen.getByRole('button', { name: 'common.save' }),
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-slot="save-preset-name-error"]'),
      ).not.toBeNull();
    });
    expect(
      document.querySelector('[data-slot="save-preset-name-error"]')
        ?.textContent,
    ).toBe('styling.errors.presetNameMaxLength');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed name when valid', async () => {
    const onSubmit = vi.fn();
    renderDialog({ onSubmit });

    const input = screen.getByLabelText('styling.presets.nameLabel');
    fireEvent.change(input, { target: { value: '  My Theme  ' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'common.save' }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('My Theme');
    });
  });

  it('shows the duplicate-name inline error when provided by the parent', () => {
    renderDialog({ hasDuplicateNameError: true });

    expect(
      document.querySelector('[data-slot="save-preset-duplicate-error"]')
        ?.textContent,
    ).toBe('styling.presets.duplicateName');
  });

  it('disables submit and shows the submitting label while isSubmitting', () => {
    renderDialog({ isSubmitting: true });

    const submit = screen.getByRole('button', {
      name: 'styling.presets.saving',
    });
    expect(submit).toBeDisabled();
  });

  it('invokes onOpenChange(false) when the cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    fireEvent.click(
      screen.getByRole('button', { name: 'common.cancel' }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
