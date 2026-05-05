import { NodeContext } from '@effect/platform-node';
import { Effect, Either } from 'effect';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readVersion, writeVersion } from '../src/config/version.js';

import type { FileSystem } from '@effect/platform';

import type { GeneratorVersion } from '../src/config/version.js';

const run = <A>(effect: Effect.Effect<A, unknown, never>): Promise<A> => Effect.runPromise(effect);

const runEither = <A>(effect: Effect.Effect<A, unknown, FileSystem.FileSystem>) =>
  Effect.runPromise(effect.pipe(Effect.either, Effect.provide(NodeContext.layer)));

const provide = <A, E>(effect: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.provide(effect, NodeContext.layer);

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-version-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

const sampleVersion: GeneratorVersion = {
  version: 'v1.2.3',
  commitHash: 'abc1234',
  generatedAt: '2026-01-01T00:00:00.000Z',
};

describe('writeVersion + readVersion (round-trip)', () => {
  it('writes and reads back the version object correctly', async () => {
    await run(provide(writeVersion(tmpDir, sampleVersion)));
    const result = await run(provide(readVersion(tmpDir)));
    expect(result).toEqual(sampleVersion);
  });

  it('writes a valid JSON file', async () => {
    await run(provide(writeVersion(tmpDir, sampleVersion)));
    const content = await import('node:fs/promises').then((fsp) =>
      fsp.readFile(join(tmpDir, '.generator-version'), 'utf-8'),
    );
    expect(() => JSON.parse(content)).not.toThrow();
    expect(JSON.parse(content)).toEqual(sampleVersion);
  });
});

describe('readVersion', () => {
  it('fails with GeneratorVersionError when .generator-version is missing', async () => {
    const result = await runEither(readVersion(tmpDir));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('GeneratorVersionError');
    }
  });

  it('fails with GeneratorVersionError when file contains malformed JSON', async () => {
    await writeFile(join(tmpDir, '.generator-version'), 'not valid json');
    const result = await runEither(readVersion(tmpDir));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('GeneratorVersionError');
    }
  });
});
