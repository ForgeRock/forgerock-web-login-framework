import { NodeContext } from '@effect/platform-node';
import { it } from '@effect/vitest';
import { Effect, Exit } from 'effect';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
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

describe('copyWithExclusions — sandbox semantics (custom/ is customer-owned)', () => {
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

  /**
   * Seeds the framework source with files across the whole custom/ tree,
   * including files no current guard mentions (a new framework file dropped
   * under custom/components/ in a future release). The default-deny sandbox
   * must skip all of them; only `includeSandbox: true` copies them.
   */
  const seedFrameworkSource = () =>
    Effect.gen(function* () {
      yield* Effect.promise(() =>
        Promise.all([
          mkdir(join(sourceDir, 'custom', 'components', 'callbacks'), { recursive: true }),
          mkdir(join(sourceDir, 'custom', 'components', 'stages'), { recursive: true }),
          mkdir(join(sourceDir, 'custom', 'components', 'layout'), { recursive: true }),
          mkdir(join(sourceDir, 'custom', 'components', 'demo', 'stages', 'custom-login'), {
            recursive: true,
          }),
        ]),
      );
      yield* Effect.promise(() =>
        Promise.all([
          writeFile(join(sourceDir, 'package.json'), '{}', 'utf8'),
          writeFile(join(sourceDir, 'README.md'), '# framework', 'utf8'),
          writeFile(
            join(sourceDir, 'custom', 'components', 'README.md'),
            '# framework custom readme',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'custom', 'components', 'login-framework.ts'),
            '// framework surface',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'custom', 'components', 'callbacks', 'framework-callback.svelte'),
            '<!-- framework -->',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'custom', 'components', 'stages', 'framework-stage.svelte'),
            '<!-- framework -->',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'custom', 'components', 'layout', 'header.svelte'),
            '<!-- framework header -->',
            'utf8',
          ),
          writeFile(
            join(sourceDir, 'custom', 'components', 'layout', 'footer.svelte'),
            '<!-- framework footer -->',
            'utf8',
          ),
          writeFile(
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
          ),
          // A framework file under custom/ no guard knows about: the future-release case.
          writeFile(
            join(sourceDir, 'custom', 'components', 'new-thing.txt'),
            '<!-- framework new thing -->',
            'utf8',
          ),
        ]),
      );
    });

  /** Every framework file the source seeds under custom/ — none may land in the target by default. */
  const sandboxFiles = [
    'custom/components/README.md',
    'custom/components/login-framework.ts',
    'custom/components/callbacks/framework-callback.svelte',
    'custom/components/stages/framework-stage.svelte',
    'custom/components/layout/header.svelte',
    'custom/components/layout/footer.svelte',
    'custom/components/demo/stages/custom-login/custom-login.svelte',
    'custom/components/new-thing.txt',
  ];

  it.effect('default copy skips the entire custom/ tree', () =>
    Effect.gen(function* () {
      yield* seedFrameworkSource();

      yield* copyWithExclusions(sourceDir, targetDir).pipe(Effect.provide(NodeContext.layer));

      for (const relativePath of sandboxFiles) {
        const exit = yield* Effect.exit(
          Effect.promise(() => readFile(join(targetDir, relativePath), 'utf8')),
        );
        expect(Exit.isFailure(exit), `${relativePath} must not be copied`).toBe(true);
      }

      // Unprotected framework content still copied
      const packageJson = yield* Effect.promise(() =>
        readFile(join(targetDir, 'package.json'), 'utf8'),
      );
      expect(packageJson).toBe('{}');
      // The framework's root README is contributor-facing (ship-or-skip
      // rule, see exclusions.ts): it never ships. init writes the
      // customer-facing README from templates/readme.md instead.
      const readmeExit = yield* Effect.exit(
        Effect.promise(() => readFile(join(targetDir, 'README.md'), 'utf8')),
      );
      expect(Exit.isFailure(readmeExit)).toBe(true);
    }),
  );

  it.effect('includeSandbox: true copies the custom/ tree (init: fresh project)', () =>
    Effect.gen(function* () {
      yield* seedFrameworkSource();

      yield* copyWithExclusions(sourceDir, targetDir, { includeSandbox: true }).pipe(
        Effect.provide(NodeContext.layer),
      );

      for (const relativePath of sandboxFiles) {
        const content = yield* Effect.promise(() =>
          readFile(join(targetDir, relativePath), 'utf8'),
        );
        expect(content.length, `${relativePath} must be copied`).toBeGreaterThan(0);
      }
    }),
  );

  it.effect('customer content under custom/ survives a default copy', () =>
    Effect.gen(function* () {
      yield* seedFrameworkSource();

      yield* Effect.promise(() =>
        mkdir(join(targetDir, 'custom', 'components', 'callbacks'), { recursive: true }),
      );
      yield* Effect.promise(() =>
        writeFile(
          join(targetDir, 'custom', 'components', 'callbacks', 'customer-callback.svelte'),
          '<!-- customer -->',
          'utf8',
        ),
      );

      yield* copyWithExclusions(sourceDir, targetDir).pipe(Effect.provide(NodeContext.layer));

      const customerCallback = yield* Effect.promise(() =>
        readFile(
          join(targetDir, 'custom', 'components', 'callbacks', 'customer-callback.svelte'),
          'utf8',
        ),
      );
      expect(customerCallback).toBe('<!-- customer -->');
    }),
  );

  it.effect('symlinked directories are skipped, never followed or written through', () =>
    Effect.gen(function* () {
      // A dev checkout (--local source) carries pnpm's symlink farm
      // (node_modules/...) and other links. The copy must not follow them:
      // stat() dereferences a link, so a symlinked directory would be walked
      // as a real directory and file copies would write THROUGH the link
      // into the link target. The walk skips every symlink entry instead.
      const outsideDir = join(sourceDir, 'outside');
      yield* Effect.promise(() => mkdir(outsideDir, { recursive: true }));
      yield* Effect.promise(() =>
        writeFile(join(outsideDir, 'outside.txt'), 'outside content', 'utf8'),
      );
      // A symlinked directory and a symlinked file, both pointing at the
      // content outside the copied tree.
      yield* Effect.promise(() => symlink(outsideDir, join(sourceDir, 'linked-dir')));
      yield* Effect.promise(() =>
        symlink(join(outsideDir, 'outside.txt'), join(sourceDir, 'linked-file.txt')),
      );
      yield* Effect.promise(() => writeFile(join(sourceDir, 'real.txt'), 'real content', 'utf8'));

      yield* copyWithExclusions(sourceDir, targetDir).pipe(Effect.provide(NodeContext.layer));

      // Real files still copied.
      const real = yield* Effect.promise(() => readFile(join(targetDir, 'real.txt'), 'utf8'));
      expect(real).toBe('real content');
      // The symlinked directory was not walked: nothing behind it landed
      // under the link's name.
      const followedExit = yield* Effect.exit(
        Effect.promise(() => readFile(join(targetDir, 'linked-dir', 'outside.txt'), 'utf8')),
      );
      expect(Exit.isFailure(followedExit)).toBe(true);
      // The symlinked file was not copied.
      const linkedFileExit = yield* Effect.exit(
        Effect.promise(() => readFile(join(targetDir, 'linked-file.txt'), 'utf8')),
      );
      expect(Exit.isFailure(linkedFileExit)).toBe(true);
      // And nothing was written through either link into the link target.
      const untouched = yield* Effect.promise(() =>
        readFile(join(outsideDir, 'outside.txt'), 'utf8'),
      );
      expect(untouched).toBe('outside content');
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
        readFile(join(targetDir, 'custom', 'components', 'layout', 'header.svelte'), 'utf8'),
      );
      const footer = yield* Effect.promise(() =>
        readFile(join(targetDir, 'custom', 'components', 'layout', 'footer.svelte'), 'utf8'),
      );
      expect(header).toBe('<!-- framework header -->');
      expect(footer).toBe('<!-- framework footer -->');
    }),
  );

  it.effect('never overwrites wrapper files the target already has', () =>
    Effect.gen(function* () {
      yield* seedWrapperTemplates();

      yield* Effect.promise(() =>
        mkdir(join(targetDir, 'custom', 'components', 'layout'), { recursive: true }),
      );
      yield* Effect.promise(() =>
        writeFile(
          join(targetDir, 'custom', 'components', 'layout', 'header.svelte'),
          '<!-- customer header -->',
          'utf8',
        ),
      );

      yield* copyWrapperFiles(targetDir, templatesDir).pipe(Effect.provide(NodeContext.layer));

      const header = yield* Effect.promise(() =>
        readFile(join(targetDir, 'custom', 'components', 'layout', 'header.svelte'), 'utf8'),
      );
      const footer = yield* Effect.promise(() =>
        readFile(join(targetDir, 'custom', 'components', 'layout', 'footer.svelte'), 'utf8'),
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
          readFile(join(targetDir, 'custom', 'components', 'layout', 'header.svelte'), 'utf8'),
        ),
      );
      expect(Exit.isFailure(headerExit)).toBe(true);
    }),
  );
});

describe('init scaffold + sandbox contract', () => {
  it('scaffolds callbacks/stages; wrapper files are init-placed, update-never-touched', () => {
    // CUSTOM_COMPONENT_DIRS (init scaffold) and CUSTOM_WRAPPER_FILES (init
    // wrapper placement) cover everything init writes inside custom/.
    // `update` writes nothing inside custom/ at all: the default-deny sandbox
    // skips the whole tree, and absent wrappers are seeded by the framework's
    // Vite plugin on the project's next build, not by the update copy.
    expect([...CUSTOM_COMPONENT_DIRS]).toEqual(['callbacks', 'stages']);
    expect([...CUSTOM_WRAPPER_FILES]).toEqual([
      'custom/components/layout/header.svelte',
      'custom/components/layout/footer.svelte',
    ]);
  });

  it('wrapper templates pair one CLI-shipped template per element (init only)', () => {
    // The copy source is the CLI's own templates/wrapper/ dir (shipped in
    // dist like the callback/stage templates), one per element, never a core/
    // path: tools/cli cannot depend on core/.
    expect([...WRAPPER_TEMPLATE_ELEMENTS]).toEqual(['header', 'footer']);
    expect([...CUSTOM_WRAPPER_FILES]).toEqual([
      'custom/components/layout/header.svelte',
      'custom/components/layout/footer.svelte',
    ]);
  });
});
