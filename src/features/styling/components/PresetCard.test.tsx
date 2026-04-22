import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PresetCard, type PresetCardProps } from './PresetCard';
import type { PresetThumbnailSwatch } from '../utils/preset-thumbnails';
import { MODULE_STYLE_TAB_ORDER } from '../utils/style-defaults';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

function makeSwatches(): PresetThumbnailSwatch[] {
  return MODULE_STYLE_TAB_ORDER.map((moduleType) => ({
    moduleType,
    backgroundColor: '#FFFFFF',
    headerBgColor: '#F0E6D3',
  }));
}

function renderCard(props: Partial<PresetCardProps> = {}) {
  const defaults: PresetCardProps = {
    presetId: 'u-1',
    name: 'My preset',
    swatches: makeSwatches(),
    onApply: vi.fn(),
  };
  return render(<PresetCard {...defaults} {...props} />);
}

describe('PresetCard', () => {
  it('invokes onApply with the preset id when the apply button is clicked', () => {
    const onApply = vi.fn();
    renderCard({ onApply });
    fireEvent.click(screen.getByRole('button', { name: 'styling.presets.apply' }));
    expect(onApply).toHaveBeenCalledWith('u-1');
  });

  it('renders the preset name with truncation classes and a title attribute for hover reveal', () => {
    renderCard({ name: 'A very long preset name that will definitely be truncated on the card' });
    const nameEl = document.querySelector<HTMLElement>('[data-slot="preset-name"]');
    expect(nameEl).not.toBeNull();
    expect(nameEl?.className).toContain('truncate');
    expect(nameEl?.getAttribute('title')).toBe(
      'A very long preset name that will definitely be truncated on the card',
    );
  });

  it('makes the truncated name keyboard-focusable so screen readers and tab-traversal expose the full value', () => {
    renderCard({ name: 'Focus accessible name' });
    const nameEl = document.querySelector<HTMLElement>('[data-slot="preset-name"]');
    expect(nameEl).not.toBeNull();
    expect(nameEl?.getAttribute('tabindex')).toBe('0');
  });

  it('does not render rename or delete affordances when the corresponding callbacks are missing', () => {
    renderCard({});
    expect(
      document.querySelector('[data-slot="preset-rename"]'),
    ).toBeNull();
    expect(
      document.querySelector('[data-slot="preset-delete"]'),
    ).toBeNull();
  });

  it('opens the inline rename input when the pencil button is clicked', () => {
    renderCard({ onRename: vi.fn() });
    const pencil = screen.getByRole('button', { name: 'styling.presets.rename' });
    fireEvent.click(pencil);
    expect(
      document.querySelector('[data-slot="preset-name-input"]'),
    ).not.toBeNull();
  });

  it('commits the rename on Enter with the trimmed new value', () => {
    const onRename = vi.fn();
    renderCard({ onRename });
    fireEvent.click(
      screen.getByRole('button', { name: 'styling.presets.rename' }),
    );
    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '  Renamed  ' } });
    fireEvent.keyDown(input!, { key: 'Enter' });
    expect(onRename).toHaveBeenCalledWith('u-1', 'Renamed');
  });

  it('commits the rename on blur when the value changed', () => {
    const onRename = vi.fn();
    renderCard({ onRename });
    fireEvent.click(
      screen.getByRole('button', { name: 'styling.presets.rename' }),
    );
    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    fireEvent.change(input!, { target: { value: 'Blurred rename' } });
    fireEvent.blur(input!);
    expect(onRename).toHaveBeenCalledWith('u-1', 'Blurred rename');
  });

  it('cancels the rename on Escape and does not call onRename', () => {
    const onRename = vi.fn();
    renderCard({ onRename, name: 'Initial' });
    fireEvent.click(
      screen.getByRole('button', { name: 'styling.presets.rename' }),
    );
    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    fireEvent.change(input!, { target: { value: 'Abandoned' } });
    fireEvent.keyDown(input!, { key: 'Escape' });
    expect(onRename).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-slot="preset-name-input"]'),
    ).toBeNull();
    // Name returns to the original.
    expect(
      document.querySelector('[data-slot="preset-name"]')?.textContent,
    ).toBe('Initial');
  });

  it('skips the onRename call when the committed value matches the current name', () => {
    const onRename = vi.fn();
    renderCard({ onRename, name: 'Same' });
    fireEvent.click(
      screen.getByRole('button', { name: 'styling.presets.rename' }),
    );
    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    fireEvent.keyDown(input!, { key: 'Enter' });
    expect(onRename).not.toHaveBeenCalled();
  });

  it('shows an inline duplicate-name error and keeps the input open', () => {
    const onClearDuplicateError = vi.fn();
    const { rerender } = renderCard({
      onRename: vi.fn(),
      duplicateNameError: true,
      onClearDuplicateError,
    });
    expect(
      document.querySelector('[data-slot="preset-rename-duplicate-error"]'),
    ).not.toBeNull();
    const input = document.querySelector<HTMLInputElement>(
      '[data-slot="preset-name-input"]',
    );
    expect(input).not.toBeNull();
    expect(input?.getAttribute('aria-invalid')).toBe('true');

    // Typing into the input must clear the error via the callback.
    fireEvent.change(input!, { target: { value: 'Different name' } });
    expect(onClearDuplicateError).toHaveBeenCalled();

    // Rerender without the error to ensure the message is removed.
    rerender(
      <PresetCard
        presetId="u-1"
        name="My preset"
        swatches={makeSwatches()}
        onApply={vi.fn()}
        onRename={vi.fn()}
        duplicateNameError={false}
        onClearDuplicateError={onClearDuplicateError}
      />,
    );
    expect(
      document.querySelector('[data-slot="preset-rename-duplicate-error"]'),
    ).toBeNull();
  });

  it('invokes onDelete with the preset id when the trash button is clicked', () => {
    const onDelete = vi.fn();
    renderCard({ onDelete });
    fireEvent.click(
      screen.getByRole('button', { name: 'styling.presets.delete' }),
    );
    expect(onDelete).toHaveBeenCalledWith('u-1');
  });

  it('hides rename and delete affordances while the rename input is active', () => {
    renderCard({ onRename: vi.fn(), onDelete: vi.fn() });
    fireEvent.click(
      screen.getByRole('button', { name: 'styling.presets.rename' }),
    );
    expect(
      document.querySelector('[data-slot="preset-rename"]'),
    ).toBeNull();
    expect(
      document.querySelector('[data-slot="preset-delete"]'),
    ).toBeNull();
  });

  it('resets the draft when the canonical name changes while not editing', () => {
    const { rerender } = renderCard({ name: 'Original', onRename: vi.fn() });
    expect(
      document.querySelector('[data-slot="preset-name"]')?.textContent,
    ).toBe('Original');

    act(() => {
      rerender(
        <PresetCard
          presetId="u-1"
          name="Updated"
          swatches={makeSwatches()}
          onApply={vi.fn()}
          onRename={vi.fn()}
        />,
      );
    });

    expect(
      document.querySelector('[data-slot="preset-name"]')?.textContent,
    ).toBe('Updated');
  });
});
