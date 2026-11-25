import { NodeContext } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { initProject } from '../src/commands/init.js';
import { isFrameworkDirectory } from '../src/services/file-system.js';
import { Release } from '../src/services/release.js';

import type { FileSystem, Path } from '@effect/platform';

const provide = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem | Path.Path>) =>
  Effect.runPromise(
    Effect.provide(eff, Layer.provideMerge(NodeContext.layer, ReleaseStubLayer)) as Effect.Effect<
      A,
      E,
      never
    >,
  );

/** Local-source init never touches the network; the Release stub is never called. */
const ReleaseStubLayer = Layer.succeed(Release, {
  archiveUrl: () => '',
  resolveLatest: () => Effect.die('Release stub should not be called'),
  listReleases: () => Effect.die('Release stub should not be called'),
  fetch: () => Effect.die('Release stub should not be called'),
  fetchBranch: () => Effect.die('Release stub should not be called'),
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-init-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('isFrameworkDirectory', () => {
  it('returns true for a dir with package.json + custom/', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-project' }));
    await mkdir(join(tmpDir, 'custom'), { recursive: true });

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(true);
  });

  it('returns true for a dir with package.json + pnpm-workspace.yaml', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-project' }));
    await writeFile(join(tmpDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(true);
  });

  it('returns true for a dir with all three indicators', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-project' }));
    await mkdir(join(tmpDir, 'custom'), { recursive: true });
    await writeFile(join(tmpDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(true);
  });

  it('returns false for an empty directory', async () => {
    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });

  it('returns false for a directory with package.json but no framework indicators', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({ name: 'unrelated-project' }));

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });

  it('returns false for custom/ present but no package.json', async () => {
    await mkdir(join(tmpDir, 'custom'), { recursive: true });

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });

  it('returns false for a non-existent directory', async () => {
    const result = await provide(isFrameworkDirectory(join(tmpDir, 'does-not-exist')));
    expect(result).toBe(false);
  });

  it('returns false for a directory with unrelated files only', async () => {
    await writeFile(join(tmpDir, 'README.md'), '# hello');
    await writeFile(join(tmpDir, 'index.js'), 'console.log("hi");');

    const result = await provide(isFrameworkDirectory(tmpDir));
    expect(result).toBe(false);
  });
});

describe('initProject — wrapper files + scaffold dirs', () => {
  let sourceDir: string;
  let targetDir: string;

  beforeEach(async () => {
    sourceDir = await mkdtemp(join(tmpdir(), 'ping-lf-init-src-test-'));
    targetDir = await mkdtemp(join(tmpdir(), 'ping-lf-init-tgt-test-'));
  });

  afterEach(async () => {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(targetDir, { recursive: true, force: true });
  });

  const seedFrameworkSource = async () => {
    await writeFile(join(sourceDir, 'package.json'), '{}', 'utf8');
    await mkdir(join(sourceDir, 'custom', 'components', 'callbacks'), { recursive: true });
    await mkdir(join(sourceDir, 'custom', 'components', 'stages'), { recursive: true });
    // Sandbox framework files (README, demo/) placed in the fresh project —
    // init is the one flow allowed to write inside custom/.
    await writeFile(
      join(sourceDir, 'custom', 'components', 'README.md'),
      '# framework custom readme',
      'utf8',
    );
    await mkdir(join(sourceDir, 'custom', 'components', 'demo', 'stages'), { recursive: true });
    await writeFile(
      join(sourceDir, 'custom', 'components', 'demo', 'stages', 'custom-login.svelte'),
      '<!-- framework demo -->',
      'utf8',
    );
    // Wrapper content comes from the CLI's own templates/wrapper/ dir (resolved
    // inside the CLI, not from the framework source tree) — no core/ stub needed.
  };

  it('scaffolds callbacks/stages .gitkeep dirs, places wrapper files from CLI templates, skips headers/footers', async () => {
    await seedFrameworkSource();

    await provide(
      initProject({ directory: targetDir, local: Option.some(sourceDir), version: Option.none() }),
    );

    // callbacks/stages scaffolded with .gitkeep
    for (const dir of ['callbacks', 'stages']) {
      await expect(
        readFile(join(targetDir, 'custom', 'components', dir, '.gitkeep'), 'utf8'),
      ).resolves.toBe('');
    }
    // Sandbox framework files (README, demo/) placed in the fresh project
    // — init is the one flow allowed to write inside custom/.
    await expect(
      readFile(join(targetDir, 'custom', 'components', 'README.md'), 'utf8'),
    ).resolves.toBe('# framework custom readme');
    await expect(
      readFile(
        join(targetDir, 'custom', 'components', 'demo', 'stages', 'custom-login.svelte'),
        'utf8',
      ),
    ).resolves.toBe('<!-- framework demo -->');
    // headers/ and footers/ (registry-era dirs) are NOT scaffolded
    await expect(access(join(targetDir, 'custom', 'components', 'headers'))).rejects.toThrow();
    await expect(access(join(targetDir, 'custom', 'components', 'footers'))).rejects.toThrow();
    // wrapper files placed from the CLI's own wrapper templates into layout/
    for (const element of ['header', 'footer']) {
      const wrapper = await readFile(
        join(targetDir, 'custom', 'components', 'layout', `${element}.svelte`),
        'utf8',
      );
      expect(wrapper.length).toBeGreaterThan(0);
      expect(wrapper).toContain('journeyName');
    }
  });
});
