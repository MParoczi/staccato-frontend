import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { updateNotebookStyles, applyPresetToNotebook } from './notebooks';
import type {
  NotebookModuleStyle,
  UpdateNotebookStyleInput,
} from '@/lib/types';

const baseStyle: Omit<NotebookModuleStyle, 'id' | 'notebookId' | 'moduleType'> = {
  backgroundColor: '#FFFFFF',
  borderColor: '#CCCCCC',
  borderStyle: 'Solid',
  borderWidth: 1,
  borderRadius: 4,
  headerBgColor: '#F0E6D3',
  headerTextColor: '#333333',
  bodyTextColor: '#333333',
  fontFamily: 'Default',
};

const updatedStyles: NotebookModuleStyle[] = [
  {
    id: 'style-1',
    notebookId: 'nb-1',
    moduleType: 'Theory',
    ...baseStyle,
  },
];

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('updateNotebookStyles', () => {
  it('PUTs the bulk styles payload to /notebooks/{id}/styles and returns the server response', async () => {
    const payload: UpdateNotebookStyleInput[] = [
      { moduleType: 'Theory', ...baseStyle },
    ];
    let capturedBody: unknown = null;

    server.use(
      http.put('http://localhost:5000/notebooks/nb-1/styles', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(updatedStyles);
      }),
    );

    const result = await updateNotebookStyles('nb-1', payload);

    expect(capturedBody).toEqual(payload);
    expect(result).toEqual(updatedStyles);
  });

  it('propagates server errors', async () => {
    server.use(
      http.put('http://localhost:5000/notebooks/nb-1/styles', () => {
        return HttpResponse.json(
          { message: 'invalid hex' },
          { status: 400 },
        );
      }),
    );

    await expect(
      updateNotebookStyles('nb-1', [{ moduleType: 'Theory', ...baseStyle }]),
    ).rejects.toThrow();
  });
});

describe('applyPresetToNotebook', () => {
  it('POSTs to /notebooks/{id}/styles/apply-preset/{presetId} with no body and returns styles', async () => {
    let methodUsed = '';
    let receivedBody: unknown = null;

    server.use(
      http.post(
        'http://localhost:5000/notebooks/nb-1/styles/apply-preset/preset-1',
        async ({ request }) => {
          methodUsed = request.method;
          const text = await request.text();
          receivedBody = text.length > 0 ? text : null;
          return HttpResponse.json(updatedStyles);
        },
      ),
    );

    const result = await applyPresetToNotebook('nb-1', 'preset-1');

    expect(methodUsed).toBe('POST');
    expect(receivedBody).toBeNull();
    expect(result).toEqual(updatedStyles);
  });

  it('propagates 404 errors', async () => {
    server.use(
      http.post(
        'http://localhost:5000/notebooks/nb-1/styles/apply-preset/missing',
        () => HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    );

    await expect(applyPresetToNotebook('nb-1', 'missing')).rejects.toThrow();
  });
});
