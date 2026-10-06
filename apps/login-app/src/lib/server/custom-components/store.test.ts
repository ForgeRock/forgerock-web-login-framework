/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Cause, Effect, Exit, Option } from 'effect';
import { Effect } from 'effect';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createArtifactWriter } from './artifact-writer';

import type { FileSyncService } from './component.types';

const fileSyncNoop: FileSyncService = { fsync: () => Effect.void };
import { createComponentStore } from './store';

import type { Effect as EffectType } from 'effect';

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

const makeStore = (repoDir: string, log: ComponentLogger = makeLog()) => {
  const writer = createArtifactWriter({ repoDir, trackedSubpath: 'config' }, fileSyncNoop);
  return createComponentStore({ repoDir, trackedSubpath: 'config' }, writer, fileSyncNoop, log);
};

/** Runs a store effect, failing the test when it errors. */
const unwrap = async <Value, Error_>(effect: EffectType.Effect<Value, Error_>): Promise<Value> => {
  const exit = await Effect.runPromiseExit(effect);
  if (Exit.isFailure(exit)) {
    throw new Error(
      `Expected a successful result, got: ${Option.getOrThrow(Cause.failureOption(exit.cause))}`,
    );
  }
  return exit.value;
};

/** Runs a store effect, failing the test when it succeeds. */
const unwrapError = async <Value>(
  effect: EffectType.Effect<Value, ComponentStoreError>,
): Promise<ComponentStoreError> => {
  const exit = await Effect.runPromiseExit(effect);
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

describe('createComponentStore', () => {
  it('creates and retrieves a component record', async () => {
    const repoDir = await makeTemporaryDirectory();
    const created = await unwrap(makeStore(repoDir).create('callbacks', request));
    const retrieved = await unwrap(makeStore(repoDir).get('callbacks', created.id));

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(created.meta.createdDate).toBe(created.meta.modifiedDate);
    expect(retrieved).toEqual(created);
  });

  it('lists created records', async () => {
    const repoDir = await makeTemporaryDirectory();
    const first = await unwrap(makeStore(repoDir).create('stages', request));
    const second = await unwrap(
      makeStore(repoDir).create('stages', {
        ...request,
        meta: { ...request.meta, name: 'second' },
      }),
    );

    expect(await unwrap(makeStore(repoDir).list('stages'))).toEqual(
      expect.arrayContaining([first, second]),
    );
  });

  it('returns NotFound for a missing component', async () => {
    const repoDir = await makeTemporaryDirectory();
    const error = await unwrapError(
      makeStore(repoDir).get('callbacks', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
    );

    expect(error.reason).toBe('NotFound');
  });

  it('updates a component while preserving its creation date', async () => {
    const repoDir = await makeTemporaryDirectory();
    const created = await unwrap(makeStore(repoDir).create('headers', request));
    const updated = await unwrap(
      makeStore(repoDir).update('headers', created.id, { ...request, src: 'updated source' }),
    );

    expect(updated.meta.createdDate).toBe(created.meta.createdDate);
    expect(updated.meta.modifiedDate >= created.meta.modifiedDate).toBe(true);
    expect(updated.src).toBe('updated source');
  });

  it('returns NotFound when updating a missing component', async () => {
    const repoDir = await makeTemporaryDirectory();
    const error = await unwrapError(
      makeStore(repoDir).update('footers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0', request),
    );

    expect(error.reason).toBe('NotFound');
  });

  it('deletes a component record', async () => {
    const repoDir = await makeTemporaryDirectory();
    const created = await unwrap(makeStore(repoDir).create('containers', request));
    await unwrap(makeStore(repoDir).remove('containers', created.id));
    const error = await unwrapError(makeStore(repoDir).get('containers', created.id));

    expect(error.reason).toBe('NotFound');
  });

  it('returns NotFound when deleting a missing component', async () => {
    const repoDir = await makeTemporaryDirectory();
    const error = await unwrapError(
      makeStore(repoDir).remove('containers', 'd677e9a2-9ea5-4fc9-a7db-8668468a91c0'),
    );

    expect(error.reason).toBe('NotFound');
  });

  it('skips malformed artifacts while listing valid records, warning with the path only', async () => {
    const repoDir = await makeTemporaryDirectory();
    const log = makeLog();
    const created = await unwrap(makeStore(repoDir, log).create('callbacks', request));
    await writeFile(join(repoDir, 'config', 'callbacks', 'malformed.json'), '{bad json');

    expect(await unwrap(makeStore(repoDir, log).list('callbacks'))).toEqual([created]);
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith('[components] skipped unreadable record', {
      path: 'callbacks/malformed.json',
    });
  });
});
