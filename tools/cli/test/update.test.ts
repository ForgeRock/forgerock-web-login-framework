import { NodeContext } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

/**
 * Collects everything Effect's default Console.warn prints while `run`
 * executes. Effect's default console service delegates to the global
 * `console.warn`, so a spy on it observes every warning the command emits.
 */
const captureWarnings = async <A>(
  run: () => Promise<A>,
): Promise<{ result: A; warnings: string[] }> => {
  const warnings: string[] = [];
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    warnings.push(args.map((argument) => String(argument)).join(' '));
  });
  try {
    const result = await run();
    return { result, warnings };
  } finally {
    warnSpy.mockRestore();
  }
};

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
   * except the framework-owned curated surface file, which update refreshes
   * explicitly after the sandboxed copy.
   */
  const seedFrameworkSource = async (options: { readonly withSurfaceFile?: boolean } = {}) => {
    const withSurfaceFile = options.withSurfaceFile ?? true;
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
    if (withSurfaceFile) {
      await writeFile(
        join(sourceDir, 'custom', 'components', 'login-framework.ts'),
        '// framework surface',
        'utf8',
      );
    }
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
    await mkdir(join(projectDir, 'custom', 'components', 'stages'), { recursive: true });
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
    // The project's frozen curated surface (what update.ts must refresh) and a
    // sentinel customer stage under stages/ (what update.ts must never touch).
    await writeFile(
      join(projectDir, 'custom', 'components', 'login-framework.ts'),
      '// customer stale surface',
      'utf8',
    );
    await writeFile(
      join(projectDir, 'custom', 'components', 'stages', 'customer-stage.svelte'),
      '<!-- customer sentinel stage -->',
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

  it('update refreshes the framework-owned surface file while every other custom/ path stays untouched', async () => {
    await seedFrameworkSource();
    await seedCustomerProject();

    await runUpdate();

    // The curated surface is framework-owned: update overwrites the project's
    // stale copy with the framework's current one.
    expect(await readFile(projectPath('custom', 'components', 'login-framework.ts'), 'utf8')).toBe(
      '// framework surface',
    );

    // The customer sentinel under stages/ survives byte-for-byte.
    expect(
      await readFile(
        projectPath('custom', 'components', 'stages', 'customer-stage.svelte'),
        'utf8',
      ),
    ).toBe('<!-- customer sentinel stage -->');

    // Every other customer file exactly as it was
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

    // Framework custom/ files other than the surface did not land anywhere:
    // the customer README wins and the framework demo/ never appears.
    await expect(access(projectPath('custom', 'components', 'demo'))).rejects.toThrow();
  });

  it('update backfills the surface file into a project that predates the sandbox', async () => {
    await seedFrameworkSource();
    // Pre-sandbox project: only .generator-version, no custom/ tree at all.
    await writeFile(
      join(projectDir, '.generator-version'),
      JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
      'utf8',
    );

    await runUpdate();

    // The surface refresh creates the missing parent directories and delivers
    // the surface file, so the next core build resolves $login-framework.
    expect(await readFile(projectPath('custom', 'components', 'login-framework.ts'), 'utf8')).toBe(
      '// framework surface',
    );
    // The backfill covers only the allowlisted surface file, nothing else.
    await expect(access(projectPath('custom', 'components', 'README.md'))).rejects.toThrow();
    await expect(access(projectPath('custom', 'components', 'layout'))).rejects.toThrow();
  });

  it('update warns and keeps the existing surface when the framework source predates the surface file', async () => {
    await seedFrameworkSource({ withSurfaceFile: false });
    await seedCustomerProject();

    const { warnings } = await captureWarnings(runUpdate);

    // The customer's copy is kept as-is and the update still succeeds.
    expect(await readFile(projectPath('custom', 'components', 'login-framework.ts'), 'utf8')).toBe(
      '// customer stale surface',
    );
    expect(
      warnings.some((warning) => warning.includes('custom/components/login-framework.ts')),
    ).toBe(true);
  });

  it('update warns when legacy experimental/custom components exist', async () => {
    await seedFrameworkSource();
    await seedCustomerProject();
    const legacyStageDir = join(projectDir, 'experimental', 'custom', 'stages', 'old-login');
    await mkdir(legacyStageDir, { recursive: true });
    await writeFile(join(legacyStageDir, 'old-login.svelte'), '<div></div>', 'utf8');

    const { warnings } = await captureWarnings(runUpdate);

    expect(warnings.some((warning) => warning.includes('experimental/custom'))).toBe(true);
    expect(warnings.some((warning) => warning.includes('custom/components/stages'))).toBe(true);
  });

  it('update does not warn about legacy directories when none exist', async () => {
    await seedFrameworkSource();
    await seedCustomerProject();

    const { warnings } = await captureWarnings(runUpdate);

    expect(warnings.some((warning) => warning.includes('experimental/custom'))).toBe(false);
  });

  it('update does not backfill wrapper files (the framework Vite plugin seeds them on next build)', async () => {
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
