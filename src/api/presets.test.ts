import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  getSystemPresets,
  getUserPresets,
  createUserPreset,
  renameUserPreset,
  deleteUserPreset,
} from './presets';
import type { SystemStylePreset, UserSavedPreset, StyleEntry } from '@/lib/types';

const systemPresets: SystemStylePreset[] = [
  {
    id: 'sys-1',
    name: 'Classic',
    displayOrder: 1,
    isDefault: true,
    styles: [],
  },
];

const userPresets: UserSavedPreset[] = [
  { id: 'u-2', name: 'Newest', styles: [] },
  { id: 'u-1', name: 'Older', styles: [] },
];

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getSystemPresets', () => {
  it('GETs /presets and returns the list', async () => {
    server.use(
      http.get('http://localhost:5000/presets', () =>
        HttpResponse.json(systemPresets),
      ),
    );

    const result = await getSystemPresets();
    expect(result).toEqual(systemPresets);
  });
});

describe('getUserPresets', () => {
  it('GETs /users/me/presets and preserves backend order (newest first)', async () => {
    server.use(
      http.get('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json(userPresets),
      ),
    );

    const result = await getUserPresets();
    expect(result).toEqual(userPresets);
    expect(result.map((p) => p.id)).toEqual(['u-2', 'u-1']);
  });
});

describe('createUserPreset', () => {
  it('POSTs to /users/me/presets with the name + styles payload', async () => {
    const styles: StyleEntry[] = [
      { moduleType: 'Theory', stylesJson: '{"backgroundColor":"#FFFFFF"}' },
    ];
    let capturedBody: unknown = null;

    server.use(
      http.post('http://localhost:5000/users/me/presets', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          { id: 'u-new', name: 'New Theme', styles },
          { status: 201 },
        );
      }),
    );

    const result = await createUserPreset({ name: 'New Theme', styles });
    expect(capturedBody).toEqual({ name: 'New Theme', styles });
    expect(result.id).toBe('u-new');
  });

  it('propagates 409 duplicate-name errors', async () => {
    server.use(
      http.post('http://localhost:5000/users/me/presets', () =>
        HttpResponse.json({ message: 'duplicate' }, { status: 409 }),
      ),
    );

    await expect(
      createUserPreset({ name: 'Existing', styles: [] }),
    ).rejects.toThrow();
  });
});

describe('renameUserPreset', () => {
  it('PUTs to /users/me/presets/{id} with { name } and returns the updated preset', async () => {
    let capturedBody: unknown = null;

    server.use(
      http.put('http://localhost:5000/users/me/presets/u-1', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          id: 'u-1',
          name: 'Renamed',
          styles: [],
        });
      }),
    );

    const result = await renameUserPreset('u-1', 'Renamed');
    expect(capturedBody).toEqual({ name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });
});

describe('deleteUserPreset', () => {
  it('DELETEs /users/me/presets/{id}', async () => {
    let methodUsed = '';

    server.use(
      http.delete('http://localhost:5000/users/me/presets/u-1', ({ request }) => {
        methodUsed = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await deleteUserPreset('u-1');
    expect(methodUsed).toBe('DELETE');
  });
});
