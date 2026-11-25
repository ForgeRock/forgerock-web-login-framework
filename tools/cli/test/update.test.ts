import { NodeContext } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { updateProject } from '../src/commands/update.js';
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

/** Local-source update never touches the network; the Release stub is never called. */
const ReleaseStubLayer = Layer.succeed(Release, {
  archiveUrl: () => '',
  resolveLatest: () => Effect.die('Release stub should not be called'),
  listReleases: () => Effect.die('Release stub should not be called'),
  fetch: () => Effect.die('Release stub should not be called'),
  fetchBranch: () => Effect.die('Release stub should not be called'),
});

describe('updateProject — sandbox semantics', () => {
  let sourceDir: string;
  let projectDir: string;

  beforeEach(async () => {
    sourceDir = await mkdtemp(join(tmpdir(), 'ping-lf-upd-src-test-'));
    projectDir = await mkdtemp(join(tmpdir(), 'ping-lf-upd-prj-test-'));
  });

  afterEach(async () => {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(projectDir, { recursive: true, force: true });
  });

  /**
   * Framework source carrying files across the whole custom/ tree. A real
   * release tarball contains these; the sandbox must skip every one of them
   * so the customer's tree under custom/ is never touched by an update.
   */
  const seedFrameworkSource = async () => {
    await writeFile(join(sourceDir, 'package.json'), '{}', 'utf8');
    await writeFile(join(sourceDir, 'README.md'), '# framework', 'utf8');
    await mkdir(join(sourceDir, 'custom', 'components', 'layout'), { recursive: true });
    await mkdir(join(sourceDir, 'custom', 'components', 'demo', 'stages', 'custom-login'), {
      recursive: true,
    });
    await writeFile(
      join(sourceDir, 'custom', 'components', 'README.md'),
      '# framework custom readme',
      'utf8',
    );
    await writeFile(
      join(sourceDir, 'custom', 'components', 'login-framework.ts'),
      '// framework surface',
      'utf8',
    );
    await writeFile(
      join(sourceDir, 'custom', 'components', 'layout', 'header.svelte'),
      '<!-- framework header -->',
      'utf8',
    );
    await writeFile(
      join(sourceDir, 'custom', 'components', 'layout', 'footer.svelte'),
      '<!-- framework footer -->',
      'utf8',
    );
    await writeFile(
      join(
        sourceDir,
        'custom',
        'components',
        'demo',
        'stages',
        'custom-login',
        'custom-login.svelte',
      ),
      '<!-- framework demo -->',
      'utf8',
    );
  };

  /** Writes .generator-version so assertValidProject passes, plus customer content. */
  const seedCustomerProject = async () => {
    await writeFile(
      join(projectDir, '.generator-version'),
      JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
      'utf8',
    );
    await mkdir(join(projectDir, 'custom', 'components', 'layout'), { recursive: true });
    await mkdir(join(projectDir, 'custom', 'components', 'callbacks'), { recursive: true });
    await writeFile(
      join(projectDir, 'custom', 'components', 'layout', 'header.svelte'),
      '<!-- customer header -->',
      'utf8',
    );
    await writeFile(
      join(projectDir, 'custom', 'components', 'layout', 'footer.svelte'),
      '<!-- customer footer -->',
      'utf8',
    );
    await writeFile(
      join(projectDir, 'custom', 'components', 'callbacks', 'customer-callback.svelte'),
      '<!-- customer callback -->',
      'utf8',
    );
    await writeFile(
      join(projectDir, 'custom', 'components', 'README.md'),
      '# customer custom readme',
      'utf8',
    );
  };

  const runUpdate = () =>
    provide(
      updateProject({
        directory: Option.some(projectDir),
        local: Option.some(sourceDir),
        tag: Option.none(),
      }),
    );

  const projectPath = (...parts: string[]) => join(projectDir, ...parts);

  it('update copies nothing from custom/ — customer content survives untouched', async () => {
    await seedFrameworkSource();
    await seedCustomerProject();

    await runUpdate();

    // Every customer file exactly as it was
    expect(
      await readFile(projectPath('custom', 'components', 'layout', 'header.svelte'), 'utf8'),
    ).toBe('<!-- customer header -->');
    expect(
      await readFile(projectPath('custom', 'components', 'layout', 'footer.svelte'), 'utf8'),
    ).toBe('<!-- customer footer -->');
    expect(
      await readFile(
        projectPath('custom', 'components', 'callbacks', 'customer-callback.svelte'),
        'utf8',
      ),
    ).toBe('<!-- customer callback -->');
    expect(await readFile(projectPath('custom', 'components', 'README.md'), 'utf8')).toBe(
      '# customer custom readme',
    );

    // Framework custom/ files did not land anywhere
    for (const relativePath of [
      join('custom', 'components', 'login-framework.ts'),
      join('custom', 'components', 'README.md'),
    ]) {
      // README.md exists but is the customer's own; check the others are absent
      if (relativePath.endsWith('README.md')) {
        continue;
      }
      await expect(access(projectPath(relativePath))).rejects.toThrow();
    }
  });

  it('update does not backfill wrapper files — the framework Vite plugin seeds them on next build', async () => {
    await seedFrameworkSource();
    // Project predates wrappers: layout/ has no files yet
    await writeFile(
      join(projectDir, '.generator-version'),
      JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
      'utf8',
    );
    await mkdir(join(projectDir, 'custom', 'components', 'layout'), { recursive: true });

    await runUpdate();

    await expect(
      access(join(projectDir, 'custom', 'components', 'layout', 'header.svelte')),
    ).rejects.toThrow();
    await expect(
      access(join(projectDir, 'custom', 'components', 'layout', 'footer.svelte')),
    ).rejects.toThrow();
  });

  it('update still refreshes framework files outside custom/', async () => {
    await seedFrameworkSource();
    await seedCustomerProject();

    await runUpdate();

    expect(await readFile(projectPath('package.json'), 'utf8')).toBe('{}');
    expect(await readFile(projectPath('README.md'), 'utf8')).toBe('# framework');
  });
});
