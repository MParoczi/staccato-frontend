import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddModulePicker } from './AddModulePicker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('AddModulePicker', () => {
  it('renders an accessible add-module trigger button', () => {
    render(<AddModulePicker onSelectType={vi.fn()} />);
    const trigger = screen.getByTestId('add-module-trigger');
    expect(trigger.getAttribute('aria-label')).toBe(
      'notebooks.canvas.addModule.trigger',
    );
  });

  it('opens the picker dialog with all 12 module-type options when triggered', async () => {
    render(<AddModulePicker onSelectType={vi.fn()} />);
    fireEvent.click(screen.getByTestId('add-module-trigger'));

    await waitFor(() => {
      expect(
        screen.getByTestId('add-module-option-Title'),
      ).toBeTruthy();
    });

    const expectedTypes = [
      'Title',
      'Breadcrumb',
      'Subtitle',
      'Theory',
      'Practice',
      'Example',
      'Important',
      'Tip',
      'Homework',
      'Question',
      'ChordTablature',
      'FreeText',
    ];
    for (const moduleType of expectedTypes) {
      expect(
        screen.getByTestId(`add-module-option-${moduleType}`),
      ).toBeTruthy();
    }
  });

  it('invokes onSelectType with the chosen module type and closes the dialog', async () => {
    const onSelectType = vi.fn();
    render(<AddModulePicker onSelectType={onSelectType} />);
    fireEvent.click(screen.getByTestId('add-module-trigger'));

    const option = await screen.findByTestId('add-module-option-Theory');
    fireEvent.click(option);

    expect(onSelectType).toHaveBeenCalledWith('Theory');
    await waitFor(() => {
      expect(
        screen.queryByTestId('add-module-option-Theory'),
      ).toBeNull();
    });
  });

  it('disables the trigger when disabled prop is set', () => {
    render(<AddModulePicker onSelectType={vi.fn()} disabled />);
    const trigger = screen.getByTestId('add-module-trigger') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
  });
});
