import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ColorPickerPopover } from './ColorPickerPopover';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

function renderPicker(
  props?: Partial<React.ComponentProps<typeof ColorPickerPopover>>,
) {
  const onChange = props?.onChange ?? vi.fn();
  const utils = render(
    <ColorPickerPopover
      label="Background color"
      value={props?.value ?? '#FFFFFF'}
      onChange={onChange}
      {...props}
    />,
  );
  return { ...utils, onChange };
}

function openPopover() {
  const trigger = screen.getByRole('button', { name: 'Background color' });
  fireEvent.click(trigger);
  return trigger;
}

describe('ColorPickerPopover', () => {
  it('renders the trigger with the current value', () => {
    renderPicker({ value: '#AA0011' });
    expect(screen.getByRole('button', { name: 'Background color' })).toHaveTextContent(
      '#AA0011',
    );
  });

  it('applies a swatch click immediately and calls onChange with the swatch value', async () => {
    const { onChange } = renderPicker();
    openPopover();
    const swatch = await screen.findByRole('option', { name: '#C97A4A' });
    fireEvent.click(swatch);
    expect(onChange).toHaveBeenCalledWith('#C97A4A');
  });

  it('commits a valid hex value on Enter', async () => {
    const { onChange } = renderPicker();
    openPopover();
    const input = (await screen.findByDisplayValue('#FFFFFF')) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '#123456' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('#123456');
  });

  it('rejects invalid hex and does not call onChange', async () => {
    const { onChange } = renderPicker();
    openPopover();
    const input = (await screen.findByDisplayValue('#FFFFFF')) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'not-a-hex' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    renderPicker();
    openPopover();
    const input = await screen.findByDisplayValue('#FFFFFF');
    fireEvent.keyDown(input, { key: 'Escape' });
    // After Escape, the popover should have closed — no hex input remains.
    expect(screen.queryByDisplayValue('#FFFFFF')).toBeNull();
  });

  it('exposes all 24 swatches in the grid for Tab/Shift+Tab traversal', async () => {
    renderPicker();
    openPopover();
    const swatches = await screen.findAllByRole('option');
    expect(swatches).toHaveLength(24);
    // Each swatch is a focusable button — default tab order yields traversal.
    for (const swatch of swatches) {
      expect(swatch.tagName).toBe('BUTTON');
      expect(swatch).not.toHaveAttribute('tabindex', '-1');
    }
  });

  it('does not open when disabled', () => {
    renderPicker({ disabled: true });
    const trigger = screen.getByRole('button', { name: 'Background color' });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
