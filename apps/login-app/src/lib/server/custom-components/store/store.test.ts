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
import { it as itEffect } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';

import { type ComponentLogger, Log } from '../shared';
import { FileSync, WriterLive } from '../writer/writer';
import { Store, StoreLive } from './store';

const fileSyncNoop = Layer.succeed(FileSync, { fsync: () => Effect.void });

const logLayer = Layer.succeed(Log, {
  error: () => undefined,
  warn: () => undefined,
  info: () => undefined,
});

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

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'records-'));
  temporaryDirectories.push(directory);
  return directory;
};

const makeLog = (): ComponentLogger => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() });

/** Builds the real store over a temporary repository with a no-op fsync and a given log. */
const storeLayer = (repoDir: string, log: ComponentLogger) => {
  const writerLayer = WriterLive({ trackedRoot: join(repoDir, 'config') }).pipe(
    Layer.provide(fileSyncNoop),
  );
  return StoreLive({ trackedRoot: join(repoDir, 'config') }).pipe(
    Layer.provide(writerLayer),
    Layer.provide(fileSyncNoop),
    Layer.provide(log ? Layer.succeed(Log, log) : logLayer),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
  );
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('StoreLive', () => {
  itEffect.effect('creates and retrieves a component record', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const log = makeLog();
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const created = yield* store.create('callbacks', request);
        const retrieved = yield* store.get('callbacks', created.id);

        expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(created.meta.createdDate).toBe(created.meta.modifiedDate);
        expect(retrieved).toEqual(created);
      });
      yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, log)));
    }),
  );

  itEffect.effect('lists created records', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const first = yield* store.create('stages', request);
        const second = yield* store.create('stages', {
          ...request,
          meta: { ...request.meta, name: 'second' },
        });
        const listed = yield* store.list('stages');
        expect(listed).toEqual(expect.arrayContaining([first, second]));
      });
      yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, makeLog())));
    }),
  );

  itEffect.effect('returns NotFound for a missing component', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const error = yield* Effect.flip(
          store.get('callbacks', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
        );
        expect(error._tag).toBe('StoreNotFoundError');
      });
      yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, makeLog())));
    }),
  );

  itEffect.effect('updates a component while preserving its creation date', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const created = yield* store.create('headers', request);
        const updated = yield* store.update('headers', created.id, {
          ...request,
          src: 'updated source',
        });

        expect(updated.meta.createdDate).toBe(created.meta.createdDate);
        expect(updated.meta.modifiedDate >= created.meta.modifiedDate).toBe(true);
        expect(updated.src).toBe('updated source');
      });
      yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, makeLog())));
    }),
  );

  itEffect.effect('returns NotFound when updating a missing component', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const error = yield* Effect.flip(
          store.update('footers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0', request),
        );
        expect(error._tag).toBe('StoreNotFoundError');
      });
      yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, makeLog())));
    }),
  );

  itEffect.effect('deletes a component record', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const created = yield* store.create('containers', request);
        yield* store.remove('containers', created.id);
        const error = yield* Effect.flip(store.get('containers', created.id));
        expect(error._tag).toBe('StoreNotFoundError');
      });
      yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, makeLog())));
    }),
  );

  itEffect.effect('returns NotFound when deleting a missing component', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const program = Effect.gen(function* () {
        const store = yield* Store;
        const error = yield* Effect.flip(
          store.remove('containers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
        );
        expect(error._tag).toBe('StoreNotFoundError');
      });
      yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, makeLog())));
    }),
  );

  itEffect.effect(
    'skips malformed artifacts while listing valid records, warning with the path only',
    () =>
      Effect.gen(function* () {
        const repoDir = yield* Effect.promise(makeTemporaryDirectory);
        const log = makeLog();
        const program = Effect.gen(function* () {
          const store = yield* Store;
          const created = yield* store.create('callbacks', request);
          yield* Effect.promise(() =>
            writeFile(join(repoDir, 'config', 'callbacks', 'malformed.json'), '{bad json'),
          );
          const listed = yield* store.list('callbacks');

          expect(listed).toEqual([created]);
        });
        yield* Effect.scoped(Effect.provide(program, storeLayer(repoDir, log)));

        expect(log.warn).toHaveBeenCalledTimes(1);
        expect(log.warn).toHaveBeenCalledWith('[components] skipped unreadable record', {
          path: 'callbacks/malformed.json',
        });
      }),
  );
});
