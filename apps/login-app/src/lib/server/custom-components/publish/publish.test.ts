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
import { Effect, Layer, Schema } from 'effect';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';

import { PublishRequestSchema } from '../api.schemas';
import { type ComponentLogger, Log } from '../shared';
import { ArtifactWriterError, FileSync, Writer, WriterLive } from '../writer/writer';
import { Publish, PublishLive } from './publish';

const fileSyncNoop = Layer.succeed(FileSync, { fsync: () => Effect.void });
const makeLog = (): ComponentLogger => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() });
const logNoop = Layer.succeed(Log, makeLog());

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'publisher-'));
  temporaryDirectories.push(directory);
  return directory;
};

/** Encodes a publish request the way the API boundary does before the service sees it. */
const publishRequest = (files: Array<{ path: string; content: string }>) =>
  Schema.encodeSync(PublishRequestSchema)({ code: '', files });

/** The real publish pipeline over a temporary repository, with a no-op fsync and logger. */
const publishLayer = (repoDir: string) => {
  const writerLayer = WriterLive({ trackedRoot: join(repoDir, 'config') }).pipe(
    Layer.provide(fileSyncNoop),
  );
  return PublishLive.pipe(
    Layer.provide(writerLayer),
    Layer.provide(fileSyncNoop),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
    Layer.provide(logNoop),
  );
};

/** The publish pipeline with a writer that always fails, for storage-failure tests. */
const failingWriterLayer = PublishLive.pipe(
  Layer.provide(
    Layer.succeed(Writer, {
      write: () => Effect.fail(new ArtifactWriterError({ message: 'disk unavailable' })),
    }),
  ),
  Layer.provide(logNoop),
);

const publishEffect = (body: ReturnType<typeof publishRequest>) =>
  Effect.flatMap(Publish, (publisher) => publisher.publish(body));

const readUtf8 = (path: string) => readFile(path, 'utf8');

const readDirectory = (path: string) => readdir(path);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('PublishLive', () => {
  it.scoped('publishes every request file through the component repo', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* publishEffect(
        publishRequest([
          { path: 'journeys/login.json', content: '{"journey":"login"}' },
          { path: 'themes/main.json', content: '{}' },
        ]),
      ).pipe(Effect.provide(publishLayer(repoDir)));

      const login = yield* Effect.promise(() =>
        readUtf8(join(repoDir, 'config', 'journeys', 'login.json')),
      );
      expect(login).toBe('{"journey":"login"}');
      const theme = yield* Effect.promise(() =>
        readUtf8(join(repoDir, 'config', 'themes', 'main.json')),
      );
      expect(theme).toBe('{}');
    }),
  );

  it.scoped('validates all artifacts before writing any file', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const exit = yield* Effect.either(
        publishEffect(
          publishRequest([
            { path: 'journeys/login.json', content: '{}' },
            { path: '../outside.json', content: '{}' },
          ]),
        ).pipe(Effect.provide(publishLayer(repoDir))),
      );
      expect(exit._tag).toBe('Left');
      if (exit._tag === 'Left') {
        expect(exit.left._tag).toBe('PublishInvalidError');
      }
      const entries = yield* Effect.promise(() => readDirectory(repoDir));
      expect(entries).toEqual([]);
    }),
  );

  it.scoped('rejects a client file that collides with the bundle entry path', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const exit = yield* Effect.either(
        publishEffect(publishRequest([{ path: 'bundle.js', content: '{}' }])).pipe(
          Effect.provide(publishLayer(repoDir)),
        ),
      );
      expect(exit._tag).toBe('Left');
      if (exit._tag === 'Left') {
        expect(exit.left._tag).toBe('PublishInvalidError');
        expect((exit.left as Error).message).toMatch(/duplicate/i);
      }
      const entries = yield* Effect.promise(() => readDirectory(repoDir));
      expect(entries).toEqual([]);
    }),
  );

  it.scoped('reports storage failures with the storage error', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.either(
        publishEffect(publishRequest([{ path: 'a.json', content: '{}' }])).pipe(
          Effect.provide(failingWriterLayer),
        ),
      );
      expect(exit._tag).toBe('Left');
      if (exit._tag === 'Left') {
        expect(exit.left._tag).toBe('PublishStorageError');
        expect((exit.left as Error).message).toBe('Unable to persist component bundle');
      }
    }),
  );
});
