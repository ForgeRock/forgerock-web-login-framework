/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { NodeFileSystem } from '@effect/platform-node';
import { afterEach, describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'root',
  },
}));

import {
  createComponent as createComponentProgram,
  deleteComponent as deleteComponentProgram,
  getComponent as getComponentProgram,
  listComponents as listComponentsProgram,
  publishComponentSource as publishComponentSourceProgram,
  updateComponent as updateComponentProgram,
} from './api';
import { type AmSessionDependencies, ComponentAuth, type ComponentAuthService } from './auth';
import { FileSync } from './file-sync';
import { ComponentPublisher, type ComponentPublisherService } from './publisher';
import { ComponentStore } from './records';
import { ComponentRepo } from './repo';

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

const adminAuthLayer = ComponentAuth.layer(adminDependencies);
const unauthenticatedLayer = ComponentAuth.layer(unauthenticatedDependencies);

const authorizedRequest = (url: string, init?: RequestInit): Request =>
  new Request(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: 'Bearer am-session-token' },
  });

const makeTemporaryDirectory = () =>
  Effect.tryPromise({
    try: () => mkdtemp(join(tmpdir(), 'api-')),
    catch: (cause) => cause,
  }).pipe(
    Effect.tap((directory) =>
      Effect.sync(() => {
        temporaryDirectories.push(directory);
      }),
    ),
  );

const testStoreLayer = (repoDir: string) => {
  const infrastructure = Layer.merge(NodeFileSystem.layer, FileSync.layerNoop);
  const repo = Layer.provide(
    ComponentRepo.layer({ repoDir, trackedSubpath: 'config' }),
    infrastructure,
  );
  const store = Layer.provide(
    ComponentStore.layer({ repoDir, trackedSubpath: 'config' }),
    Layer.merge(infrastructure, repo),
  );
  return store;
};

const listComponents = (request: Request, type: string, layer: ReturnType<typeof testStoreLayer>) =>
  Effect.provide(listComponentsProgram(request, type), Layer.merge(layer, adminAuthLayer));

const getComponent = (
  request: Request,
  type: string,
  id: string,
  layer: ReturnType<typeof testStoreLayer>,
) => Effect.provide(getComponentProgram(request, type, id), Layer.merge(layer, adminAuthLayer));

const createComponent = (
  request: Request,
  type: string,
  layer: ReturnType<typeof testStoreLayer>,
  authLayer: Layer.Layer<ComponentAuthService> = adminAuthLayer,
) => Effect.provide(createComponentProgram(request, type), Layer.merge(layer, authLayer));

const updateComponent = (
  request: Request,
  type: string,
  id: string,
  layer: ReturnType<typeof testStoreLayer>,
) => Effect.provide(updateComponentProgram(request, type, id), Layer.merge(layer, adminAuthLayer));

const deleteComponent = (
  request: Request,
  type: string,
  id: string,
  layer: ReturnType<typeof testStoreLayer>,
) => Effect.provide(deleteComponentProgram(request, type, id), Layer.merge(layer, adminAuthLayer));

const publishComponentSource = (
  request: Request,
  layer: Layer.Layer<ComponentPublisherService, never, never>,
) => Effect.provide(publishComponentSourceProgram(request), Layer.merge(layer, adminAuthLayer));

afterEach(() =>
  Effect.gen(function* () {
    process.env.COMPONENT_API_ENABLED = 'true';
    yield* Effect.tryPromise({
      try: () =>
        Promise.all(
          temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
        ),
      catch: (cause) => cause,
    });
  }),
);

describe('Component Endpoint Handlers', () => {
  describe('listComponents', () => {
    it.effect('returns an empty array when no components exist', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* listComponents(
          authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
          'callbacks',
          testStoreLayer(repoDir),
        );
        expect(response.status).toBe(200);
        const body = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new Error('Failed to parse JSON'),
        });
        expect(body).toEqual([]);
      }),
    );

    it.effect('returns projected fields when fields query parameter is provided', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();

        // Create a component first
        yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
        );

        const request = authorizedRequest(
          'http://localhost/api/components/callbacks?fields=id,meta.name',
          { method: 'GET' },
        );
        const response = yield* listComponents(request, 'callbacks', testStoreLayer(repoDir));

        expect(response.status).toBe(200);
        const body = yield* Effect.tryPromise({
          try: () => response.json() as Promise<Array<unknown>>,
          catch: () => new Error('Failed to parse JSON'),
        });
        expect(Array.isArray(body)).toBe(true);
        if (Array.isArray(body) && body.length > 0) {
          const record = body[0] as Record<string, unknown>;
          expect('id' in record).toBe(true);
          expect('meta' in record).toBe(true);
          const meta = record.meta as Record<string, unknown>;
          expect('name' in meta).toBe(true);
          expect('src' in record).toBe(false);
        }
      }),
    );

    it.effect('returns 400 for invalid fields parameter', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const request = authorizedRequest(
          'http://localhost/api/components/callbacks?fields=..invalid',
          {
            method: 'GET',
          },
        );
        const response = yield* listComponents(request, 'callbacks', testStoreLayer(repoDir));
        expect(response.status).toBe(400);
      }),
    );

    it.effect('returns 404 for invalid component type', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* listComponents(
          authorizedRequest('http://localhost/api/components/invalid-type', { method: 'GET' }),
          'invalid-type',
          testStoreLayer(repoDir),
        );
        expect(response.status).toBe(404);
      }),
    );
  });

  describe('getComponent', () => {
    it.effect('returns a component by id', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();

        // Create first
        const createResponse = yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
        );

        const createData = yield* Effect.tryPromise({
          try: () => createResponse.json() as Promise<{ id: string }>,
          catch: () => new Error('Failed to parse JSON'),
        });
        const id = createData.id;

        const getResponse = yield* getComponent(
          authorizedRequest(`http://localhost/api/components/callbacks/${id}`, {
            method: 'GET',
          }),
          'callbacks',
          id,
          testStoreLayer(repoDir),
        );
        expect(getResponse.status).toBe(200);
      }),
    );

    it.effect('returns 404 for missing component', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* getComponent(
          authorizedRequest(
            'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
            { method: 'GET' },
          ),
          'callbacks',
          'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          testStoreLayer(repoDir),
        );
        expect(response.status).toBe(404);
      }),
    );
  });

  describe('createComponent', () => {
    it.effect('creates a component and returns 201', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
        );
        expect(response.status).toBe(201);
      }),
    );

    it.effect('returns 401 when the session is not authenticated', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
          unauthenticatedLayer,
        );
        expect(response.status).toBe(401);
      }),
    );

    it.effect('returns 401 without an authorization header', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* createComponent(
          new Request('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
          unauthenticatedLayer,
        );
        expect(response.status).toBe(401);
      }),
    );

    it.effect('returns 403 for an authenticated non-admin session', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const nonAdminLayer = ComponentAuth.layer({
          getUserId: () => Promise.resolve('regular-user'),
          getRoles: () => Promise.resolve(['ui-enduser']),
        });
        const response = yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
          nonAdminLayer,
        );
        expect(response.status).toBe(403);
      }),
    );

    it.effect('returns 404 for every handler when the API is disabled', () =>
      Effect.ensuring(
        Effect.gen(function* () {
          delete process.env.COMPONENT_API_ENABLED;
          const repoDir = yield* makeTemporaryDirectory();
          const list = yield* listComponents(
            authorizedRequest('http://localhost/api/components/callbacks', { method: 'GET' }),
            'callbacks',
            testStoreLayer(repoDir),
          );
          const create = yield* createComponent(
            authorizedRequest('http://localhost/api/components/callbacks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                src: 'test source',
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
            testStoreLayer(repoDir),
          );
          expect(list.status).toBe(404);
          expect(create.status).toBe(404);
        }),
        Effect.sync(() => {
          process.env.COMPONENT_API_ENABLED = 'true';
        }),
      ),
    );

    it.effect('returns 415 for invalid content-type', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
            body: 'test',
          }),
          'callbacks',
          testStoreLayer(repoDir),
        );
        expect(response.status).toBe(415);
      }),
    );
  });

  describe('updateComponent', () => {
    it.effect('updates a component and returns 200', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();

        const createResponse = yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
        );

        const createData = yield* Effect.tryPromise({
          try: () =>
            createResponse.json() as Promise<{
              id: string;
              meta: { createdDate: string; modifiedDate: string };
            }>,
          catch: () => new Error('Failed to parse JSON'),
        });

        const updateResponse = yield* updateComponent(
          authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
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
          createData.id,
          testStoreLayer(repoDir),
        );

        expect(updateResponse.status).toBe(200);

        const updateData = yield* Effect.tryPromise({
          try: () =>
            updateResponse.json() as Promise<{
              meta: { createdDate: string; modifiedDate: string };
            }>,
          catch: () => new Error('Failed to parse JSON'),
        });
        expect(updateData.meta.createdDate).toBe(createData.meta.createdDate);
        expect(updateData.meta.modifiedDate >= createData.meta.modifiedDate).toBe(true);
      }),
    );

    it.effect('returns 400 when body id does not match URL id', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* updateComponent(
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
          testStoreLayer(repoDir),
        );
        expect(response.status).toBe(400);
      }),
    );
  });

  describe('deleteComponent', () => {
    it.effect('deletes a component and returns 204', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();

        const createResponse = yield* createComponent(
          authorizedRequest('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              src: 'test source',
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
          testStoreLayer(repoDir),
        );

        const createData = yield* Effect.tryPromise({
          try: () => createResponse.json() as Promise<{ id: string }>,
          catch: () => new Error('Failed to parse JSON'),
        });

        const deleteResponse = yield* deleteComponent(
          authorizedRequest(`http://localhost/api/components/callbacks/${createData.id}`, {
            method: 'DELETE',
          }),
          'callbacks',
          createData.id,
          testStoreLayer(repoDir),
        );
        expect(deleteResponse.status).toBe(204);
      }),
    );

    it.effect('returns 404 for missing component', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* deleteComponent(
          authorizedRequest(
            'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
            { method: 'DELETE' },
          ),
          'callbacks',
          'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          testStoreLayer(repoDir),
        );
        expect(response.status).toBe(404);
      }),
    );
  });

  describe('publishComponentSource', () => {
    it.effect('publishes a component bundle and returns 200', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const fakePublisher = Layer.succeed(
          ComponentPublisher,
          ComponentPublisher.of({
            publishComponent: () => Effect.void,
          }),
        );

        const response = yield* publishComponentSource(
          authorizedRequest('http://localhost/api/components/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              code: 'bundle code',
              files: [{ path: 'test.js', content: 'test' }],
            }),
          }),
          Layer.merge(testStoreLayer(repoDir), fakePublisher),
        );
        expect(response.status).toBe(200);
        const result = yield* Effect.tryPromise({
          try: () => response.json() as Promise<{ id: string; url: string }>,
          catch: () => new Error('Failed to parse JSON'),
        });
        expect(result).toHaveProperty('id');
        expect(result.url).toBe('');
      }),
    );
  });
});
