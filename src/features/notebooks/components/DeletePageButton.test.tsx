import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { DeletePageButton } from './DeletePageButton';
import { deletePage } from '@/api/pages';
import { toast } from 'sonner';
import type { BusinessErrorResponse } from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock('@/api/pages', () => ({
  deletePage: vi.fn(),
}));

vi.mock('../hooks/useLesson', () => ({
  useLesson: () => ({
    data: {
      id: 'lesson-1',
      pages: [
        { id: 'page-1' },
        { id: 'page-2' },
      ],
    },
  }),
}));

function renderButton() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <DeletePageButton
          notebookId="nb-1"
          lessonId="lesson-1"
          pageId="page-2"
          isLastPage={false}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('DeletePageButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows exactly one error toast when deletion fails', async () => {
    vi.mocked(deletePage).mockRejectedValueOnce(
      Object.assign(new Error('boom'), {
        response: { status: 500, data: {} },
      }) as AxiosError<BusinessErrorResponse>,
    );

    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'notebooks.shell.page.deleteConfirm' }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
    expect(toast.error).toHaveBeenCalledWith('notebooks.shell.page.deleteError');
  });

  it('shows the last-page-specific toast on 422 LAST_PAGE_DELETION', async () => {
    vi.mocked(deletePage).mockRejectedValueOnce(
      Object.assign(new Error('last'), {
        response: {
          status: 422,
          data: { code: 'LAST_PAGE_DELETION', message: 'cannot' },
        },
      }) as AxiosError<BusinessErrorResponse>,
    );

    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'notebooks.shell.page.deleteConfirm' }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
    expect(toast.error).toHaveBeenCalledWith('notebooks.shell.page.lastPageError');
  });
});
