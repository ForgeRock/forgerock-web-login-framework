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
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ComponentRepo, ComponentRepoError, FileSync } from './component-repo';

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = () =>
  Effect.tryPromise({
    try: () => mkdtemp(join(tmpdir(), 'component-repo-')),
    catch: (cause) => cause,
  }).pipe(
    Effect.tap((directory) =>
      Effect.sync(() => {
        temporaryDirectories.push(directory);
      }),
    ),
  );

const repoLayer = (repoDir: string) =>
  Layer.provide(
    ComponentRepo.layer({ repoDir, trackedSubpath: 'config' }),
    Layer.merge(NodeFileSystem.layer, FileSync.layerNoop),
  );

const save = (repoDir: string, relPath: string, content: string) =>
  Effect.provide(
    Effect.flatMap(ComponentRepo, (repo) => repo.saveComponent(relPath, content)),
    repoLayer(repoDir),
  );

const saveArtifacts = (
  repoDir: string,
  artifacts: ReadonlyArray<{ relPath: string; content: string }>,
) =>
  Effect.provide(
    Effect.flatMap(ComponentRepo, (repo) => repo.saveArtifacts(artifacts)),
    repoLayer(repoDir),
  );

const readUtf8 = (path: string) =>
  Effect.tryPromise({
    try: () => readFile(path, 'utf8'),
    catch: (cause) => cause,
  });

const readDirectory = (path: string) =>
  Effect.tryPromise({
    try: () => readdir(path),
    catch: (cause) => cause,
  });

afterEach(() =>
  Effect.tryPromise({
    try: () =>
      Promise.all(
        temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
      ),
    catch: (cause) => cause,
  }),
);

describe('ComponentRepo', () => {
  it.effect('writes a component below the tracked repository subpath', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();

      yield* save(repoDir, 'journeys/login.json', '{"journey":"login"}');

      expect(yield* readUtf8(join(repoDir, 'config', 'journeys', 'login.json'))).toBe(
        '{"journey":"login"}',
      );
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
    it.effect(`rejects unsafe relative path ${relPath}`, () =>
      Effect.gen(function* () {
        const repoDir = yield* makeTemporaryDirectory();
        const result = yield* Effect.either(save(repoDir, relPath, '{}'));

        expect(result._tag).toBe('Left');
        if (result._tag === 'Left') {
          expect(result.left).toBeInstanceOf(ComponentRepoError);
          expect(result.left._tag).toBe('ComponentRepoError');
        }
      }),
    );
  }

  it.effect('atomically swaps complete component content for concurrent readers', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const destination = join(repoDir, 'config', 'journeys', 'login.json');
      const oldContent = JSON.stringify({ version: 'old', payload: 'a'.repeat(50_000) });
      const newContents = Array.from({ length: 25 }, (_, version) =>
        JSON.stringify({ version, payload: String(version).repeat(50_000) }),
      );

      yield* save(repoDir, 'journeys/login.json', oldContent);

      const observed = new Set<string>();
      let writing = true;
      const reader = (async () => {
        while (writing) {
          observed.add(await readFile(destination, 'utf8'));
        }
      })();

      for (const content of newContents) {
        yield* save(repoDir, 'journeys/login.json', content);
      }
      writing = false;
      yield* Effect.tryPromise({ try: () => reader, catch: (cause) => cause });

      const allowed = new Set([oldContent, ...newContents]);
      for (const content of observed) {
        expect(allowed.has(content)).toBe(true);
        expect(JSON.parse(content)).toHaveProperty('payload');
      }
    }),
  );

  it.effect('removes the temporary file after a successful atomic rename', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();

      yield* save(repoDir, 'journeys/login.json', '{}');

      expect(yield* readDirectory(join(repoDir, 'config', 'journeys'))).toEqual(['login.json']);
    }),
  );

  it.effect('validates every artifact before creating temporary files', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const result = yield* Effect.either(
        saveArtifacts(repoDir, [
          { relPath: 'journeys/login.json', content: '{}' },
          { relPath: '../outside.json', content: '{}' },
        ]),
      );

      expect(result._tag).toBe('Left');
      expect(yield* readDirectory(repoDir)).toEqual([]);
    }),
  );
});
