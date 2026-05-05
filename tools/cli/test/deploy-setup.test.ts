import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Effect, Either } from 'effect';
import { FileSystem } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';

import { setupDeployTarget } from '../src/services/deploy-setup.js';

const provide = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.runPromise(Effect.provide(eff, NodeContext.layer));

const provideEither = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem>) =>
  Effect.runPromise(Effect.provide(eff.pipe(Effect.either), NodeContext.layer));

let sourceDir: string;
let projectDir: string;

beforeEach(async () => {
  sourceDir = await mkdtemp(join(tmpdir(), 'ping-lf-deploy-setup-source-'));
  projectDir = await mkdtemp(join(tmpdir(), 'ping-lf-deploy-setup-project-'));
});

afterEach(async () => {
  await rm(sourceDir, { recursive: true, force: true });
  await rm(projectDir, { recursive: true, force: true });
});

const seedTemplate = async (templateName: string) => {
  const dir = join(sourceDir, 'deploy-templates', templateName);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'tpl' }));
  await writeFile(join(dir, 'alchemy.run.ts'), 'export default 1;');
  await writeFile(join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: "9.0"');
  await writeFile(join(dir, 'README.md'), '# Template');
  await mkdir(join(dir, 'node_modules', 'foo'), { recursive: true });
  await writeFile(join(dir, 'node_modules', 'foo', 'index.js'), 'module.exports = {};');
};

describe('setupDeployTarget', () => {
  it('copies deploy-templates/<target>/ files into <projectDir>/deploy/', async () => {
    await seedTemplate('cloudflare');
    await provide(setupDeployTarget(projectDir, sourceDir, 'cloudflare'));

    const pkg = await readFile(join(projectDir, 'deploy', 'package.json'), 'utf-8');
    expect(JSON.parse(pkg)).toEqual({ name: 'tpl' });

    const run = await readFile(join(projectDir, 'deploy', 'alchemy.run.ts'), 'utf-8');
    expect(run).toBe('export default 1;');
  });

  it('preserves the template pnpm-lock.yaml (deploy templates pin alchemy versions)', async () => {
    await seedTemplate('cloudflare');
    await provide(setupDeployTarget(projectDir, sourceDir, 'cloudflare'));

    const lock = await readFile(join(projectDir, 'deploy', 'pnpm-lock.yaml'), 'utf-8');
    expect(lock).toContain('lockfileVersion');
  });

  it('skips node_modules when copying the template', async () => {
    await seedTemplate('cloudflare');
    await provide(setupDeployTarget(projectDir, sourceDir, 'cloudflare'));

    let nodeModulesExists = false;
    try {
      await stat(join(projectDir, 'deploy', 'node_modules'));
      nodeModulesExists = true;
    } catch {
      nodeModulesExists = false;
    }
    expect(nodeModulesExists).toBe(false);
  });

  it('writes .ping-lf/config.json with the chosen target', async () => {
    await seedTemplate('cloudflare');
    await provide(setupDeployTarget(projectDir, sourceDir, 'cloudflare'));

    const config = await readFile(join(projectDir, '.ping-lf', 'config.json'), 'utf-8');
    const parsed = JSON.parse(config);
    expect(parsed.version).toBe(1);
    expect(parsed.target).toBe('cloudflare');
    expect(parsed.templateDir).toBe('deploy');
    expect(typeof parsed.createdAt).toBe('string');
  });

  it('maps target "docker" to template directory "self-hosted-docker"', async () => {
    await seedTemplate('self-hosted-docker');
    await provide(setupDeployTarget(projectDir, sourceDir, 'docker'));

    const pkg = await readFile(join(projectDir, 'deploy', 'package.json'), 'utf-8');
    expect(JSON.parse(pkg).name).toBe('tpl');

    const config = JSON.parse(await readFile(join(projectDir, '.ping-lf', 'config.json'), 'utf-8'));
    expect(config.target).toBe('docker');
  });

  it('fails with DeployTemplateNotFoundError when source template directory is missing', async () => {
    const result = await provideEither(setupDeployTarget(projectDir, sourceDir, 'cloudflare'));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe('DeployTemplateNotFoundError');
    }
  });
});
