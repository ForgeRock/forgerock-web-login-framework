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
vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));
import { ConfigProvider, Effect, Layer, Schema } from 'effect';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';

import { PublishRequestSchema } from '../api/api.schemas';
import { FileSync } from '../writer/file-sync';
import { ArtifactWriterError, Writer, WriterLive } from '../writer/writer';
import { Publish, PublishLive } from './publish';

const fileSyncNoop = Layer.succeed(FileSync, {
  fsync: () => Effect.void,
  fsyncDirectoryChain: () => Effect.void,
});
const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'publisher-'));
  temporaryDirectories.push(directory);
  return directory;
};

/** Encodes a publish request the way the API boundary does before the service sees it. */
const publishRequest = (code: string) => Schema.encodeSync(PublishRequestSchema)({ code });

/** The real publish pipeline over a temporary repository, with a no-op fsync. */
const publishLayer = (repoDir: string) => {
  const writerLayer = WriterLive.pipe(Layer.provide(fileSyncNoop));
  return PublishLive.pipe(
    Layer.provide(writerLayer),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
    Layer.provide(
      Layer.setConfigProvider(
        ConfigProvider.fromMap(new Map([['COMPONENT_CONFIG_DIR', join(repoDir, 'config')]])),
      ),
    ),
  );
};

/** The publish pipeline with a writer that always fails, for storage-failure tests. */
const failingWriterLayer = PublishLive.pipe(
  Layer.provide(
    Layer.succeed(Writer, {
      write: () => Effect.fail(new ArtifactWriterError({ message: 'disk unavailable' })),
    }),
  ),
);

const publishEffect = (body: ReturnType<typeof publishRequest>) =>
  Effect.flatMap(Publish, (publisher) => publisher.publish(body));

const readUtf8 = (path: string) => readFile(path, 'utf8');

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('PublishLive', () => {
  it.scoped('persists the bundle code as the entry file', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* publishEffect(publishRequest('console.log("e2e bundle");')).pipe(
        Effect.provide(publishLayer(repoDir)),
      );

      const bundle = yield* Effect.promise(() => readUtf8(join(repoDir, 'config', 'bundle.js')));
      expect(bundle).toBe('console.log("e2e bundle");');
    }),
  );

  it.scoped('reports storage failures with the storage error', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.either(
        publishEffect(publishRequest('{}')).pipe(Effect.provide(failingWriterLayer)),
      );
      expect(exit._tag).toBe('Left');
      if (exit._tag === 'Left') {
        expect(exit.left._tag).toBe('PublishStorageError');
        expect((exit.left as Error).message).toBe('Unable to persist component bundle');
      }
    }),
  );
});
