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
import { mkdir, mkdtemp, readdir, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';

import { FileSync, FileSyncError, Writer, WriterLive } from './writer';

const fileSyncNoop = Layer.succeed(FileSync, { fsync: () => Effect.void });

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'repo-'));
  temporaryDirectories.push(directory);
  return directory;
};

/** The real Node-backed writer over a temporary tracked root, with a no-op fsync. */
const writerLayer = (repoDir: string) =>
  WriterLive({ trackedRoot: join(repoDir, 'config') }).pipe(
    Layer.provide(fileSyncNoop),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
  );

const saveEffect = (relPath: string, content: string) =>
  Effect.flatMap(Writer, (writer) => writer.write([{ relPath, content }]));

const readUtf8 = (path: string) => readFile(path, 'utf8');

const readDirectory = (path: string) => readdir(path);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('WriterLive', () => {
  it.scoped('writes a component below the tracked repository subpath', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* saveEffect('journeys/login.json', '{"journey":"login"}').pipe(
        Effect.provide(writerLayer(repoDir)),
      );

      const written = yield* Effect.promise(() =>
        readUtf8(join(repoDir, 'config', 'journeys', 'login.json')),
      );
      expect(written).toBe('{"journey":"login"}');
    }),
  );

  for (const relPath of [
    '../outside.json',
    '/outside.json',
    '.git/config',
    'journeys/.git/config',
    '\\outside.json',
    '',
  ]) {
    it.scoped(`rejects unsafe relative path ${relPath}`, () =>
      Effect.gen(function* () {
        const repoDir = yield* Effect.promise(makeTemporaryDirectory);
        const exit = yield* Effect.either(
          saveEffect(relPath, '{}').pipe(Effect.provide(writerLayer(repoDir))),
        );
        if (exit._tag === 'Right') {
          throw new Error('Expected the save to fail');
        }
        const failure = exit.left as Error;
        expect(failure.message).toMatch(/unsafe component path/i);
      }),
    );
  }

  it.scoped('atomically swaps complete component content for concurrent readers', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const run = (relPath: string, content: string) =>
        saveEffect(relPath, content).pipe(Effect.provide(writerLayer(repoDir)));
      const destination = join(repoDir, 'config', 'journeys', 'login.json');
      const oldContent = JSON.stringify({ version: 'old', payload: 'a'.repeat(50_000) });
      const newContents = Array.from({ length: 25 }, (_, version) =>
        JSON.stringify({ version, payload: String(version).repeat(50_000) }),
      );

      yield* run('journeys/login.json', oldContent);

      const observed = new Set<string>();
      let writing = true;
      const reader = (async () => {
        while (writing) {
          observed.add(await readFile(destination, 'utf8'));
        }
      })();

      for (const content of newContents) {
        yield* Effect.promise(() => run('journeys/login.json', content).pipe(Effect.runPromise));
      }
      writing = false;
      yield* Effect.promise(() => reader);

      const allowed = new Set([oldContent, ...newContents]);
      for (const content of observed) {
        expect(allowed.has(content)).toBe(true);
        expect(Schema.decodeUnknownSync(Schema.parseJson())(content)).toHaveProperty('payload');
      }
    }),
  );

  it.scoped('rejects a symlinked directory segment inside the tracked root', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* Effect.promise(() => mkdir(join(repoDir, 'config', 'journeys'), { recursive: true }));
      yield* Effect.promise(() =>
        symlink('/etc/hosts', join(repoDir, 'config', 'journeys', 'escape')),
      );
      const exit = yield* Effect.either(
        saveEffect('journeys/escape/login.json', '{}').pipe(Effect.provide(writerLayer(repoDir))),
      );
      if (exit._tag === 'Right') {
        throw new Error('Expected the save to fail');
      }
      expect((exit.left as Error).message).toMatch(/symlink/i);
      const escaped = yield* Effect.either(Effect.promise(() => readFile('/etc/hosts', 'utf8')));
      expect(escaped._tag).toBe('Right');
    }),
  );

  it.scoped('removes the temporary file after a successful atomic rename', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* saveEffect('journeys/login.json', '{}').pipe(Effect.provide(writerLayer(repoDir)));

      const entries = yield* Effect.promise(() =>
        readDirectory(join(repoDir, 'config', 'journeys')),
      );
      expect(entries).toEqual(['login.json']);
    }),
  );

  it.scoped('validates every artifact before creating temporary files', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const exit = yield* Effect.either(
        Effect.flatMap(Writer, (writer) =>
          writer.write([
            { relPath: 'journeys/login.json', content: '{}' },
            { relPath: '../outside.json', content: '{}' },
          ]),
        ).pipe(Effect.provide(writerLayer(repoDir))),
      );
      expect(exit._tag).toBe('Left');
      const entries = yield* Effect.promise(() => readDirectory(repoDir));
      expect(entries).toEqual([]);
    }),
  );

  it.scoped('reports duplicate paths as caller bugs', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const exit = yield* Effect.either(
        Effect.flatMap(Writer, (writer) =>
          writer.write([
            { relPath: 'same.json', content: 'a' },
            { relPath: 'same.json', content: 'b' },
          ]),
        ).pipe(Effect.provide(writerLayer(repoDir))),
      );
      expect(exit._tag).toBe('Left');
    }),
  );

  it.scoped('removes staged temporary files when a later rename fails', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const trackedRoot = join(repoDir, 'config');
      const exit = yield* Effect.either(
        Effect.flatMap(Writer, (writer) =>
          writer.write([
            { relPath: 'a.json', content: 'a' },
            { relPath: 'b.json', content: 'b' },
          ]),
        ).pipe(
          Effect.provide(
            // Fail one rename so the error path after staging runs; the cleanup
            // must leave no .tmp files behind for config-saver to commit.
            WriterLive({ trackedRoot }).pipe(
              Layer.provide(
                Layer.succeed(FileSync, {
                  fsync: (path: string) =>
                    path.endsWith('b.json.tmp') || /\.b\.json\..+\.tmp$/.test(path)
                      ? Effect.fail(new FileSyncError({ message: 'forced fsync failure' }))
                      : Effect.void,
                }),
              ),
              Layer.provide(NodeFileSystem.layer),
              Layer.provide(Path.layer),
            ),
          ),
        ),
      );
      expect(exit._tag).toBe('Left');
      const entries = yield* Effect.promise(() => readDirectory(join(trackedRoot)));
      expect(entries.every((entry) => !entry.includes('.tmp'))).toBe(true);
    }),
  );
});
