/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Effect, Layer, ManagedRuntime } from 'effect';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'root',
  },
}));

import {
  createComponent,
  deleteComponent,
  getComponent,
  listComponents,
  publishComponentSource,
  updateComponent,
} from './api';
import { joinPath, WriterLive } from './artifact-writer';
import { AuthLive } from './auth';
import {
  Auth,
  ComponentPublishError,
  ComponentStoreError,
  Log,
  Publish,
  Store,
} from './component.types';
import { FileSyncLive } from './file-sync';
import { PublishLive } from './publisher';
import { StoreLive } from './store';

import type { ComponentLogger } from './component.types';
import type { AmSessionDependencies } from './component.types';

const temporaryDirectories: string[] = [];

process.env.COMPONENT_API_ENABLED = 'true';

/** AM readers accepting every session as an admin, standing in for a valid AM admin session. */
const adminDependencies: AmSessionDependencies = {
  getUserId: () => Promise.resolve('test-admin'),
  getRoles: () => Promise.resolve(['ui-realm-admin']),
};

/** AM readers rejecting every session, standing in for an invalid session. */
const unauthenticatedDependencies: AmSessionDependencies = {
  getUserId: () => Promise.resolve(null),
  getRoles: () => Promise.resolve([]),
};

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'api-'));
  temporaryDirectories.push(directory);
  return directory;
};

/** The component layer graph over a temporary repository, with a spy logger. */
const makeTest = async (authDependencies: AmSessionDependencies = adminDependencies) => {
  const repoDir = await makeTemporaryDirectory();
  const log: ComponentLogger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
  const layer = Layer.mergeAll(
    StoreLive({ trackedRoot: joinPath(repoDir, 'config') }).pipe(
      Layer.provide(WriterLive({ trackedRoot: joinPath(repoDir, 'config') })),
      Layer.provide(FileSyncLive),
      Layer.provide(Layer.succeed(Log, log)),
    ),
    AuthLive(authDependencies),
    PublishLive.pipe(
      Layer.provide(WriterLive({ trackedRoot: joinPath(repoDir, 'config') })),
      Layer.provide(FileSyncLive),
    ),
    Layer.succeed(Log, log),
  );
  const runtime = ManagedRuntime.make(layer);
  const run = <A>(effect: Effect.Effect<A, never, Store | Auth | Publish | Log>) =>
    runtime.runPromise(effect as Effect.Effect<A, never, never>);
  return { log, run, dispose: () => runtime.dispose() };
};

const authorizedRequest = (url: string, init?: RequestInit): Request =>
  new Request(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: 'Bearer am-session-token' },
  });

const componentBody = () =>
  JSON.stringify({
    src: 'test source',
    meta: {
      name: 'test',
      displayName: 'Test',
      publish: false,
      fromComponent: '',
      fromJson: '',
    },
  });

afterEach(async () => {
  process.env.COMPONENT_API_ENABLED = 'true';
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('Component Endpoint Handlers', () => {
  describe('listComponents', () => {
    it('returns an empty array when no components exist', async () => {
      const test = await makeTest();
      const response = await test.run(
        listComponents(
          authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
          'callbacks',
        ),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
      await test.dispose();
    });

    it('returns projected fields when fields query parameter is provided', async () => {
      const test = await makeTest();

      await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );

      const request = authorizedRequest(
        'http://localhost/api/components/callbacks?fields=id,meta.name',
        { method: 'GET' },
      );
      const response = await test.run(listComponents(request, 'callbacks'));

      expect(response.status).toBe(200);
      const body = (await response.json()) as Array<Record<string, unknown>>;
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        const record = body[0];
        expect('id' in record).toBe(true);
        expect('meta' in record).toBe(true);
        const meta = record.meta as Record<string, unknown>;
        expect('name' in meta).toBe(true);
        expect('src' in record).toBe(false);
      }
      await test.dispose();
    });

    it('returns 400 for invalid fields parameter', async () => {
      const test = await makeTest();
      const request = authorizedRequest(
        'http://localhost/api/components/callbacks?fields=..invalid',
        {
          method: 'GET',
        },
      );
      const response = await test.run(listComponents(request, 'callbacks'));
      expect(response.status).toBe(400);
      await test.dispose();
    });

    it('returns 404 for invalid component type', async () => {
      const test = await makeTest();
      const response = await test.run(
        listComponents(
          authorizedRequest('http://localhost/api/components/invalid-type', { method: 'GET' }),
          'invalid-type',
        ),
      );
      expect(response.status).toBe(404);
      await test.dispose();
    });
  });

  describe('getComponent', () => {
    it('returns a component by id', async () => {
      const test = await makeTest();

      const createResponse = await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );

      const createData = (await createResponse.json()) as { id: string };
      const id = createData.id;

      const getResponse = await test.run(
        getComponent(
          authorizedRequest(`http://localhost/api/components/callbacks/${id}`, {
            method: 'GET',
          }),
          'callbacks',
          id,
        ),
      );
      expect(getResponse.status).toBe(200);
      await test.dispose();
    });

    it('returns 404 for missing component', async () => {
      const test = await makeTest();
      const response = await test.run(
        getComponent(
          authorizedRequest(
            'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
            { method: 'GET' },
          ),
          'callbacks',
          'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
        ),
      );
      expect(response.status).toBe(404);
      await test.dispose();
    });
  });

  describe('createComponent', () => {
    it('creates a component and returns 201', async () => {
      const test = await makeTest();
      const response = await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );
      expect(response.status).toBe(201);
      await test.dispose();
    });

    it('returns 401 when the session is not authenticated', async () => {
      const test = await makeTest(unauthenticatedDependencies);
      const response = await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );
      expect(response.status).toBe(401);
      await test.dispose();
    });

    it('returns 401 without an authorization header', async () => {
      const test = await makeTest(unauthenticatedDependencies);
      const response = await test.run(
        createComponent(
          new Request('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );
      expect(response.status).toBe(401);
      await test.dispose();
    });

    it('returns 403 for an authenticated non-admin session', async () => {
      const test = await makeTest({
        getUserId: () => Promise.resolve('regular-user'),
        getRoles: () => Promise.resolve(['ui-enduser']),
      });
      const response = await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );
      expect(response.status).toBe(403);
      await test.dispose();
    });

    it('returns 404 for every handler when the API is disabled', async () => {
      delete process.env.COMPONENT_API_ENABLED;
      const test = await makeTest();
      try {
        const list = await test.run(
          listComponents(
            authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
            'callbacks',
          ),
        );
        const create = await test.run(
          createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          ),
        );
        expect(list.status).toBe(404);
        expect(create.status).toBe(404);
      } finally {
        process.env.COMPONENT_API_ENABLED = 'true';
        await test.dispose();
      }
    });

    it('returns 415 for invalid content-type', async () => {
      const test = await makeTest();
      const response = await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
            body: 'test',
          }),
          'callbacks',
        ),
      );
      expect(response.status).toBe(415);
      await test.dispose();
    });
  });

  describe('updateComponent', () => {
    it('updates a component and returns 200', async () => {
      const test = await makeTest();

      const createResponse = await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );

      const createData = (await createResponse.json()) as {
        id: string;
        meta: { createdDate: string; modifiedDate: string };
      };

      const updateResponse = await test.run(
        updateComponent(
          authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: componentBody().replace('test source', 'updated source'),
          }),
          'callbacks',
          createData.id,
        ),
      );

      expect(updateResponse.status).toBe(200);

      const updateData = (await updateResponse.json()) as {
        meta: { createdDate: string; modifiedDate: string };
      };
      expect(updateData.meta.createdDate).toBe(createData.meta.createdDate);
      expect(updateData.meta.modifiedDate >= createData.meta.modifiedDate).toBe(true);
      await test.dispose();
    });

    it('returns 400 when body id does not match URL id', async () => {
      const test = await makeTest();
      const response = await test.run(
        updateComponent(
          authorizedRequest('http://localhost/api/components/callbacks/different-uuid', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              id: 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
              src: 'updated source',
              meta: {
                name: 'test',
                displayName: 'Test',
                publish: false,
                fromComponent: '',
                fromJson: '',
              },
            }),
          }),
          'callbacks',
          'different-uuid',
        ),
      );
      expect(response.status).toBe(400);
      await test.dispose();
    });
  });

  describe('deleteComponent', () => {
    it('deletes a component and returns 204', async () => {
      const test = await makeTest();

      const createResponse = await test.run(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
        ),
      );

      const createData = (await createResponse.json()) as { id: string };

      const deleteResponse = await test.run(
        deleteComponent(
          authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
            method: 'DELETE',
          }),
          'callbacks',
          createData.id,
        ),
      );
      expect(deleteResponse.status).toBe(204);
      await test.dispose();
    });

    it('returns 404 for missing component', async () => {
      const test = await makeTest();
      const response = await test.run(
        deleteComponent(
          authorizedRequest(
            'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
            { method: 'DELETE' },
          ),
          'callbacks',
          'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
        ),
      );
      expect(response.status).toBe(404);
      await test.dispose();
    });
  });

  describe('publishComponentSource', () => {
    it('publishes a component bundle and returns 200', async () => {
      const test = await makeTest();

      const response = await test.run(
        publishComponentSource(
          authorizedRequest('http://localhost/api/components/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              code: 'bundle code',
              files: [{ path: 'test.js', content: 'test' }],
            }),
          }),
        ),
      );
      expect(response.status).toBe(200);
      const result = (await response.json()) as { id: string; url: string };
      expect(result).toHaveProperty('id');
      expect(result.url).toBe('');
      await test.dispose();
    });

    it('returns 500 when persisting the bundle fails', async () => {
      const test = await makeTest();
      const failingPublish = Layer.succeed(Publish, () =>
        Effect.fail(
          new ComponentPublishError({
            reason: 'Storage',
            message: 'Unable to persist component bundle',
          }),
        ),
      );
      const runtime = ManagedRuntime.make(
        Layer.mergeAll(
          failingPublish,
          Layer.succeed(Log, test.log),
          Layer.succeed(Auth, () => Effect.succeed({ uid: 'test-admin' })),
        ),
      );
      const response = await runtime.runPromise(
        publishComponentSource(
          authorizedRequest('http://localhost/api/components/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ code: 'bundle code' }),
          }),
        ) as Effect.Effect<Response, never, never>,
      );
      expect(response.status).toBe(500);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe('Unable to persist component bundle');
      await runtime.dispose();
    });

    it('returns 400 for an invalid bundle payload', async () => {
      const test = await makeTest();
      const response = await test.run(
        publishComponentSource(
          authorizedRequest('http://localhost/api/components/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: 'not json',
          }),
        ),
      );
      expect(response.status).toBe(400);
      await test.dispose();
    });
  });
});

describe('Component API logging', () => {
  const missingId = 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0';

  const nonAdminDependencies: AmSessionDependencies = {
    getUserId: () => Promise.resolve('regular-user'),
    getRoles: () => Promise.resolve(['ui-enduser']),
  };

  const createRequest = (): Request =>
    authorizedRequest('http://localhost/api/components/callbacks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: componentBody(),
    });

  const listRequest = (): Request =>
    authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' });

  const publishRequest = (body: unknown): Request =>
    authorizedRequest('http://localhost/api/components/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('audits a created component with the caller, type, id and name', async () => {
    const test = await makeTest();

    const response = await test.run(createComponent(createRequest(), 'callbacks'));
    const { id } = (await response.json()) as { id: string };

    expect(test.log.info).toHaveBeenCalledTimes(1);
    expect(test.log.info).toHaveBeenCalledWith('[components] audit', {
      action: 'create',
      outcome: 'succeeded',
      uid: 'test-admin',
      type: 'callbacks',
      id,
      name: 'test',
    });
    await test.dispose();
  });

  it('audits an update and a delete with the route id', async () => {
    const test = await makeTest();
    const created = await test.run(createComponent(createRequest(), 'callbacks'));
    const { id } = (await created.json()) as { id: string };
    const url = `http://localhost/api/components/callbacks/${id}`;

    await test.run(
      updateComponent(
        authorizedRequest(url, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        id,
      ),
    );
    expect(test.log.info).toHaveBeenLastCalledWith('[components] audit', {
      action: 'update',
      outcome: 'succeeded',
      uid: 'test-admin',
      type: 'callbacks',
      id,
      name: 'test',
    });

    await test.run(deleteComponent(authorizedRequest(url, { method: 'DELETE' }), 'callbacks', id));
    expect(test.log.info).toHaveBeenLastCalledWith('[components] audit', {
      action: 'delete',
      outcome: 'succeeded',
      uid: 'test-admin',
      type: 'callbacks',
      id,
    });
    await test.dispose();
  });

  it('logs nothing for reads, missing records, or client validation errors', async () => {
    const test = await makeTest();
    const url = `http://localhost/api/components/callbacks/${missingId}`;

    await test.run(listComponents(listRequest(), 'callbacks'));
    await test.run(getComponent(authorizedRequest(url, { method: 'GET' }), 'callbacks', missingId));
    await test.run(
      updateComponent(
        authorizedRequest(url, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: componentBody(),
        }),
        'callbacks',
        missingId,
      ),
    );
    await test.run(
      deleteComponent(authorizedRequest(url, { method: 'DELETE' }), 'callbacks', missingId),
    );
    await test.run(
      createComponent(
        authorizedRequest('http://localhost/api/components/callbacks', {
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          body: 'test',
        }),
        'callbacks',
      ),
    );

    expect(test.log.info).not.toHaveBeenCalled();
    expect(test.log.warn).not.toHaveBeenCalled();
    expect(test.log.error).not.toHaveBeenCalled();
    await test.dispose();
  });

  it('logs a failed mutation as an error with the cause and no success line', async () => {
    const cause = new Error('disk full');
    const log: ComponentLogger = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
    const repoDir = await makeTemporaryDirectory();
    const config = { trackedRoot: joinPath(repoDir, 'config') };

    // The real store with only `create` overridden to fail.
    const realStore = StoreLive(config).pipe(
      Layer.provide(WriterLive(config)),
      Layer.provide(FileSyncLive),
    );
    const failingCreate = Layer.effect(
      Store,
      Effect.map(Effect.context<Store>(), (context) => ({
        ...Context.get(context, Store),
        create: () =>
          Effect.fail(
            new ComponentStoreError({
              reason: 'Storage',
              message: 'Unable to save component record',
              cause,
            }),
          ),
      })),
    );

    const runtime = ManagedRuntime.make(
      Layer.mergeAll(
        failingCreate.pipe(Layer.provide(realStore), Layer.provide(Layer.succeed(Log, log))),
        Layer.succeed(Log, log),
        Layer.succeed(Auth, () => Effect.succeed({ uid: 'test-admin' })),
      ),
    );
    const response = await runtime.runPromise(
      createComponent(createRequest(), 'callbacks') as Effect.Effect<Response, never, never>,
    );

    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith(
      '[components] audit',
      {
        action: 'create',
        outcome: 'failed',
        uid: 'test-admin',
        type: 'callbacks',
        detail: 'Unable to save component record',
      },
      cause,
    );
    expect(log.info).not.toHaveBeenCalled();
    await runtime.dispose();
  });

  it('audits a publish with the files it wrote', async () => {
    const test = await makeTest();

    await test.run(
      publishComponentSource(
        publishRequest({ code: 'bundle code', files: [{ path: 'extra/a.js', content: 'a' }] }),
      ),
    );

    expect(test.log.info).toHaveBeenCalledWith('[components] audit', {
      action: 'publish',
      outcome: 'succeeded',
      uid: 'test-admin',
      paths: ['extra/a.js', 'bundle.js'],
    });
    await test.dispose();
  });

  it('logs a rejected publish as a warning without echoing the unsafe path', async () => {
    const test = await makeTest();

    const response = await test.run(
      publishComponentSource(
        publishRequest({ code: 'x', files: [{ path: '../escape.js', content: 'x' }] }),
      ),
    );

    expect(response.status).toBe(400);
    expect(test.log.warn).toHaveBeenCalledWith('[components] audit', {
      action: 'publish',
      outcome: 'rejected',
      uid: 'test-admin',
      detail: 'Bundle file at index 0 has an unsafe path',
    });
    await test.dispose();
  });

  it('logs a failed publish as an error with the paths and the cause', async () => {
    const test = await makeTest();
    const cause = new Error('disk full');
    const failingPublish = Layer.effect(
      Publish,
      Effect.succeed(() =>
        Effect.fail(
          new ComponentPublishError({
            reason: 'Storage',
            message: 'Unable to persist component bundle',
            cause,
          }),
        ),
      ),
    );

    const runtime = ManagedRuntime.make(
      Layer.mergeAll(
        failingPublish,
        Layer.succeed(Log, test.log),
        Layer.succeed(Auth, () => Effect.succeed({ uid: 'test-admin' })),
      ),
    );
    const response = await runtime.runPromise(
      publishComponentSource(publishRequest({ code: 'bundle code' })) as Effect.Effect<
        Response,
        never,
        never
      >,
    );

    expect(response.status).toBe(500);
    expect(test.log.error).toHaveBeenCalledWith(
      '[components] audit',
      {
        action: 'publish',
        outcome: 'failed',
        uid: 'test-admin',
        paths: ['bundle.js'],
        detail: 'Unable to persist component bundle',
      },
      cause,
    );
    await runtime.dispose();
  });

  it('logs a request refused for a known caller, with the reason and uid', async () => {
    const test = await makeTest(nonAdminDependencies);

    await test.run(listComponents(listRequest(), 'callbacks'));

    expect(test.log.warn).toHaveBeenCalledWith('[components] audit', {
      action: 'access',
      outcome: 'denied',
      reason: 'Forbidden',
      detail: 'An AM admin role is required',
      uid: 'regular-user',
    });
    await test.dispose();
  });

  it('does not log a request without a valid session', async () => {
    const test = await makeTest(unauthenticatedDependencies);

    const response = await test.run(listComponents(listRequest(), 'callbacks'));

    expect(response.status).toBe(401);
    expect(test.log.warn).not.toHaveBeenCalled();
    expect(test.log.error).not.toHaveBeenCalled();
    await test.dispose();
  });

  it('logs an AM failure as an error with the cause', async () => {
    const cause = new Error('AM down');
    const test = await makeTest({
      getUserId: () => Promise.reject(cause),
      getRoles: () => Promise.resolve([]),
    });

    const response = await test.run(listComponents(listRequest(), 'callbacks'));

    expect(response.status).toBe(500);
    expect(test.log.error).toHaveBeenCalledWith(
      '[components] audit',
      expect.objectContaining({ outcome: 'failed', reason: 'Unavailable' }),
      cause,
    );
    await test.dispose();
  });

  it('logs nothing while the API is disabled', async () => {
    delete process.env.COMPONENT_API_ENABLED;
    const test = await makeTest(unauthenticatedDependencies);
    try {
      await test.run(listComponents(listRequest(), 'callbacks'));
      expect(test.log.warn).not.toHaveBeenCalled();
    } finally {
      process.env.COMPONENT_API_ENABLED = 'true';
      await test.dispose();
    }
  });
});
