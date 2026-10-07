/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Path } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { it } from '@effect/vitest';
import { Context, Effect, Layer, Schema } from 'effect';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';

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
import {
  CreateComponentRequestSchema,
  PublishRequestSchema,
  UpdateComponentRequestSchema,
} from './api.schemas';
import { Auth, AuthLive } from './auth/auth';
import { Publish, PublishLive, PublishStorageError } from './publish/publish';
import { type ComponentLogger, Log } from './shared';
import { Store, StoreLive, StoreStorageError } from './store/store';
import { FileSyncLive, WriterLive } from './writer/writer';

import type { AuthFn } from './auth/auth';
import type { AmSessionReader } from './auth/auth';
import type { ComponentPublishFn } from './publish/publish';
import type { ComponentStoreApi } from './store/store';
import type { AmSession } from '$server/sessions';

const temporaryDirectories: string[] = [];

process.env.COMPONENT_API_ENABLED = 'true';

/** AM readers accepting every session as an admin, standing in for a valid AM admin session. */
const adminReader: AmSessionReader = () =>
  Promise.resolve({
    userId: 'test-admin',
    roles: ['ui-realm-admin'],
    unreachable: false,
  } satisfies AmSession);

/** AM readers rejecting every session, standing in for an invalid session. */
const unauthenticatedReader: AmSessionReader = () =>
  Promise.resolve({ userId: null, roles: [], unreachable: false } satisfies AmSession);

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'api-'));
  temporaryDirectories.push(directory);
  return directory;
};

/** Builds the component layer graph over a fresh temporary repository with a spy logger. */
const makeGraph = (log: ComponentLogger, authReader: AmSessionReader) =>
  Effect.gen(function* () {
    const directory = yield* Effect.promise(makeTemporaryDirectory);
    const trackedRoot = join(directory, 'config');
    const fileSyncLayer = FileSyncLive.pipe(Layer.provide(NodeFileSystem.layer));
    const writerLayer = WriterLive({ trackedRoot }).pipe(
      Layer.provide(fileSyncLayer),
      Layer.provide(NodeFileSystem.layer),
      Layer.provide(Path.layer),
    );
    return Layer.mergeAll(
      StoreLive({ trackedRoot }).pipe(
        Layer.provide(writerLayer),
        Layer.provide(fileSyncLayer),
        Layer.provide(NodeFileSystem.layer),
        Layer.provide(Path.layer),
        Layer.provide(Layer.succeed(Log, log)),
      ),
      AuthLive(authReader),
      PublishLive.pipe(Layer.provide(writerLayer)),
      Layer.succeed(Log, log),
    );
  });

/** Runs a handler effect against a freshly built graph, logging spies included. */
const runWith = <A>(
  effect: Effect.Effect<
    A,
    never,
    ComponentStoreApi | AuthFn | ComponentPublishFn | ComponentLogger
  >,
  log: ComponentLogger,
  authReader: AmSessionReader = adminReader,
) =>
  Effect.flatMap(makeGraph(log, authReader), (layer) =>
    Effect.scoped(Effect.provide(effect, layer)),
  );

/**
 * Builds one shared graph for a multi-call flow (create-then-get, create-then-update) and
 * provides it to the body's effects: `withGraph(log)(Effect.gen(...))`. The same `log`
 * object is wired into the graph, so spy assertions see the graph's audit lines.
 */
const withGraph =
  (log: ComponentLogger, authReader: AmSessionReader = adminReader) =>
  <A>(
    body: Effect.Effect<
      A,
      never,
      ComponentStoreApi | AuthFn | ComponentPublishFn | ComponentLogger
    >,
  ) =>
    Effect.flatMap(makeGraph(log, authReader), (layer) =>
      Effect.scoped(Effect.provide(body, layer)),
    );

/** Standard spies object each test mutates into its own graph. */
const makeLog = (): ComponentLogger => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() });

const authorizedRequest = (url: string, init?: RequestInit): Request =>
  new Request(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: 'Bearer am-session-token' },
  });

const componentBody = () =>
  Schema.encodeSync(Schema.parseJson(CreateComponentRequestSchema))({
    src: 'test source',
    meta: {
      name: 'test',
      displayName: 'Test',
      publish: false,
      fromComponent: '',
      fromJson: '',
    },
  });

/** Reads a Response body as JSON inside an Effect. */
const json = (response: Response) => Effect.promise(() => response.json());

afterEach(async () => {
  process.env.COMPONENT_API_ENABLED = 'true';
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('Component Endpoint Handlers', () => {
  describe('listComponents', () => {
    it.effect('returns an empty array when no components exist', () =>
      Effect.gen(function* () {
        const log = makeLog();
        const response = yield* runWith(
          listComponents(
            authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
            'callbacks',
          ),
          log,
        );
        expect(response.status).toBe(200);
        expect(yield* json(response)).toEqual([]);
      }),
    );

    it.effect('returns projected fields when fields query parameter is provided', () =>
      Effect.gen(function* () {
        const log = makeLog();
        const body = yield* withGraph(log)(
          Effect.gen(function* () {
            yield* createComponent(
              authorizedRequest('http://localhost/api/components/callbacks', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: componentBody(),
              }),
              'callbacks',
            );

            const request = authorizedRequest(
              'http://localhost/api/components/callbacks?fields=id,meta.name',
              { method: 'GET' },
            );
            const response = yield* listComponents(request, 'callbacks');

            expect(response.status).toBe(200);
            return (yield* json(response)) as Array<Record<string, unknown>>;
          }),
        );

        expect(Array.isArray(body)).toBe(true);
        expect(body).toHaveLength(1);
        const record = body[0];
        expect('id' in record).toBe(true);
        expect('meta' in record).toBe(true);
        const meta = record.meta as Record<string, unknown>;
        expect('name' in meta).toBe(true);
        expect('src' in record).toBe(false);
      }),
    );

    it.effect('returns 400 for invalid fields parameter', () =>
      Effect.gen(function* () {
        const request = authorizedRequest(
          'http://localhost/api/components/callbacks?fields=..invalid',
          {
            method: 'GET',
          },
        );
        const response = yield* runWith(listComponents(request, 'callbacks'), makeLog());
        expect(response.status).toBe(400);
      }),
    );

    it.effect('returns 404 for invalid component type', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          listComponents(
            authorizedRequest('http://localhost/api/components/invalid-type', { method: 'GET' }),
            'invalid-type',
          ),
          makeLog(),
        );
        expect(response.status).toBe(404);
      }),
    );
  });

  describe('getComponent', () => {
    it.effect('returns a component by id', () =>
      withGraph(makeLog())(
        Effect.gen(function* () {
          const createResponse = yield* createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          );

          const createData = (yield* json(createResponse)) as { id: string };
          const id = createData.id;

          const getResponse = yield* getComponent(
            authorizedRequest(`http://localhost/api/components/callbacks/${id}`, {
              method: 'GET',
            }),
            'callbacks',
            id,
          );
          expect(getResponse.status).toBe(200);
        }),
      ),
    );

    it.effect('returns 404 for missing component', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          getComponent(
            authorizedRequest(
              'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
              { method: 'GET' },
            ),
            'callbacks',
            'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          ),
          makeLog(),
        );
        expect(response.status).toBe(404);
      }),
    );
  });

  describe('createComponent', () => {
    it.effect('creates a component and returns 201', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          ),
          makeLog(),
        );
        expect(response.status).toBe(201);
      }),
    );

    it.effect('returns 401 when the session is not authenticated', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          ),
          makeLog(),
          unauthenticatedReader,
        );
        expect(response.status).toBe(401);
      }),
    );

    it.effect('returns 401 without an authorization header', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          createComponent(
            new Request('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          ),
          makeLog(),
          unauthenticatedReader,
        );
        expect(response.status).toBe(401);
      }),
    );

    it.effect('returns 403 for an authenticated non-admin session', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          ),
          makeLog(),
          () =>
            Promise.resolve({
              userId: 'regular-user',
              roles: ['ui-enduser'],
              unreachable: false,
            } satisfies AmSession),
        );
        expect(response.status).toBe(403);
      }),
    );

    it.effect('returns 404 for every handler when the API is disabled', () =>
      Effect.gen(function* () {
        delete process.env.COMPONENT_API_ENABLED;
        const log = makeLog();
        const list = yield* runWith(
          listComponents(
            authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
            'callbacks',
          ),
          log,
        );
        const create = yield* runWith(
          createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          ),
          log,
        );
        process.env.COMPONENT_API_ENABLED = 'true';
        expect(list.status).toBe(404);
        expect(create.status).toBe(404);
      }),
    );

    it.effect('returns 415 for invalid content-type', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'text/plain' },
              body: 'test',
            }),
            'callbacks',
          ),
          makeLog(),
        );
        expect(response.status).toBe(415);
      }),
    );
  });

  describe('updateComponent', () => {
    it.effect('updates a component and returns 200', () =>
      withGraph(makeLog())(
        Effect.gen(function* () {
          const createResponse = yield* createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          );

          const createData = (yield* json(createResponse)) as {
            id: string;
            meta: { createdDate: string; modifiedDate: string };
          };

          const updateResponse = yield* updateComponent(
            authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
              method: 'PUT',
              headers: { 'content-type': 'application/json' },
              body: componentBody().replace('test source', 'updated source'),
            }),
            'callbacks',
            createData.id,
          );

          expect(updateResponse.status).toBe(200);

          const updateData = (yield* json(updateResponse)) as {
            meta: { createdDate: string; modifiedDate: string };
          };
          expect(updateData.meta.createdDate).toBe(createData.meta.createdDate);
          expect(updateData.meta.modifiedDate >= createData.meta.modifiedDate).toBe(true);
        }),
      ),
    );

    it.effect('returns 400 when body id does not match URL id', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          updateComponent(
            authorizedRequest(
              'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
              {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: Schema.encodeSync(Schema.parseJson(UpdateComponentRequestSchema))({
                  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                  src: 'updated source',
                  meta: {
                    name: 'test',
                    displayName: 'Test',
                    publish: false,
                    fromComponent: '',
                    fromJson: '',
                  },
                }),
              },
            ),
            'callbacks',
            'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          ),
          makeLog(),
        );
        expect(response.status).toBe(400);
      }),
    );
  });

  describe('deleteComponent', () => {
    it.effect('deletes a component and returns 204', () =>
      withGraph(makeLog())(
        Effect.gen(function* () {
          const createResponse = yield* createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
          );

          const createData = (yield* json(createResponse)) as { id: string };

          const deleteResponse = yield* deleteComponent(
            authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
              method: 'DELETE',
            }),
            'callbacks',
            createData.id,
          );
          expect(deleteResponse.status).toBe(204);
        }),
      ),
    );

    it.effect('returns 404 for missing component', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          deleteComponent(
            authorizedRequest(
              'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
              { method: 'DELETE' },
            ),
            'callbacks',
            'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          ),
          makeLog(),
        );
        expect(response.status).toBe(404);
      }),
    );
  });

  describe('publishComponentSource', () => {
    it.effect('publishes a component bundle and returns 200', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          publishComponentSource(
            authorizedRequest('http://localhost/api/components/publish', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: Schema.encodeSync(Schema.parseJson(PublishRequestSchema))({
                code: 'bundle code',
                files: [{ path: 'test.js', content: 'test' }],
              }),
            }),
          ),
          makeLog(),
        );
        expect(response.status).toBe(200);
        const result = (yield* json(response)) as { id: string; url: string };
        expect(result).toHaveProperty('id');
        expect(result.url).toBe('');
      }),
    );

    it.effect('returns 500 when persisting the bundle fails', () =>
      Effect.gen(function* () {
        const log = makeLog();
        const failingPublish = Layer.succeed(Publish, () =>
          Effect.fail(
            new PublishStorageError({
              message: 'Unable to persist component bundle',
            }),
          ),
        );
        const layer = Layer.mergeAll(
          failingPublish,
          Layer.succeed(Log, log),
          Layer.succeed(Auth, () => Effect.succeed({ uid: 'test-admin' })),
        );
        const response = yield* Effect.provide(
          publishComponentSource(
            authorizedRequest('http://localhost/api/components/publish', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: Schema.encodeSync(Schema.parseJson(PublishRequestSchema))({
                code: 'bundle code',
              }),
            }),
          ),
          layer,
        );
        expect(response.status).toBe(500);
        const body = (yield* json(response)) as { error: string };
        expect(body.error).toBe('Unable to persist component bundle');
      }),
    );

    it.effect('returns 400 when a client file uses the reserved bundle.js path', () =>
      Effect.gen(function* () {
        const log = makeLog();
        const response = yield* runWith(
          publishComponentSource(
            authorizedRequest('http://localhost/api/components/publish', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: Schema.encodeSync(Schema.parseJson(PublishRequestSchema))({
                code: 'bundle code',
                files: [{ path: 'bundle.js', content: 'collision' }],
              }),
            }),
          ),
          log,
        );
        expect(response.status).toBe(400);
        expect(log.warn).toHaveBeenCalledWith(
          '[components] audit',
          expect.objectContaining({ outcome: 'rejected' }),
        );
      }),
    );

    it.effect('returns 400 for an invalid bundle payload', () =>
      Effect.gen(function* () {
        const response = yield* runWith(
          publishComponentSource(
            authorizedRequest('http://localhost/api/components/publish', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: 'not json',
            }),
          ),
          makeLog(),
        );
        expect(response.status).toBe(400);
      }),
    );
  });
});

describe('Component API logging', () => {
  const missingId = 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0';

  const nonAdminReader: AmSessionReader = () =>
    Promise.resolve({
      userId: 'regular-user',
      roles: ['ui-enduser'],
      unreachable: false,
    } satisfies AmSession);

  const createRequest = (): Request =>
    authorizedRequest('http://localhost/api/components/callbacks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: componentBody(),
    });

  const listRequest = (): Request =>
    authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' });

  const publishRequest = (body: typeof PublishRequestSchema.Type): Request =>
    authorizedRequest('http://localhost/api/components/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: Schema.encodeSync(Schema.parseJson(PublishRequestSchema))(body),
    });

  it.effect('audits a created component with the caller, type, id and name', () =>
    Effect.gen(function* () {
      const log = makeLog();

      const response = yield* runWith(createComponent(createRequest(), 'callbacks'), log);
      const { id } = (yield* json(response)) as { id: string };

      expect(log.info).toHaveBeenCalledTimes(1);
      expect(log.info).toHaveBeenCalledWith('[components] audit', {
        action: 'create',
        outcome: 'succeeded',
        uid: 'test-admin',
        type: 'callbacks',
        id,
        name: 'test',
      });
    }),
  );

  it.effect('audits an update and a delete with the route id', () =>
    Effect.gen(function* () {
      const log = makeLog();
      yield* withGraph(log)(
        Effect.gen(function* () {
          const created = yield* createComponent(createRequest(), 'callbacks');
          const { id } = (yield* json(created)) as { id: string };
          const url = `http://localhost/api/components/callbacks/${id}`;

          yield* updateComponent(
            authorizedRequest(url, {
              method: 'PUT',
              headers: { 'content-type': 'application/json' },
              body: componentBody(),
            }),
            'callbacks',
            id,
          );
          expect(log.info).toHaveBeenLastCalledWith('[components] audit', {
            action: 'update',
            outcome: 'succeeded',
            uid: 'test-admin',
            type: 'callbacks',
            id,
            name: 'test',
          });

          yield* deleteComponent(authorizedRequest(url, { method: 'DELETE' }), 'callbacks', id);
          expect(log.info).toHaveBeenLastCalledWith('[components] audit', {
            action: 'delete',
            outcome: 'succeeded',
            uid: 'test-admin',
            type: 'callbacks',
            id,
          });
        }),
      );
    }),
  );

  it.effect('logs nothing for reads, missing records, or client validation errors', () =>
    Effect.gen(function* () {
      const log = makeLog();
      const url = `http://localhost/api/components/callbacks/${missingId}`;

      yield* runWith(listComponents(listRequest(), 'callbacks'), log);
      yield* runWith(
        getComponent(authorizedRequest(url, { method: 'GET' }), 'callbacks', missingId),
        log,
      );
      yield* runWith(
        updateComponent(
          authorizedRequest(url, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: componentBody(),
          }),
          'callbacks',
          missingId,
        ),
        log,
      );
      yield* runWith(
        deleteComponent(authorizedRequest(url, { method: 'DELETE' }), 'callbacks', missingId),
        log,
      );
      yield* runWith(
        createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
            body: 'test',
          }),
          'callbacks',
        ),
        log,
      );

      expect(log.info).not.toHaveBeenCalled();
      expect(log.warn).not.toHaveBeenCalled();
      expect(log.error).not.toHaveBeenCalled();
    }),
  );

  it.effect('logs a failed mutation as an error with the cause and no success line', () =>
    Effect.gen(function* () {
      const cause = new Error('disk full');
      const log = makeLog();

      const directory = yield* Effect.promise(makeTemporaryDirectory);
      const config = { trackedRoot: join(directory, 'config') };
      const storeLayer = StoreLive(config).pipe(
        Layer.provide(WriterLive(config).pipe(Layer.provide(FileSyncLive))),
        Layer.provide(FileSyncLive),
        Layer.provide(NodeFileSystem.layer),
        Layer.provide(Path.layer),
      );
      const failingCreate = Layer.effect(
        Store,
        Effect.map(Effect.context<ComponentStoreApi>(), (context) => ({
          ...Context.get(context, Store),
          create: () =>
            Effect.fail(
              new StoreStorageError({
                message: 'Unable to save component record',
                cause,
              }),
            ),
        })),
      );

      const layer = Layer.mergeAll(
        failingCreate.pipe(
          Layer.provide(storeLayer),
          Layer.provide(Layer.succeed(Log, log)),
          Layer.provide(FileSyncLive),
          Layer.provide(NodeFileSystem.layer),
          Layer.provide(Path.layer),
        ),
        Layer.succeed(Log, log),
        Layer.succeed(Auth, () => Effect.succeed({ uid: 'test-admin' })),
      );
      const response = yield* Effect.provide(createComponent(createRequest(), 'callbacks'), layer);

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
    }),
  );

  it.effect('audits a publish with the files it wrote', () =>
    Effect.gen(function* () {
      const log = makeLog();

      yield* runWith(
        publishComponentSource(
          publishRequest({ code: 'bundle code', files: [{ path: 'extra/a.js', content: 'a' }] }),
        ),
        log,
      );

      expect(log.info).toHaveBeenCalledWith('[components] audit', {
        action: 'publish',
        outcome: 'succeeded',
        uid: 'test-admin',
        paths: ['extra/a.js', 'bundle.js'],
      });
    }),
  );

  it.effect('logs a rejected publish as a warning without echoing the unsafe path', () =>
    Effect.gen(function* () {
      const log = makeLog();

      const response = yield* runWith(
        publishComponentSource(
          publishRequest({ code: 'x', files: [{ path: '../escape.js', content: 'x' }] }),
        ),
        log,
      );

      expect(response.status).toBe(400);
      expect(log.warn).toHaveBeenCalledWith('[components] audit', {
        action: 'publish',
        outcome: 'rejected',
        uid: 'test-admin',
        detail: 'Bundle file at index 0 has an unsafe path',
      });
    }),
  );

  it.effect('logs a failed publish as an error with the paths and the cause', () =>
    Effect.gen(function* () {
      const cause = new Error('disk full');
      const log = makeLog();
      const failingPublish = Layer.effect(
        Publish,
        Effect.succeed(() =>
          Effect.fail(
            new PublishStorageError({
              message: 'Unable to persist component bundle',
              cause,
            }),
          ),
        ),
      );

      const layer = Layer.mergeAll(
        failingPublish,
        Layer.succeed(Log, log),
        Layer.succeed(Auth, () => Effect.succeed({ uid: 'test-admin' })),
      );
      const response = yield* Effect.provide(
        publishComponentSource(publishRequest({ code: 'bundle code' })),
        layer,
      );

      expect(response.status).toBe(500);
      expect(log.error).toHaveBeenCalledWith(
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
    }),
  );

  it.effect('logs a request refused for a known caller, with the reason and uid', () =>
    Effect.gen(function* () {
      const log = makeLog();

      yield* runWith(listComponents(listRequest(), 'callbacks'), log, nonAdminReader);

      expect(log.warn).toHaveBeenCalledWith('[components] audit', {
        action: 'access',
        outcome: 'denied',
        reason: 'AuthForbiddenError',
        detail: 'An AM admin role is required',
        uid: 'regular-user',
      });
    }),
  );

  it.effect('does not log a request without a valid session', () =>
    Effect.gen(function* () {
      const log = makeLog();

      const response = yield* runWith(
        listComponents(listRequest(), 'callbacks'),
        log,
        unauthenticatedReader,
      );

      expect(response.status).toBe(401);
      expect(log.warn).not.toHaveBeenCalled();
      expect(log.error).not.toHaveBeenCalled();
    }),
  );

  it.effect('logs an AM failure as an error with the cause', () =>
    Effect.gen(function* () {
      const cause = new Error('AM down');
      const log = makeLog();

      const response = yield* runWith(listComponents(listRequest(), 'callbacks'), log, () =>
        Promise.reject(cause),
      );

      expect(response.status).toBe(503);
      expect(log.error).toHaveBeenCalledWith(
        '[components] audit',
        expect.objectContaining({ outcome: 'failed', reason: 'AuthUnavailableError' }),
        cause,
      );
    }),
  );

  it.effect('logs nothing while the API is disabled', () =>
    Effect.gen(function* () {
      delete process.env.COMPONENT_API_ENABLED;
      const log = makeLog();
      yield* runWith(listComponents(listRequest(), 'callbacks'), log, unauthenticatedReader);
      process.env.COMPONENT_API_ENABLED = 'true';
      expect(log.warn).not.toHaveBeenCalled();
    }),
  );
});
