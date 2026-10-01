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
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ComponentRepo, FileSync } from './component-repo';
import { ComponentStore } from './component-store';

import type { ComponentStoreError } from './component-store';

const temporaryDirectories: string[] = [];

const request = {
  src: '<script>export let name;</script>',
  json: { field: 'value' },
  meta: {
    name: 'example',
    displayName: 'Example',
    publish: false,
    fromComponent: '',
    fromJson: '',
  },
};

const makeTemporaryDirectory = () =>
  Effect.tryPromise({
    try: () => mkdtemp(join(tmpdir(), 'component-store-')),
    catch: (cause) => cause,
  }).pipe(
    Effect.tap((directory) =>
      Effect.sync(() => {
        temporaryDirectories.push(directory);
      }),
    ),
  );

const storeLayer = (repoDir: string) => {
  const infrastructure = Layer.merge(NodeFileSystem.layer, FileSync.layerNoop);
  const repo = Layer.provide(
    ComponentRepo.layer({ repoDir, trackedSubpath: 'config' }),
    infrastructure,
  );
  return Layer.provide(
    ComponentStore.layer({ repoDir, trackedSubpath: 'config' }),
    Layer.merge(infrastructure, repo),
  );
};

const withStore = <A>(
  repoDir: string,
  use: (store: typeof ComponentStore.Service) => Effect.Effect<A, ComponentStoreError>,
) => Effect.provide(Effect.flatMap(ComponentStore, use), storeLayer(repoDir));

afterEach(() =>
  Effect.tryPromise({
    try: () =>
      Promise.all(
        temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
      ),
    catch: (cause) => cause,
  }),
);

describe('ComponentStore', () => {
  it.effect('creates and retrieves a component record', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const created = yield* withStore(repoDir, (store) => store.create('callbacks', request));
      const retrieved = yield* withStore(repoDir, (store) => store.get('callbacks', created.id));

      expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(created.meta.createdDate).toBe(created.meta.modifiedDate);
      expect(retrieved).toEqual(created);
    }),
  );

  it.effect('lists created records', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const first = yield* withStore(repoDir, (store) => store.create('stages', request));
      const second = yield* withStore(repoDir, (store) =>
        store.create('stages', { ...request, meta: { ...request.meta, name: 'second' } }),
      );

      expect(yield* withStore(repoDir, (store) => store.list('stages'))).toEqual(
        expect.arrayContaining([first, second]),
      );
    }),
  );

  it.effect('returns NotFound for a missing component', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const result = yield* Effect.either(
        withStore(repoDir, (store) =>
          store.get('callbacks', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
        ),
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') expect(result.left.reason).toBe('NotFound');
    }),
  );

  it.effect('updates a component while preserving its creation date', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const created = yield* withStore(repoDir, (store) => store.create('headers', request));
      const updated = yield* withStore(repoDir, (store) =>
        store.update('headers', created.id, { ...request, src: 'updated source' }),
      );

      expect(updated.meta.createdDate).toBe(created.meta.createdDate);
      expect(updated.meta.modifiedDate >= created.meta.modifiedDate).toBe(true);
      expect(updated.src).toBe('updated source');
    }),
  );

  it.effect('returns NotFound when updating a missing component', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const result = yield* Effect.either(
        withStore(repoDir, (store) =>
          store.update('footers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0', request),
        ),
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') expect(result.left.reason).toBe('NotFound');
    }),
  );

  it.effect('deletes a component record', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const created = yield* withStore(repoDir, (store) => store.create('containers', request));
      yield* withStore(repoDir, (store) => store.delete('containers', created.id));
      const result = yield* Effect.either(
        withStore(repoDir, (store) => store.get('containers', created.id)),
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') expect(result.left.reason).toBe('NotFound');
    }),
  );

  it.effect('returns NotFound when deleting a missing component', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const result = yield* Effect.either(
        withStore(repoDir, (store) =>
          store.delete('containers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
        ),
      );

      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') expect(result.left.reason).toBe('NotFound');
    }),
  );

  it.effect('rejects invalid types and ids defensively', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const invalidType = yield* Effect.either(
        withStore(repoDir, (store) => store.list('../callbacks')),
      );
      const invalidId = yield* Effect.either(
        withStore(repoDir, (store) => store.get('callbacks', '../record')),
      );

      expect(invalidType._tag).toBe('Left');
      expect(invalidId._tag).toBe('Left');
      if (invalidType._tag === 'Left') expect(invalidType.left.reason).toBe('InvalidType');
      if (invalidId._tag === 'Left') expect(invalidId.left.reason).toBe('InvalidId');
    }),
  );

  it.effect('silently skips malformed artifacts while listing valid records', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const created = yield* withStore(repoDir, (store) => store.create('callbacks', request));
      yield* Effect.tryPromise({
        try: () => writeFile(join(repoDir, 'config', 'callbacks', 'malformed.json'), '{bad json'),
        catch: (cause) => cause,
      });

      expect(yield* withStore(repoDir, (store) => store.list('callbacks'))).toEqual([created]);
    }),
  );
});
