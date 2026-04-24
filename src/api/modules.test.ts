import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  getModules,
  createModule,
  updateModuleLayout,
  deleteModule,
} from './modules';
import type {
  CreateModuleInput,
  Module,
  UpdateModuleLayoutInput,
} from '@/lib/types';

const sampleModule: Module = {
  id: 'module-1',
  lessonPageId: 'page-1',
  moduleType: 'Theory',
  gridX: 4,
  gridY: 6,
  gridWidth: 10,
  gridHeight: 8,
  zIndex: 2,
  content: [],
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getModules', () => {
  it('GETs /pages/{pageId}/modules and returns the modules array', async () => {
    server.use(
      http.get('http://localhost:5000/pages/page-1/modules', () => {
        return HttpResponse.json([sampleModule]);
      }),
    );

    const result = await getModules('page-1');

    expect(result).toEqual([sampleModule]);
  });

  it('propagates server errors', async () => {
    server.use(
      http.get('http://localhost:5000/pages/page-1/modules', () => {
        return HttpResponse.json({ message: 'not found' }, { status: 404 });
      }),
    );

    await expect(getModules('page-1')).rejects.toThrow();
  });
});

describe('createModule', () => {
  it('POSTs the create payload to /pages/{pageId}/modules and returns the saved module', async () => {
    let capturedBody: unknown = null;
    const payload: CreateModuleInput = {
      moduleType: 'Question',
      gridX: 0,
      gridY: 12,
      gridWidth: 8,
      gridHeight: 4,
    };

    server.use(
      http.post('http://localhost:5000/pages/page-1/modules', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          { ...sampleModule, ...payload, id: 'new-module' },
          { status: 201 },
        );
      }),
    );

    const result = await createModule('page-1', payload);

    expect(capturedBody).toEqual(payload);
    expect(result.id).toBe('new-module');
    expect(result.moduleType).toBe('Question');
  });

  it('propagates validation errors from the server', async () => {
    server.use(
      http.post('http://localhost:5000/pages/page-1/modules', () => {
        return HttpResponse.json(
          { message: 'overlap', code: 'MODULE_OVERLAP' },
          { status: 400 },
        );
      }),
    );

    await expect(
      createModule('page-1', {
        moduleType: 'Theory',
        gridX: 0,
        gridY: 0,
        gridWidth: 8,
        gridHeight: 5,
      }),
    ).rejects.toThrow();
  });
});

describe('updateModuleLayout', () => {
  it('PATCHes /modules/{moduleId}/layout with the layout payload and returns the saved module', async () => {
    let capturedBody: unknown = null;
    const payload: UpdateModuleLayoutInput = {
      gridX: 8,
      gridY: 6,
      gridWidth: 10,
      gridHeight: 8,
      zIndex: 3,
    };

    server.use(
      http.patch('http://localhost:5000/modules/module-1/layout', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...sampleModule, ...payload });
      }),
    );

    const result = await updateModuleLayout('module-1', payload);

    expect(capturedBody).toEqual(payload);
    expect(result.gridX).toBe(8);
    expect(result.zIndex).toBe(3);
  });

  it('propagates server validation errors', async () => {
    server.use(
      http.patch('http://localhost:5000/modules/module-1/layout', () => {
        return HttpResponse.json(
          { message: 'out of bounds', code: 'MODULE_OUT_OF_BOUNDS' },
          { status: 400 },
        );
      }),
    );

    await expect(
      updateModuleLayout('module-1', {
        gridX: 99,
        gridY: 99,
        gridWidth: 10,
        gridHeight: 8,
        zIndex: 1,
      }),
    ).rejects.toThrow();
  });
});

describe('deleteModule', () => {
  it('DELETEs /modules/{moduleId} and resolves on 204', async () => {
    let methodUsed = '';

    server.use(
      http.delete('http://localhost:5000/modules/module-1', ({ request }) => {
        methodUsed = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(deleteModule('module-1')).resolves.toBeUndefined();
    expect(methodUsed).toBe('DELETE');
  });

  it('propagates server errors', async () => {
    server.use(
      http.delete('http://localhost:5000/modules/module-1', () => {
        return HttpResponse.json({ message: 'not found' }, { status: 404 });
      }),
    );

    await expect(deleteModule('module-1')).rejects.toThrow();
  });
});
