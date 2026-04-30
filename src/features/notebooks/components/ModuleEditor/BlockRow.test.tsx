import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BuildingBlock } from '@/lib/types';
import { BlockRow } from './BlockRow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

describe('BlockRow', () => {
  const block: BuildingBlock = {
    type: 'Text',
    spans: [{ text: 'hello', bold: false }],
  };

  it('renders the block via BLOCK_REGISTRY[Text].Editor', () => {
    render(
      <BlockRow
        block={block}
        index={0}
        onChange={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('exposes drag handle and delete button with i18n a11y labels', () => {
    render(
      <BlockRow
        block={block}
        index={2}
        onChange={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'editor.dragHandle' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'editor.deleteBlock' }),
    ).toBeInTheDocument();
  });

  it('invokes onDelete when the delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <BlockRow
        block={block}
        index={0}
        onChange={() => undefined}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'editor.deleteBlock' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('forwards dragHandleProps to the handle button', () => {
    render(
      <BlockRow
        block={block}
        index={0}
        onChange={() => undefined}
        onDelete={() => undefined}
        dragHandleProps={{ 'data-testid': 'handle' } as React.HTMLAttributes<HTMLButtonElement>}
      />,
    );
    expect(screen.getByTestId('handle')).toBeInTheDocument();
  });
});

