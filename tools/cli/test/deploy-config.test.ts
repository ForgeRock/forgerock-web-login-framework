import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Effect, Either } from 'effect';
import { FileSystem } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';

import { readDeployConfig, writeDeployConfig, type DeployConfig } from '../src/config/deploy.js';

const provide = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.runPromise(Effect.provide(eff, NodeContext.layer));

const provideEither = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.runPromise(Effect.provide(eff.pipe(Effect.either), NodeContext.layer));

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-deploy-config-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

const sampleConfig: DeployConfig = {
  version: 1,
  target: 'cloudflare',
  templateDir: 'deploy',
  createdAt: '2026-04-29T00:00:00.000Z',
};

describe('writeDeployConfig + readDeployConfig (round-trip)', () => {
  it('writes and reads back the config object correctly', async () => {
    await provide(writeDeployConfig(tmpDir, sampleConfig));
    const result = await provide(readDeployConfig(tmpDir));
    expect(result).toEqual(sampleConfig);
  });

  it('writes valid JSON to .ping-lf/config.json', async () => {
    await provide(writeDeployConfig(tmpDir, sampleConfig));
    const fsp = await import('node:fs/promises');
    const content = await fsp.readFile(join(tmpDir, '.ping-lf', 'config.json'), 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
    expect(JSON.parse(content)).toEqual(sampleConfig);
  });

  it('creates the .ping-lf/ directory if it does not exist', async () => {
    await provide(writeDeployConfig(tmpDir, sampleConfig));
    const fsp = await import('node:fs/promises');
    const stat = await fsp.stat(join(tmpDir, '.ping-lf'));
    expect(stat.isDirectory()).toBe(true);
  });
});

describe('readDeployConfig errors', () => {
  it('fails with MissingDeployConfigError when .ping-lf/config.json is absent', async () => {
    const result = await provideEither(readDeployConfig(tmpDir));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('MissingDeployConfigError');
    }
  });

  it('fails with InvalidDeployConfigError when JSON is malformed', async () => {
    await mkdir(join(tmpDir, '.ping-lf'), { recursive: true });
    await writeFile(join(tmpDir, '.ping-lf', 'config.json'), 'not valid json');
    const result = await provideEither(readDeployConfig(tmpDir));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('InvalidDeployConfigError');
    }
  });

  it('fails with InvalidDeployConfigError when target is not a known value', async () => {
    await mkdir(join(tmpDir, '.ping-lf'), { recursive: true });
    await writeFile(
      join(tmpDir, '.ping-lf', 'config.json'),
      JSON.stringify({ ...sampleConfig, target: 'azure' }),
    );
    const result = await provideEither(readDeployConfig(tmpDir));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('InvalidDeployConfigError');
    }
  });

  it('fails with InvalidDeployConfigError when version is not 1', async () => {
    await mkdir(join(tmpDir, '.ping-lf'), { recursive: true });
    await writeFile(
      join(tmpDir, '.ping-lf', 'config.json'),
      JSON.stringify({ ...sampleConfig, version: 2 }),
    );
    const result = await provideEither(readDeployConfig(tmpDir));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('InvalidDeployConfigError');
    }
  });

  it('fails with InvalidDeployConfigError when required fields are missing', async () => {
    await mkdir(join(tmpDir, '.ping-lf'), { recursive: true });
    await writeFile(
      join(tmpDir, '.ping-lf', 'config.json'),
      JSON.stringify({ version: 1, target: 'cloudflare' }),
    );
    const result = await provideEither(readDeployConfig(tmpDir));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('InvalidDeployConfigError');
    }
  });
});
