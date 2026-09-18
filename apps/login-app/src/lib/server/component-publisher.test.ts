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

import {
  ComponentPublisher,
  ComponentPublisherError,
  parseBundle,
} from './component-publisher';
import { ComponentRepo, FileSync } from './component-repo';

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = () =>
  Effect.tryPromise({
    try: () => mkdtemp(join(tmpdir(), 'component-publisher-')),
    catch: (cause) => cause,
  }).pipe(
    Effect.tap((directory) =>
      Effect.sync(() => {
        temporaryDirectories.push(directory);
      }),
    ),
  );

const publish = (repoDir: string, bundle: string) =>
  Effect.provide(
    Effect.flatMap(ComponentPublisher, (publisher) => publisher.publishComponent(bundle)),
    Layer.provide(
      ComponentPublisher.layer,
      Layer.provide(
        ComponentRepo.layer({ repoDir, trackedSubpath: 'config' }),
        Layer.merge(NodeFileSystem.layer, FileSync.layerNoop),
      ),
    ),
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
    try: () => Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true }))),
    catch: (cause) => cause,
  }),
);

describe('parseBundle', () => {
  it.effect('parses file entries and ignores unknown fields', () =>
    Effect.gen(function* () {
      const result = yield* parseBundle(
        '{"files":[{"path":"journeys/login.json","content":"{}","ignored":true}],"ignored":true}',
      );

      expect(result).toEqual([{ relPath: 'journeys/login.json', content: '{}' }]);
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
        const result = yield* Effect.either(parseBundle(bundle));

        expect(result._tag).toBe('Left');
        if (result._tag === 'Left') {
          expect(result.left).toBeInstanceOf(ComponentPublisherError);
        }
      }),
    );
  }
});

describe('ComponentPublisher', () => {
  it.effect('publishes every bundle file through ComponentRepo', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();

      yield* publish(
        repoDir,
        '{"files":[{"path":"journeys/login.json","content":"{\\"journey\\":\\"login\\"}"},{"path":"themes/main.json","content":"{}"}]}',
      );

      expect(yield* readUtf8(join(repoDir, 'config', 'journeys', 'login.json'))).toBe('{"journey":"login"}');
      expect(yield* readUtf8(join(repoDir, 'config', 'themes', 'main.json'))).toBe('{}');
    }),
  );

  it.effect('validates all artifacts before writing any file', () =>
    Effect.gen(function* () {
      const repoDir = yield* makeTemporaryDirectory();
      const bundle =
        '{"files":[{"path":"journeys/login.json","content":"{}"},{"path":"../outside.json","content":"{}"}]}';
      const result = yield* Effect.either(publish(repoDir, bundle));

      expect(result._tag).toBe('Left');
      expect(yield* readDirectory(repoDir)).toEqual([]);
    }),
  );
});
