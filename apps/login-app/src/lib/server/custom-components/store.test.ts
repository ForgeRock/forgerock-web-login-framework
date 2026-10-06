/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Cause, Effect, Exit, Layer, Option, Runtime } from 'effect';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { joinPath, WriterLive } from './artifact-writer';
import { FileSync, Log, Store } from './component.types';
import { StoreLive } from './store';

import type { ComponentLogger, ComponentStoreError } from './component.types';

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

const fileSyncNoop = Layer.succeed(FileSync, { fsync: () => Effect.void });

/** Builds the real store over a temporary repository with a no-op fsync and a given log. */
const makeStore = async (repoDir: string, log: ComponentLogger = makeLog()) => {
  const layer = StoreLive({ trackedRoot: joinPath(repoDir, 'config') }).pipe(
    Layer.provide(WriterLive({ trackedRoot: joinPath(repoDir, 'config') })),
    Layer.provide(fileSyncNoop),
    Layer.provide(Layer.succeed(Log, log)),
  );
  return Effect.runPromise(Layer.toRuntime(layer).pipe(Effect.scoped));
};

/** Runs a store operation against a test runtime, failing the test when it errors. */
const unwrap = async <Value>(
  runtime: Runtime.Runtime<Store>,
  effect: Effect.Effect<Value, ComponentStoreError, Store>,
): Promise<Value> => {
  const exit = await Runtime.runPromiseExit(runtime)(effect);
  if (Exit.isFailure(exit)) {
    throw new Error(
      `Expected a successful result, got: ${Option.getOrThrow(Cause.failureOption(exit.cause))}`,
    );
  }
  return exit.value;
};

/** Runs a store operation against a test runtime, failing the test when it succeeds. */
const unwrapError = async <Value>(
  runtime: Runtime.Runtime<Store>,
  effect: Effect.Effect<Value, ComponentStoreError, Store>,
): Promise<ComponentStoreError> => {
  const exit = await Runtime.runPromiseExit(runtime)(effect);
  if (Exit.isSuccess(exit)) {
    throw new Error('Expected the operation to fail');
  }
  return Option.getOrThrow(Cause.failureOption(exit.cause)) as ComponentStoreError;
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('StoreLive', () => {
  it('creates and retrieves a component record', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makeStore(repoDir);
    const created = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) => store.create('callbacks', request)),
    );
    const retrieved = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) => store.get('callbacks', created.id)),
    );

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(created.meta.createdDate).toBe(created.meta.modifiedDate);
    expect(retrieved).toEqual(created);
  });

  it('lists created records', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makeStore(repoDir);
    const first = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) => store.create('stages', request)),
    );
    const second = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) =>
        store.create('stages', { ...request, meta: { ...request.meta, name: 'second' } }),
      ),
    );

    expect(
      await unwrap(
        runtime,
        Effect.flatMap(Store, (store) => store.list('stages')),
      ),
    ).toEqual(expect.arrayContaining([first, second]));
  });

  it('returns NotFound for a missing component', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makeStore(repoDir);
    const error = await unwrapError(
      runtime,
      Effect.flatMap(Store, (store) =>
        store.get('callbacks', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
      ),
    );

    expect(error.reason).toBe('NotFound');
  });

  it('updates a component while preserving its creation date', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makeStore(repoDir);
    const created = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) => store.create('headers', request)),
    );
    const updated = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) =>
        store.update('headers', created.id, { ...request, src: 'updated source' }),
      ),
    );

    expect(updated.meta.createdDate).toBe(created.meta.createdDate);
    expect(updated.meta.modifiedDate >= created.meta.modifiedDate).toBe(true);
    expect(updated.src).toBe('updated source');
  });

  it('returns NotFound when updating a missing component', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makeStore(repoDir);
    const error = await unwrapError(
      runtime,
      Effect.flatMap(Store, (store) =>
        store.update('footers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0', request),
      ),
    );

    expect(error.reason).toBe('NotFound');
  });

  it('deletes a component record', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makeStore(repoDir);
    const created = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) => store.create('containers', request)),
    );
    await unwrap(
      runtime,
      Effect.flatMap(Store, (store) => store.remove('containers', created.id)),
    );
    const error = await unwrapError(
      runtime,
      Effect.flatMap(Store, (store) => store.get('containers', created.id)),
    );

    expect(error.reason).toBe('NotFound');
  });

  it('returns NotFound when deleting a missing component', async () => {
    const repoDir = await makeTemporaryDirectory();
    const runtime = await makeStore(repoDir);
    const error = await unwrapError(
      runtime,
      Effect.flatMap(Store, (store) =>
        store.remove('containers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
      ),
    );

    expect(error.reason).toBe('NotFound');
  });

  it('skips malformed artifacts while listing valid records, warning with the path only', async () => {
    const repoDir = await makeTemporaryDirectory();
    const log = makeLog();
    const runtime = await makeStore(repoDir, log);
    const created = await unwrap(
      runtime,
      Effect.flatMap(Store, (store) => store.create('callbacks', request)),
    );
    await writeFile(join(repoDir, 'config', 'callbacks', 'malformed.json'), '{bad json');

    expect(
      await unwrap(
        runtime,
        Effect.flatMap(Store, (store) => store.list('callbacks')),
      ),
    ).toEqual([created]);
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('[components] skipped unreadable record', {
      path: 'callbacks/malformed.json',
    });
  });
});
