import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CUSTOM_COMPONENT_DIRS } from '../src/commands/init.js';
import { copyWithExclusions, expandTilde } from '../src/services/file-system.js';

import type { FileSystem, Path } from '@effect/platform';

const provide = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem | Path.Path>) =>
  Effect.runPromise(Effect.provide(eff, NodeContext.layer) as Effect.Effect<A, E, never>);

describe('expandTilde', () => {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '~';

  it('expands ~/... paths', () => {
    expect(expandTilde('~/Documents/projects/foo')).toBe(`${home}/Documents/projects/foo`);
  });

  it('expands bare ~', () => {
    expect(expandTilde('~')).toBe(home);
  });

  it('leaves absolute paths unchanged', () => {
    expect(expandTilde('/Users/gabriel/foo')).toBe('/Users/gabriel/foo');
  });

  it('leaves relative paths unchanged', () => {
    expect(expandTilde('./foo/bar')).toBe('./foo/bar');
    expect(expandTilde('foo/bar')).toBe('foo/bar');
  });

  it('does not expand ~ in the middle of a path', () => {
    expect(expandTilde('/foo/~/bar')).toBe('/foo/~/bar');
  });
});

describe('copyWithExclusions — protected custom component dirs', () => {
  let sourceDir: string;
  let targetDir: string;

  beforeEach(async () => {
    sourceDir = await mkdtemp(join(tmpdir(), 'ping-lf-fs-src-test-'));
    targetDir = await mkdtemp(join(tmpdir(), 'ping-lf-fs-tgt-test-'));
  });

  afterEach(async () => {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(targetDir, { recursive: true, force: true });
  });

  const seedSource = async () => {
    // Framework content that IS copied
    await writeFile(join(sourceDir, 'package.json'), '{}', 'utf8');
    await writeFile(join(sourceDir, 'README.md'), '# framework', 'utf8');
    // Protected custom component dirs that must NOT be copied over customer content
    await mkdir(join(sourceDir, 'experimental', 'custom', 'callbacks'), { recursive: true });
    await mkdir(join(sourceDir, 'experimental', 'custom', 'stages'), { recursive: true });
    await mkdir(join(sourceDir, 'experimental', 'custom', 'headers'), { recursive: true });
    await mkdir(join(sourceDir, 'experimental', 'custom', 'footers'), { recursive: true });
    await writeFile(
      join(sourceDir, 'experimental', 'custom', 'callbacks', 'framework-callback.svelte'),
      '<!-- framework -->',
      'utf8',
    );
    await writeFile(
      join(sourceDir, 'experimental', 'custom', 'stages', 'framework-stage.svelte'),
      '<!-- framework -->',
      'utf8',
    );
    await writeFile(
      join(sourceDir, 'experimental', 'custom', 'headers', 'framework-header.svelte'),
      '<!-- framework -->',
      'utf8',
    );
    await writeFile(
      join(sourceDir, 'experimental', 'custom', 'footers', 'framework-footer.svelte'),
      '<!-- framework -->',
      'utf8',
    );
  };

  it('does not copy framework callback/stage/header/footer components over customer directories', async () => {
    await seedSource();

    // Customer content already in the target (what a customer project owns)
    await mkdir(join(targetDir, 'experimental', 'custom', 'headers'), { recursive: true });
    await writeFile(
      join(targetDir, 'experimental', 'custom', 'headers', 'customer-header.svelte'),
      '<!-- customer -->',
      'utf8',
    );

    await provide(copyWithExclusions(sourceDir, targetDir));

    // Customer file survives
    const customerContent = await readFile(
      join(targetDir, 'experimental', 'custom', 'headers', 'customer-header.svelte'),
      'utf8',
    );
    expect(customerContent).toBe('<!-- customer -->');

    // None of the framework's protected-dir components landed
    const frameworkFiles = [
      join(targetDir, 'experimental', 'custom', 'callbacks', 'framework-callback.svelte'),
      join(targetDir, 'experimental', 'custom', 'stages', 'framework-stage.svelte'),
      join(targetDir, 'experimental', 'custom', 'headers', 'framework-header.svelte'),
      join(targetDir, 'experimental', 'custom', 'footers', 'framework-footer.svelte'),
    ];
    for (const file of frameworkFiles) {
      await expect(readFile(file, 'utf8')).rejects.toThrow();
    }

    // Unprotected framework content still copied
    const packageJson = await readFile(join(targetDir, 'package.json'), 'utf8');
    expect(packageJson).toBe('{}');
  });
});

describe('CUSTOM_COMPONENT_DIRS — init scaffold list', () => {
  it('scaffolds all four custom component dirs, matching PROTECTED_DIRS coverage', () => {
    // PROTECTED_DIRS is private; the framework-side dirs that hold user
    // components are exactly these four. CUSTOM_COMPONENT_DIRS (init scaffold)
    // and PROTECTED_DIRS (update copy guard) must cover the same set.
    expect([...CUSTOM_COMPONENT_DIRS]).toEqual(['callbacks', 'stages', 'headers', 'footers']);
  });
});
