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

import {
  createComponent,
  deleteComponent,
  getComponent,
  listComponents,
  publishComponentSource,
  updateComponent,
} from './component-endpoint';
import { ComponentPublisher } from './component-publisher';
import { ComponentRepo, FileSync } from './component-repo';
import { ComponentStore } from './component-store';

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = () =>
  Effect.tryPromise({
    try: () => mkdtemp(join(tmpdir(), 'component-endpoint-')),
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

afterEach(() =>
  Effect.tryPromise({
    try: () =>
      Promise.all(
        temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
      ),
    catch: (cause) => cause,
  }),
);

describe('Component Endpoint Handlers', () => {
  describe('listComponents', () => {
    it.effect('returns an empty array when no components exist', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* listComponents(
          new Request('http://localhost/api/components/callbacks', { method: 'GET' }),
          'callbacks',
          { runtime: testStoreLayer(repoDir) },
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
          { runtime: testStoreLayer(repoDir) },
        );

        const request = new Request(
          'http://localhost/api/components/callbacks?fields=id,meta.name',
          { method: 'GET' },
        );
        const response = yield* listComponents(request, 'callbacks', {
          runtime: testStoreLayer(repoDir),
        });

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
        const request = new Request('http://localhost/api/components/callbacks?fields=..invalid', {
          method: 'GET',
        });
        const response = yield* listComponents(request, 'callbacks', {
          runtime: testStoreLayer(repoDir),
        });
        expect(response.status).toBe(400);
      }),
    );

    it.effect('returns 404 for invalid component type', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* listComponents(
          new Request('http://localhost/api/components/invalid-type', { method: 'GET' }),
          'invalid-type',
          { runtime: testStoreLayer(repoDir) },
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
          { runtime: testStoreLayer(repoDir) },
        );

        const createData = yield* Effect.tryPromise({
          try: () => createResponse.json() as Promise<{ id: string }>,
          catch: () => new Error('Failed to parse JSON'),
        });
        const id = createData.id;

        const getResponse = yield* getComponent(
          new Request(`http://localhost/api/components/callbacks/${id}`, {
            method: 'GET',
          }),
          'callbacks',
          id,
          { runtime: testStoreLayer(repoDir) },
        );
        expect(getResponse.status).toBe(200);
      }),
    );

    it.effect('returns 404 for missing component', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* getComponent(
          new Request(
            'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
            { method: 'GET' },
          ),
          'callbacks',
          'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          { runtime: testStoreLayer(repoDir) },
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
          { runtime: testStoreLayer(repoDir) },
        );
        expect(response.status).toBe(201);
      }),
    );

    it.effect('returns 401 without valid token when token is configured', () =>
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
          { runtime: testStoreLayer(repoDir), token: 'secret-token' },
        );
        expect(response.status).toBe(401);
      }),
    );

    it.effect('returns 415 for invalid content-type', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* createComponent(
          new Request('http://localhost/api/components/callbacks', {
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
            body: 'test',
          }),
          'callbacks',
          { runtime: testStoreLayer(repoDir) },
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
          { runtime: testStoreLayer(repoDir) },
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
          new Request(`http://localhost/api/components/callbacks/${createData.id}`, {
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
          { runtime: testStoreLayer(repoDir) },
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
          new Request('http://localhost/api/components/callbacks/different-uuid', {
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
          { runtime: testStoreLayer(repoDir) },
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
          { runtime: testStoreLayer(repoDir) },
        );

        const createData = yield* Effect.tryPromise({
          try: () => createResponse.json() as Promise<{ id: string }>,
          catch: () => new Error('Failed to parse JSON'),
        });

        const deleteResponse = yield* deleteComponent(
          new Request(`http://localhost/api/components/callbacks/${createData.id}`, {
            method: 'DELETE',
          }),
          'callbacks',
          createData.id,
          { runtime: testStoreLayer(repoDir) },
        );
        expect(deleteResponse.status).toBe(204);
      }),
    );

    it.effect('returns 404 for missing component', () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const response = yield* deleteComponent(
          new Request(
            'http://localhost/api/components/callbacks/d677e9a2-9ea5-4fc9-a7db-8668468a91c0',
            { method: 'DELETE' },
          ),
          'callbacks',
          'd677e9a2-9ea5-4fc9-a7db-8668468a91c0',
          { runtime: testStoreLayer(repoDir) },
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
          new Request('http://localhost/api/components/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              code: 'bundle code',
              files: [{ path: 'test.js', content: 'test' }],
            }),
          }),
          { runtime: Layer.merge(testStoreLayer(repoDir), fakePublisher) },
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
