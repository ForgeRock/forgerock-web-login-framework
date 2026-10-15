import { NodeContext } from '@effect/platform-node';
import { it } from '@effect/vitest';
import { Effect, Exit } from 'effect';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { CUSTOM_COMPONENT_DIRS } from '../src/commands/init.js';
import {
  copyWithExclusions,
  copyWrapperFiles,
  CUSTOM_WRAPPER_FILES,
  expandTilde,
  WRAPPER_TEMPLATE_ELEMENTS,
} from '../src/services/file-system.js';

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

describe('copyWithExclusions — protected custom component paths', () => {
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
      // Protected custom component dirs and wrapper files that must NOT be
      // copied over customer content
      yield* Effect.promise(() =>
        Promise.all([
          mkdir(join(sourceDir, 'experimental', 'custom', 'callbacks'), { recursive: true }),
          mkdir(join(sourceDir, 'experimental', 'custom', 'stages'), { recursive: true }),
          mkdir(join(sourceDir, 'experimental', 'custom', 'header'), { recursive: true }),
          mkdir(join(sourceDir, 'experimental', 'custom', 'footer'), { recursive: true }),
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
            join(sourceDir, 'experimental', 'custom', 'header', 'header.svelte'),
            '<!-- framework header -->',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'experimental', 'custom', 'footer', 'footer.svelte'),
            '<!-- framework footer -->',
            'utf8',
          ),
        ]),
      );
    });

  it.effect('does not copy framework component dirs or wrapper files over customer content', () =>
    Effect.gen(function* () {
      yield* seedSource();

      // Customer content already in the target (what a customer project owns)
      yield* Effect.promise(() =>
        Promise.all([
          mkdir(join(targetDir, 'experimental', 'custom', 'callbacks'), { recursive: true }),
          mkdir(join(targetDir, 'experimental', 'custom', 'stages'), { recursive: true }),
          mkdir(join(targetDir, 'experimental', 'custom', 'header'), { recursive: true }),
        ]),
      );
      yield* Effect.promise(() =>
        Promise.all([
          writeFile(
            join(targetDir, 'experimental', 'custom', 'callbacks', 'customer-callback.svelte'),
            '<!-- customer -->',
            'utf8',
          ),
          writeFile(
            join(targetDir, 'experimental', 'custom', 'stages', 'customer-stage.svelte'),
            '<!-- customer -->',
            'utf8',
          ),
          writeFile(
            join(targetDir, 'experimental', 'custom', 'header', 'header.svelte'),
            '<!-- customer header -->',
            'utf8',
          ),
        ]),
      );

      // it.effect's default runtime has no platform services; NodeContext
      // supplies the real Node FileSystem/Path that copyWithExclusions needs.
      yield* copyWithExclusions(sourceDir, targetDir).pipe(Effect.provide(NodeContext.layer));

      // Customer-edited wrapper file survives untouched
      const customerHeader = yield* Effect.promise(() =>
        readFile(join(targetDir, 'experimental', 'custom', 'header', 'header.svelte'), 'utf8'),
      );
      expect(customerHeader).toBe('<!-- customer header -->');

      // None of the framework's protected-dir components landed: each read rejects
      const frameworkFiles = [
        join(targetDir, 'experimental', 'custom', 'callbacks', 'framework-callback.svelte'),
        join(targetDir, 'experimental', 'custom', 'stages', 'framework-stage.svelte'),
      ];
      for (const file of frameworkFiles) {
        const exit = yield* Effect.exit(Effect.promise(() => readFile(file, 'utf8')));
        expect(Exit.isFailure(exit)).toBe(true);
      }

      // The wrapper file the target lacks is NOT created by the bulk copy.
      // Backfilling absent wrappers is copyWrapperFiles' job, not the copy guard's.
      const footerExit = yield* Effect.exit(
        Effect.promise(() =>
          readFile(join(targetDir, 'experimental', 'custom', 'footer', 'footer.svelte'), 'utf8'),
        ),
      );
      expect(Exit.isFailure(footerExit)).toBe(true);

      // Unprotected framework content still copied
      const packageJson = yield* Effect.promise(() =>
        readFile(join(targetDir, 'package.json'), 'utf8'),
      );
      expect(packageJson).toBe('{}');
    }),
  );
});

describe('copyWrapperFiles — fill-if-absent wrapper backfill from the CLI wrapper templates', () => {
  let templatesDir: string;
  let targetDir: string;

  beforeEach(async () => {
    templatesDir = await mkdtemp(join(tmpdir(), 'ping-lf-wrap-tpl-test-'));
    targetDir = await mkdtemp(join(tmpdir(), 'ping-lf-wrap-tgt-test-'));
  });

  afterEach(async () => {
    await rm(templatesDir, { recursive: true, force: true });
    await rm(targetDir, { recursive: true, force: true });
  });

  // The copy source is the CLI's own shipped templates (templates/wrapper/),
  // mirroring the callback/stage scaffold templates. The CLI never reads the
  // framework's core/ tree: build-time vs. runtime boundary.
  const seedWrapperTemplates = () =>
    Effect.gen(function* () {
      yield* Effect.promise(() => mkdir(join(templatesDir, 'wrapper'), { recursive: true }));
      yield* Effect.promise(() =>
        Promise.all([
          writeFile(
            join(templatesDir, 'wrapper', 'header.svelte'),
            '<!-- framework header -->',
            'utf8',
          ),
          writeFile(
            join(templatesDir, 'wrapper', 'footer.svelte'),
            '<!-- framework footer -->',
            'utf8',
          ),
        ]),
      );
    });

  it.effect('copies wrapper files that are absent from the target', () =>
    Effect.gen(function* () {
      yield* seedWrapperTemplates();

      yield* copyWrapperFiles(targetDir, templatesDir).pipe(Effect.provide(NodeContext.layer));

      const header = yield* Effect.promise(() =>
        readFile(join(targetDir, 'experimental', 'custom', 'header', 'header.svelte'), 'utf8'),
      );
      const footer = yield* Effect.promise(() =>
        readFile(join(targetDir, 'experimental', 'custom', 'footer', 'footer.svelte'), 'utf8'),
      );
      expect(header).toBe('<!-- framework header -->');
      expect(footer).toBe('<!-- framework footer -->');
    }),
  );

  it.effect('never overwrites wrapper files the target already has', () =>
    Effect.gen(function* () {
      yield* seedWrapperTemplates();

      yield* Effect.promise(() =>
        mkdir(join(targetDir, 'experimental', 'custom', 'header'), { recursive: true }),
      );
      yield* Effect.promise(() =>
        writeFile(
          join(targetDir, 'experimental', 'custom', 'header', 'header.svelte'),
          '<!-- customer header -->',
          'utf8',
        ),
      );

      yield* copyWrapperFiles(targetDir, templatesDir).pipe(Effect.provide(NodeContext.layer));

      const header = yield* Effect.promise(() =>
        readFile(join(targetDir, 'experimental', 'custom', 'header', 'header.svelte'), 'utf8'),
      );
      const footer = yield* Effect.promise(() =>
        readFile(join(targetDir, 'experimental', 'custom', 'footer', 'footer.svelte'), 'utf8'),
      );
      expect(header).toBe('<!-- customer header -->');
      expect(footer).toBe('<!-- framework footer -->');
    }),
  );

  it.effect('no-ops when no wrapper templates are shipped', () =>
    Effect.gen(function* () {
      // templatesDir stays empty. Older CLI versions ship no wrapper
      // templates, and the framework versions they pair with do not import
      // wrappers either, so skipping is safe.

      yield* copyWrapperFiles(targetDir, templatesDir).pipe(Effect.provide(NodeContext.layer));

      const headerExit = yield* Effect.exit(
        Effect.promise(() =>
          readFile(join(targetDir, 'experimental', 'custom', 'header', 'header.svelte'), 'utf8'),
        ),
      );
      expect(Exit.isFailure(headerExit)).toBe(true);
    }),
  );
});

describe('init scaffold + update guard coverage', () => {
  it('scaffolds callbacks/stages only; the wrapper files are the protected file set', () => {
    // CUSTOM_COMPONENT_DIRS (init scaffold) and the copy guard in
    // services/file-system must agree: callbacks/stages are dir-protected,
    // and the framework-shipped wrapper files are file-protected so `update`
    // can never overwrite customer edits to them.
    expect([...CUSTOM_COMPONENT_DIRS]).toEqual(['callbacks', 'stages']);
    expect([...CUSTOM_WRAPPER_FILES]).toEqual([
      'experimental/custom/header/header.svelte',
      'experimental/custom/footer/footer.svelte',
    ]);
  });

  it('wrapper backfill pairs one CLI-shipped template per element', () => {
    // The copy source is the CLI's own templates/wrapper/ dir (shipped in
    // dist like the callback/stage templates), one per element, never a core/
    // path: tools/cli cannot depend on core/.
    expect([...WRAPPER_TEMPLATE_ELEMENTS]).toEqual(['header', 'footer']);
    expect([...CUSTOM_WRAPPER_FILES]).toEqual([
      'experimental/custom/header/header.svelte',
      'experimental/custom/footer/footer.svelte',
    ]);
  });
});
