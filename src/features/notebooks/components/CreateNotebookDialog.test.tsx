import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateNotebookDialog } from './CreateNotebookDialog';
import type { User, Instrument, NotebookDetail } from '@/lib/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const createNotebookMock = vi.fn();
vi.mock('@/api/notebooks', () => ({
  createNotebook: (...args: unknown[]) => createNotebookMock(...args),
}));

const useCurrentUserMock = vi.fn();
vi.mock('@/features/profile/hooks/useCurrentUser', () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));

const instruments: Instrument[] = [
  { id: 'inst-1', name: '6-String Guitar' } as Instrument,
  { id: 'inst-2', name: 'Piano' } as Instrument,
];

vi.mock('@/hooks/useInstruments', () => ({
  useInstruments: () => ({
    data: instruments,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useSystemPresets', () => ({
  useSystemPresets: () => ({ data: [], isLoading: false, isError: false }),
}));

// Step component mocks. We surface current form values via the `watch` prop
// and expose buttons to mutate the form state via `setValue`-like callbacks,
// plus a registered title input so zod validation passes on submit.
type StepBasicsProps = {
  register: (name: string) => Record<string, unknown>;
  watch: (name: string) => unknown;
  onInstrumentChange: (v: string) => void;
  onPageSizeChange: (v: string) => void;
  onNext: () => void;
};

vi.mock('./StepBasics', () => ({
  StepBasics: (props: StepBasicsProps) => {
    const instrumentId = props.watch('instrumentId');
    const pageSize = props.watch('pageSize');
    const title = props.watch('title');
    return (
      <div>
        <div data-testid="instrument-value">{String(instrumentId ?? '')}</div>
        <div data-testid="pagesize-value">{String(pageSize ?? '')}</div>
        <div data-testid="title-value">{String(title ?? '')}</div>
        <input data-testid="title-input" {...props.register('title')} />
        <button
          type="button"
          data-testid="set-instrument"
          onClick={() => props.onInstrumentChange('inst-1')}
        >
          set-instrument
        </button>
        <button
          type="button"
          data-testid="set-pagesize"
          onClick={() => props.onPageSizeChange('A4')}
        >
          set-pagesize
        </button>
        <button type="button" onClick={props.onNext}>
          to-step-2
        </button>
      </div>
    );
  },
}));

vi.mock('./StepAppearance', () => ({
  StepAppearance: () => (
    <div>
      <button type="submit">submit</button>
    </div>
  ),
}));

const mockCreated: NotebookDetail = {
  id: 'nb-new',
  title: 'New',
  instrumentId: 'inst-1',
  instrumentName: '6-String Guitar',
  pageSize: 'A4',
  coverColor: '#8B4513',
  lessonCount: 0,
  createdAt: '2026-04-04T10:00:00Z',
  updatedAt: '2026-04-04T10:00:00Z',
  styles: [],
};

const userWithDefaults: User = {
  id: 'u-1',
  email: 'a@b.com',
  firstName: 'A',
  lastName: 'B',
  language: 'en',
  defaultPageSize: 'A4',
  defaultInstrumentId: 'inst-2',
  avatarUrl: null,
  scheduledDeletionAt: null,
};

function renderDialog(onOpenChange: (open: boolean) => void) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CreateNotebookDialog open onOpenChange={onOpenChange} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('CreateNotebookDialog', () => {
  beforeEach(() => {
    createNotebookMock.mockReset();
    useCurrentUserMock.mockReset();
  });

  it('closes the dialog on successful create', async () => {
    useCurrentUserMock.mockReturnValue({ data: userWithDefaults });
    createNotebookMock.mockResolvedValue(mockCreated);

    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    // Fill in the title and advance to the appearance step, then submit.
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'My Notebook' },
    });
    fireEvent.click(screen.getByText('to-step-2'));
    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => {
      expect(createNotebookMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('hydrates empty defaults when user loads after dialog opens', async () => {
    // Initially, user is undefined (still loading).
    useCurrentUserMock.mockReturnValue({ data: undefined });
    createNotebookMock.mockResolvedValue(mockCreated);

    const onOpenChange = vi.fn();
    const { rerender } = renderDialog(onOpenChange);

    // User resolves after the dialog has opened.
    useCurrentUserMock.mockReturnValue({ data: userWithDefaults });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    rerender(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CreateNotebookDialog open onOpenChange={onOpenChange} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    // Fill in title, advance, submit — submitted payload should contain the
    // user's defaults that were hydrated by the effect.
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Late Defaults' },
    });
    fireEvent.click(screen.getByText('to-step-2'));
    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => {
      expect(createNotebookMock).toHaveBeenCalledTimes(1);
    });
    expect(createNotebookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        instrumentId: 'inst-2',
        pageSize: 'A4',
      }),
    );
  });

  it('does not overwrite fields the user has already edited', async () => {
    useCurrentUserMock.mockReturnValue({ data: undefined });
    createNotebookMock.mockResolvedValue(mockCreated);
    const onOpenChange = vi.fn();
    const { rerender } = renderDialog(onOpenChange);

    // User picks values before profile resolves.
    fireEvent.click(screen.getByTestId('set-instrument'));
    fireEvent.click(screen.getByTestId('set-pagesize'));
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Keep Mine' },
    });

    // Profile finishes loading with different defaults.
    useCurrentUserMock.mockReturnValue({ data: userWithDefaults });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    rerender(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CreateNotebookDialog open onOpenChange={onOpenChange} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('to-step-2'));
    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => {
      expect(createNotebookMock).toHaveBeenCalledTimes(1);
    });
    // User's choices (inst-1) should be preserved over defaults (inst-2).
    expect(createNotebookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        instrumentId: 'inst-1',
        pageSize: 'A4',
      }),
    );
  });
});
