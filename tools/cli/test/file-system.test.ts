import { NodeContext } from '@effect/platform-node';
import { it } from '@effect/vitest';
import { Effect, Exit } from 'effect';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { CUSTOM_COMPONENT_DIRS } from '../src/commands/init.js';
import { copyWithExclusions, expandTilde } from '../src/services/file-system.js';

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

  const seedSource = () =>
    Effect.gen(function* () {
      // Protected custom component dirs that must NOT be copied over customer content
      yield* Effect.promise(() =>
        Promise.all([
          mkdir(join(sourceDir, 'experimental', 'custom', 'callbacks'), { recursive: true }),
          mkdir(join(sourceDir, 'experimental', 'custom', 'stages'), { recursive: true }),
          mkdir(join(sourceDir, 'experimental', 'custom', 'headers'), { recursive: true }),
          mkdir(join(sourceDir, 'experimental', 'custom', 'footers'), { recursive: true }),
        ]),
      );
      // Framework content that IS copied (files after their dirs exist)
      yield* Effect.promise(() =>
        Promise.all([
          writeFile(join(sourceDir, 'package.json'), '{}', 'utf8'),
          writeFile(join(sourceDir, 'README.md'), '# framework', 'utf8'),
          writeFile(
            join(sourceDir, 'experimental', 'custom', 'callbacks', 'framework-callback.svelte'),
            '<!-- framework -->',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'experimental', 'custom', 'stages', 'framework-stage.svelte'),
            '<!-- framework -->',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'experimental', 'custom', 'headers', 'framework-header.svelte'),
            '<!-- framework -->',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'experimental', 'custom', 'footers', 'framework-footer.svelte'),
            '<!-- framework -->',
            'utf8',
          ),
        ]),
      );
    });

  it.effect(
    'does not copy framework callback/stage/header/footer components over customer directories',
    () =>
      Effect.gen(function* () {
        yield* seedSource();

        // Customer content already in the target (what a customer project owns)
        yield* Effect.promise(() =>
          mkdir(join(targetDir, 'experimental', 'custom', 'headers'), { recursive: true }),
        );
        yield* Effect.promise(() =>
          writeFile(
            join(targetDir, 'experimental', 'custom', 'headers', 'customer-header.svelte'),
            '<!-- customer -->',
            'utf8',
          ),
        );

        // it.effect's default runtime has no platform services; NodeContext
        // supplies the real Node FileSystem/Path that copyWithExclusions needs.
        yield* copyWithExclusions(sourceDir, targetDir).pipe(Effect.provide(NodeContext.layer));

        // Customer file survives
        const customerContent = yield* Effect.promise(() =>
          readFile(
            join(targetDir, 'experimental', 'custom', 'headers', 'customer-header.svelte'),
            'utf8',
          ),
        );
        expect(customerContent).toBe('<!-- customer -->');

        // None of the framework's protected-dir components landed: each read rejects
        const frameworkFiles = [
          join(targetDir, 'experimental', 'custom', 'callbacks', 'framework-callback.svelte'),
          join(targetDir, 'experimental', 'custom', 'stages', 'framework-stage.svelte'),
          join(targetDir, 'experimental', 'custom', 'headers', 'framework-header.svelte'),
          join(targetDir, 'experimental', 'custom', 'footers', 'framework-footer.svelte'),
        ];
        for (const file of frameworkFiles) {
          const exit = yield* Effect.exit(Effect.promise(() => readFile(file, 'utf8')));
          expect(Exit.isFailure(exit)).toBe(true);
        }

        // Unprotected framework content still copied
        const packageJson = yield* Effect.promise(() =>
          readFile(join(targetDir, 'package.json'), 'utf8'),
        );
        expect(packageJson).toBe('{}');
      }),
  );
});

describe('CUSTOM_COMPONENT_DIRS — init scaffold list', () => {
  it('scaffolds all four custom component dirs, matching PROTECTED_DIRS coverage', () => {
    // PROTECTED_DIRS is private; the framework-side dirs that hold user
    // components are exactly these four. CUSTOM_COMPONENT_DIRS (init scaffold)
    // and PROTECTED_DIRS (update copy guard) must cover the same set.
    expect([...CUSTOM_COMPONENT_DIRS]).toEqual(['callbacks', 'stages', 'headers', 'footers']);
  });
});
