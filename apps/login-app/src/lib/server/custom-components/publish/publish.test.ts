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
import { Effect, Layer } from 'effect';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';

import { ArtifactWriterError, FileSync, Writer, WriterLive } from '../writer/writer';
import { parseBundle, Publish, PublishLive } from './publish';

const fileSyncNoop = Layer.succeed(FileSync, { fsync: () => Effect.void });

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'publisher-'));
  temporaryDirectories.push(directory);
  return directory;
};

/** The real publish pipeline over a temporary repository, with a no-op fsync. */
const publishLayer = (repoDir: string) => {
  const writerLayer = WriterLive({ trackedRoot: join(repoDir, 'config') }).pipe(
    Layer.provide(fileSyncNoop),
  );
  return PublishLive.pipe(
    Layer.provide(writerLayer),
    Layer.provide(fileSyncNoop),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
  );
};

/** The publish pipeline with a writer that always fails, for storage-failure tests. */
const failingWriterLayer = PublishLive.pipe(
  Layer.provide(
    Layer.succeed(Writer, () =>
      Effect.fail(new ArtifactWriterError({ message: 'disk unavailable' })),
    ),
  ),
);

const publishEffect = (bundle: string) => Effect.flatMap(Publish, (publish) => publish(bundle));

const readUtf8 = (path: string) => readFile(path, 'utf8');

const readDirectory = (path: string) => readdir(path);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('parseBundle', () => {
  it.effect('parses file entries and ignores unknown fields', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.either(
        parseBundle(
          '{"files":[{"path":"journeys/login.json","content":"{}","ignored":true}],"ignored":true}',
        ),
      );
      expect(exit._tag).toBe('Right');
      if (exit._tag === 'Right') {
        expect(exit.right).toEqual([{ relPath: 'journeys/login.json', content: '{}' }]);
      }
    }),
  );

  for (const bundle of [
    'not json',
    '{}',
    '{"files":[{}]}',
    '{"files":[{"path":"journeys/login.json"}]}',
    '{"files":[{"path":"../outside.json","content":"{}"}]}',
    '{"files":[{"path":".git/config","content":"{}"}]}',
  ]) {
    it.effect(`rejects invalid bundle ${bundle}`, () =>
      Effect.gen(function* () {
        const exit = yield* Effect.either(parseBundle(bundle));
        expect(exit._tag).toBe('Left');
        if (exit._tag === 'Left') {
          const failure = exit.left as Error;
          expect(failure.message).toMatch(/bundle|unsafe path/i);
        }
      }),
    );
  }
});

describe('PublishLive', () => {
  it.scoped('publishes every bundle file through the component repo', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* publishEffect(
        '{"files":[{"path":"journeys/login.json","content":"{\\"journey\\":\\"login\\"}"},{"path":"themes/main.json","content":"{}"}]}',
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
          '{"files":[{"path":"journeys/login.json","content":"{}"},{"path":"../outside.json","content":"{}"}]}',
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

  it.scoped('reports storage failures with the storage error', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.either(
        publishEffect('{"files":[{"path":"bundle.js","content":"{}"}]}').pipe(
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
