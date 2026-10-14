import { NodeContext } from '@effect/platform-node';
import { Effect, Layer, Option } from 'effect';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

describe('updateProject — wrapper file preservation', () => {
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

  const seedFrameworkSource = async () => {
    await writeFile(join(sourceDir, 'package.json'), '{}', 'utf8');
    await mkdir(join(sourceDir, 'experimental', 'custom', 'header'), { recursive: true });
    await mkdir(join(sourceDir, 'experimental', 'custom', 'footer'), { recursive: true });
    await writeFile(
      join(sourceDir, 'experimental', 'custom', 'header', 'header.svelte'),
      '<!-- framework header -->',
      'utf8',
    );
    await writeFile(
      join(sourceDir, 'experimental', 'custom', 'footer', 'footer.svelte'),
      '<!-- framework footer -->',
      'utf8',
    );
  };

  const seedCustomerProject = async (overrides: {
    readonly header?: string;
    readonly footerPresent?: boolean;
  }) => {
    await writeFile(
      join(projectDir, '.generator-version'),
      JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
      'utf8',
    );
    await mkdir(join(projectDir, 'experimental', 'custom', 'header'), { recursive: true });
    await writeFile(
      join(projectDir, 'experimental', 'custom', 'header', 'header.svelte'),
      overrides.header ?? '<!-- customer header -->',
      'utf8',
    );
    if (overrides.footerPresent) {
      await mkdir(join(projectDir, 'experimental', 'custom', 'footer'), { recursive: true });
      await writeFile(
        join(projectDir, 'experimental', 'custom', 'footer', 'footer.svelte'),
        '<!-- customer footer -->',
        'utf8',
      );
    }
  };

  it('preserves customer-edited wrapper files on update', async () => {
    await seedFrameworkSource();
    await seedCustomerProject({ header: '<!-- customer header -->', footerPresent: true });

    await provide(
      updateProject({
        directory: Option.some(projectDir),
        local: Option.some(sourceDir),
        tag: Option.none(),
      }),
    );

    const header = await readFile(
      join(projectDir, 'experimental', 'custom', 'header', 'header.svelte'),
      'utf8',
    );
    const footer = await readFile(
      join(projectDir, 'experimental', 'custom', 'footer', 'footer.svelte'),
      'utf8',
    );
    expect(header).toBe('<!-- customer header -->');
    expect(footer).toBe('<!-- customer footer -->');
  });

  it('backfills wrapper files the project is missing', async () => {
    await seedFrameworkSource();
    // Customer project predates the wrappers: header present, footer absent
    await seedCustomerProject({});

    await provide(
      updateProject({
        directory: Option.some(projectDir),
        local: Option.some(sourceDir),
        tag: Option.none(),
      }),
    );

    const header = await readFile(
      join(projectDir, 'experimental', 'custom', 'header', 'header.svelte'),
      'utf8',
    );
    const footer = await readFile(
      join(projectDir, 'experimental', 'custom', 'footer', 'footer.svelte'),
      'utf8',
    );
    expect(header).toBe('<!-- customer header -->');
    expect(footer).toBe('<!-- framework footer -->');
  });
});
