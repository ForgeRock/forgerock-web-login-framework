import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Effect, Either, Layer, Ref } from 'effect';
import { FileSystem } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';

import { runDeploy } from '../src/commands/deploy.js';
import { ProcessRunner } from '../src/services/process-runner.js';
import { writeDeployConfig } from '../src/config/deploy.js';

interface SpawnCall {
  command: string;
  args: ReadonlyArray<string>;
  cwd: string;
}

const makeFakeProcessRunner = (exitCode: number) =>
  Effect.gen(function* () {
    const calls = yield* Ref.make<ReadonlyArray<SpawnCall>>([]);
    const layer = Layer.succeed(ProcessRunner, {
      run: (command, args, options) =>
        Ref.update(calls, (xs) => [...xs, { command, args, cwd: options.cwd }]).pipe(
          Effect.as(exitCode),
        ),
    });
    return { layer, calls };
  });

const provideAll = <A, E>(
  eff: Effect.Effect<A, E, FileSystem.FileSystem | ProcessRunner>,
  runnerLayer: Layer.Layer<ProcessRunner>,
) =>
  Effect.runPromise(
    eff.pipe(Effect.either, Effect.provide(runnerLayer), Effect.provide(NodeContext.layer)),
  );

const writeFrameworkMarkers = async (dir: string) => {
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'my-project' }));
  await writeFile(join(dir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-deploy-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('runDeploy', () => {
  it('fails with NotInFrameworkProjectError when cwd is not a framework project', async () => {
    const { layer } = await Effect.runPromise(makeFakeProcessRunner(0));
    const result = await provideAll(runDeploy(tmpDir, 'deploy'), layer);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('NotInFrameworkProjectError');
    }
  });

  it('fails with MissingDeployConfigError when .ping-lf/config.json is absent', async () => {
    await writeFrameworkMarkers(tmpDir);
    const { layer } = await Effect.runPromise(makeFakeProcessRunner(0));
    const result = await provideAll(runDeploy(tmpDir, 'deploy'), layer);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('MissingDeployConfigError');
    }
  });

  it('spawns pnpm run <script> in the resolved templateDir', async () => {
    await writeFrameworkMarkers(tmpDir);
    await mkdir(join(tmpDir, 'deploy'), { recursive: true });
    await Effect.runPromise(
      writeDeployConfig(tmpDir, {
        version: 1,
        target: 'cloudflare',
        templateDir: 'deploy',
        createdAt: '2026-04-29T00:00:00.000Z',
      }).pipe(Effect.provide(NodeContext.layer)),
    );

    const fake = await Effect.runPromise(makeFakeProcessRunner(0));
    const result = await provideAll(runDeploy(tmpDir, 'deploy'), fake.layer);

    expect(Either.isRight(result)).toBe(true);
    const calls = await Effect.runPromise(Ref.get(fake.calls));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe('pnpm');
    expect(calls[0]?.args).toEqual(['run', 'deploy']);
    expect(calls[0]?.cwd).toBe(join(tmpDir, 'deploy'));
  });

  it('passes through alternate scripts (dev, destroy, logs, tail)', async () => {
    await writeFrameworkMarkers(tmpDir);
    await mkdir(join(tmpDir, 'deploy'), { recursive: true });
    await Effect.runPromise(
      writeDeployConfig(tmpDir, {
        version: 1,
        target: 'cloudflare',
        templateDir: 'deploy',
        createdAt: '2026-04-29T00:00:00.000Z',
      }).pipe(Effect.provide(NodeContext.layer)),
    );

    const fake = await Effect.runPromise(makeFakeProcessRunner(0));
    await provideAll(runDeploy(tmpDir, 'destroy'), fake.layer);
    const calls = await Effect.runPromise(Ref.get(fake.calls));
    expect(calls[0]?.args).toEqual(['run', 'destroy']);
  });

  it('fails with AlchemyExitError when pnpm exits non-zero', async () => {
    await writeFrameworkMarkers(tmpDir);
    await mkdir(join(tmpDir, 'deploy'), { recursive: true });
    await Effect.runPromise(
      writeDeployConfig(tmpDir, {
        version: 1,
        target: 'cloudflare',
        templateDir: 'deploy',
        createdAt: '2026-04-29T00:00:00.000Z',
      }).pipe(Effect.provide(NodeContext.layer)),
    );

    const fake = await Effect.runPromise(makeFakeProcessRunner(1));
    const result = await provideAll(runDeploy(tmpDir, 'deploy'), fake.layer);

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      const err = result.left as { _tag: string; exitCode?: number; script?: string };
      expect(err._tag).toBe('AlchemyExitError');
      expect(err.exitCode).toBe(1);
      expect(err.script).toBe('deploy');
    }
  });

  it('resolves templateDir relative to the project root', async () => {
    await writeFrameworkMarkers(tmpDir);
    await mkdir(join(tmpDir, 'infra', 'cf'), { recursive: true });
    await Effect.runPromise(
      writeDeployConfig(tmpDir, {
        version: 1,
        target: 'cloudflare',
        templateDir: 'infra/cf',
        createdAt: '2026-04-29T00:00:00.000Z',
      }).pipe(Effect.provide(NodeContext.layer)),
    );

    const fake = await Effect.runPromise(makeFakeProcessRunner(0));
    await provideAll(runDeploy(tmpDir, 'deploy'), fake.layer);
    const calls = await Effect.runPromise(Ref.get(fake.calls));
    expect(calls[0]?.cwd).toBe(join(tmpDir, 'infra', 'cf'));
  });
});
