import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { NotebookCard } from './NotebookCard';
import type { NotebookSummary } from '@/lib/types';

const navigateMock = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>(
    'react-router',
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const notebook: NotebookSummary = {
  id: 'nb-1',
  title: 'My Notebook',
  instrumentName: 'Guitar',
  pageSize: 'A4',
  coverColor: '#123456',
  lessonCount: 3,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-04-03T14:30:00Z',
};

function renderCard() {
  return render(
    <MemoryRouter>
      <NotebookCard notebook={notebook} onDelete={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('NotebookCard', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('navigates when Enter is pressed on the card itself', () => {
    renderCard();

    const card = screen.getByRole('link');
    card.focus();
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(navigateMock).toHaveBeenCalledWith('/app/notebooks/nb-1');
  });

  it('does not navigate when Enter is pressed on the dropdown trigger', () => {
    renderCard();

    const trigger = screen.getByRole('button');
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('does not navigate when Space is pressed on the dropdown trigger', () => {
    renderCard();

    const trigger = screen.getByRole('button');
    trigger.focus();
    fireEvent.keyDown(trigger, { key: ' ' });

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
