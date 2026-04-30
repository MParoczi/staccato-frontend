import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBlockPopover } from './AddBlockPopover';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

describe('AddBlockPopover', () => {
  it('renders trigger with i18n label', () => {
    render(<AddBlockPopover moduleType="Theory" onSelect={() => undefined} />);
    expect(screen.getByRole('button', { name: 'editor.addBlock' })).toBeInTheDocument();
  });

  it('opens listbox with allowed block options for Theory and emits selected type', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AddBlockPopover moduleType="Theory" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    // Theory allows 9 block types; Text is one of them (label key resolves to itself via mock).
    const textOption = await screen.findByRole('option', { name: /editor\.blockType\.text/i });
    await user.click(textOption);
    expect(onSelect).toHaveBeenCalledWith('Text');
  });

  it('only lists Date and Text for Title moduleType', async () => {
    const user = userEvent.setup();
    render(<AddBlockPopover moduleType="Title" onSelect={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'editor.addBlock' }));
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.textContent?.trim())).toEqual(
      expect.arrayContaining(['editor.blockType.date', 'editor.blockType.text']),
    );
  });

  it('renders disabled trigger for Breadcrumb modules', () => {
    render(
      <AddBlockPopover
        moduleType="Breadcrumb"
        onSelect={() => undefined}
        disabled
      />,
    );
    expect(screen.getByRole('button', { name: 'editor.addBlock' })).toBeDisabled();
  });
});

