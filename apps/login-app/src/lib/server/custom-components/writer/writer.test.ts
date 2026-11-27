/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { it } from '@effect/vitest';
vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));
import { ConfigProvider, Effect, Layer, Schema } from 'effect';
import { mkdir, mkdtemp, readdir, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';

import { FileSync, FileSyncError } from './file-sync';
import { Writer, WriterLive } from './writer';

const fileSyncNoop = Layer.succeed(FileSync, {
  fsync: () => Effect.void,
  fsyncDirectoryChain: () => Effect.void,
});

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'repo-'));
  temporaryDirectories.push(directory);
  return directory;
};

/** The real Node-backed writer over a temporary config directory, with a no-op fsync. */
const writerLayer = (repoDir: string) =>
  WriterLive.pipe(
    Layer.provide(fileSyncNoop),
    Layer.provide(NodeFileSystem.layer),
    Layer.provide(Path.layer),
    Layer.provide(
      Layer.setConfigProvider(
        ConfigProvider.fromMap(new Map([['COMPONENT_CONFIG_DIR', join(repoDir, 'config')]])),
      ),
    ),
  );

const saveEffect = (relPath: string, content: string) =>
  Effect.flatMap(Writer, (writer) => writer.write([{ relPath, content }]));

/** Plants a symlink to /etc/hosts at the target, replacing whatever is there. */
const plantHostsSymlink = async (target: string): Promise<void> => {
  await rm(target, { force: true, recursive: true });
  await symlink('/etc/hosts', target);
};

/**
 * The writer over a temporary config directory whose FileSystem plants a
 * symlink at `sabotageTarget` the first time the writer stages a temp file, a
 * deterministic stand-in for an attacker racing the write. Only writeFileString
 * is overridden; every other method stays real.
 */
const sabotagedWriterLayer = (repoDir: string, sabotageTarget: string) => {
  let sabotaged = false;
  const sabotagingFileSystem = Layer.effect(
    FileSystem.FileSystem,
    Effect.gen(function* () {
      // Resolve the real service through the tag (Layer.build returns the
      // raw Context wrapper, not the service itself).
      const realFs = yield* FileSystem.FileSystem.pipe(
        Effect.provide(NodeFileSystem.layer),
        Effect.scoped,
      );
      // Preserve every real method: only writeFileString is overridden.
      return {
        ...realFs,
        writeFileString: (path: string, data: string) => {
          if (!sabotaged && path.includes('.tmp')) {
            sabotaged = true;
            return Effect.flatMap(realFs.writeFileString(path, data), () =>
              Effect.promise(() => plantHostsSymlink(sabotageTarget)),
            );
          }
          return realFs.writeFileString(path, data);
        },
      } as FileSystem.FileSystem;
    }),
  );
  // Same as writerLayer, but the sabotaging FileSystem replaces the real
  // one (Layer.provideMerge would keep the innermost real layer and the
  // sabotage would never run).
  return WriterLive.pipe(
    Layer.provide(fileSyncNoop),
    Layer.provide(sabotagingFileSystem),
    Layer.provide(Path.layer),
    Layer.provide(
      Layer.setConfigProvider(
        ConfigProvider.fromMap(new Map([['COMPONENT_CONFIG_DIR', join(repoDir, 'config')]])),
      ),
    ),
  );
};

const readUtf8 = (path: string) => readFile(path, 'utf8');

const readDirectory = (path: string) => readdir(path);

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('WriterLive', () => {
  it.scoped('writes a component below the config directory subpath', () =>
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

  it.scoped('writes a top-level artifact directly in the config directory', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* saveEffect('bundle.js', '{}').pipe(Effect.provide(writerLayer(repoDir)));

      const written = yield* Effect.promise(() => readUtf8(join(repoDir, 'config', 'bundle.js')));
      expect(written).toBe('{}');
    }),
  );

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

  it.scoped('rejects a symlinked directory segment inside the config directory', () =>
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

  it.scoped('fails with the typed symlink error on a symlink cycle (ELOOP, not a raw error)', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const journeysDir = join(repoDir, 'config', 'journeys');
      yield* Effect.promise(() => mkdir(journeysDir, { recursive: true }));
      // A cycle: loop → cycle → loop. Reading anything inside fails with
      // ELOOP ("too many levels of symbolic links"); the writer must map it
      // to the same typed failure as any other symlink, not leak a raw error.
      yield* Effect.promise(() => symlink(join(journeysDir, 'cycle'), join(journeysDir, 'loop')));
      yield* Effect.promise(() => symlink(join(journeysDir, 'loop'), join(journeysDir, 'cycle')));
      const exit = yield* Effect.either(
        saveEffect('journeys/cycle/login.json', '{}').pipe(Effect.provide(writerLayer(repoDir))),
      );
      if (exit._tag === 'Right') {
        throw new Error('Expected the save to fail');
      }
      expect((exit.left as Error).message).toMatch(/symlink/i);
    }),
  );

  it.scoped('re-checks for planted symlinks after staging (TOCTOU window)', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* Effect.promise(() => mkdir(join(repoDir, 'config', 'journeys'), { recursive: true }));
      const planted = join(repoDir, 'config', 'journeys', 'planted');

      // Deterministic race: a sabotaging FileSystem wraps the real one and
      // re-plants a symlink into the artifact's directory the first time the
      // writer stages a temp file (between the pre-write probe and the
      // rename). The writer's post-stage re-check must catch it and fail the
      // write before the rename.
      const exit = yield* Effect.either(
        saveEffect('journeys/planted/login.json', '{}').pipe(
          Effect.provide(sabotagedWriterLayer(repoDir, planted)),
        ),
      );
      if (exit._tag === 'Right') {
        throw new Error('Expected the save to fail when a symlink is planted mid-write');
      }
      expect((exit.left as Error).message).toMatch(/symlink/i);
      // /etc/hosts must be untouched.
      const escaped = yield* Effect.either(Effect.promise(() => readFile('/etc/hosts', 'utf8')));
      expect(escaped._tag).toBe('Right');
    }),
  );

  it.scoped('removes the staged temp file when the post-stage re-check fails', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      yield* Effect.promise(() => mkdir(join(repoDir, 'config', 'journeys'), { recursive: true }));
      // Sabotage the destination file path, not the directory: the temp file
      // is a sibling of the destination, so planting here leaves it on disk
      // when the re-check fails (planting on the directory would let the
      // sabotage's own rm delete the temp file and hide the leak).
      const planted = join(repoDir, 'config', 'journeys', 'planted', 'login.json');

      // The symlink is planted only after staging (see sabotagedWriterLayer),
      // so the pre-stage check passes, the temp file is written, and the
      // post-stage re-check fails: the staged temp file must not outlive that
      // failure, or a dotfile is left for config-saver to commit.
      const exit = yield* Effect.either(
        saveEffect('journeys/planted/login.json', '{}').pipe(
          Effect.provide(sabotagedWriterLayer(repoDir, planted)),
        ),
      );
      expect(exit._tag).toBe('Left');

      const entries = yield* Effect.promise(() =>
        readDirectory(join(repoDir, 'config', 'journeys', 'planted')),
      );
      expect(entries.every((entry) => !entry.includes('.tmp'))).toBe(true);
      // /etc/hosts must be untouched.
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

  it.scoped('removes staged temporary files when staging fails', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const configDir = join(repoDir, 'config');
      const exit = yield* Effect.either(
        Effect.flatMap(Writer, (writer) =>
          writer.write([
            { relPath: 'a.json', content: 'a' },
            { relPath: 'b.json', content: 'b' },
          ]),
        ).pipe(
          Effect.provide(
            // Fail the staging fsync of the second artifact; the cleanup
            // must leave no .tmp files behind for config-saver to commit.
            WriterLive.pipe(
              Layer.provide(
                Layer.succeed(FileSync, {
                  fsync: (path: string) =>
                    path.endsWith('b.json.tmp') || /\.b\.json\..+\.tmp$/.test(path)
                      ? Effect.fail(new FileSyncError({ message: 'forced fsync failure' }))
                      : Effect.void,
                  fsyncDirectoryChain: () => Effect.void,
                }),
              ),
              Layer.provide(NodeFileSystem.layer),
              Layer.provide(Path.layer),
              Layer.provide(
                Layer.setConfigProvider(
                  ConfigProvider.fromMap(new Map([['COMPONENT_CONFIG_DIR', configDir]])),
                ),
              ),
            ),
          ),
        ),
      );
      expect(exit._tag).toBe('Left');
      const entries = yield* Effect.promise(() => readDirectory(join(configDir)));
      expect(entries.every((entry) => !entry.includes('.tmp'))).toBe(true);
    }),
  );

  it.scoped('removes staged temporary files when a rename fails', () =>
    Effect.gen(function* () {
      const repoDir = yield* Effect.promise(makeTemporaryDirectory);
      const configDir = join(repoDir, 'config');
      // A directory squatting on the destination path makes rename(2) fail
      // for the second artifact after the first staged-and-renamed cleanly.
      yield* Effect.promise(() => mkdir(join(configDir, 'b.json'), { recursive: true }));
      const exit = yield* Effect.either(
        Effect.flatMap(Writer, (writer) =>
          writer.write([
            { relPath: 'a.json', content: 'a' },
            { relPath: 'b.json', content: 'b' },
          ]),
        ).pipe(Effect.provide(writerLayer(repoDir))),
      );
      expect(exit._tag).toBe('Left');
      const entries = yield* Effect.promise(() => readDirectory(join(configDir)));
      expect(entries.every((entry) => !entry.includes('.tmp'))).toBe(true);
    }),
  );
});
