/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { customImportBoundary } from './vite-plugin-custom-imports';

/**
 * Unit tests for the Vite load-hook wrapper around checkCustomImports.
 * The checker logic itself is covered by custom-imports.test.ts: these
 * tests pin the plugin contract: which files it inspects, that it throws
 * a named, actionable error listing violations, and that it passes
 * everything else through to the next plugin in the chain.
 */

let fixtureRoot: string;

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'custom-imports-plugin-'));
  mkdirSync(join(fixtureRoot, 'custom/components/stages/canary'), { recursive: true });
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

/** Creates a plugin instance against the fixture root. */
const makePlugin = () => customImportBoundary({ projectRoot: fixtureRoot });

describe('customImportBoundary (load hook)', () => {
  it('declares the plugin identity and pre-enforce ordering', () => {
    const plugin = makePlugin();
    expect(plugin.name).toBe('framework-core:custom-import-boundary');
    expect(plugin.enforce).toBe('pre');
  });

  it('throws an error listing violations for a file with a forbidden import', () => {
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/canary.svelte');
    writeFileSync(
      filePath,
      [
        '<script lang="ts">',
        "  import { styleStore } from '$core/style.store';",
        '</script>',
        '',
        '<div>broken</div>',
      ].join('\n'),
    );

    expect(() => makePlugin().load(filePath)).toThrow(
      /Custom component import boundary violated in .*canary\.svelte[\s\S]*forbidden-alias[\s\S]*"\$core\/style\.store"[\s\S]*\$login-framework/,
    );
  });

  it('aggregates every violation in the file into the single thrown error', () => {
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/canary.svelte');
    writeFileSync(
      filePath,
      [
        '<script lang="ts">',
        "  import { styleStore } from '$core/style.store';",
        "  import { journeyStore } from '$journey/journey.store';",
        '</script>',
      ].join('\n'),
    );

    let message = '';
    try {
      makePlugin().load(filePath);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('$core/style.store');
    expect(message).toContain('$journey/journey.store');
    // 1-based line numbers for both violations.
    expect(message).toMatch(/canary\.svelte:2/);
    expect(message).toMatch(/canary\.svelte:3/);
  });

  it('passes a clean file through (returns null, no throw)', () => {
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/canary.svelte');
    writeFileSync(
      filePath,
      [
        '<script lang="ts">',
        "  import { Button } from '$login-framework';",
        "  import Label from '../shared/label.svelte';",
        '</script>',
        '',
        '<Button /><Label />',
      ].join('\n'),
    );
    mkdirSync(join(fixtureRoot, 'custom/components/stages/shared'), { recursive: true });
    writeFileSync(join(fixtureRoot, 'custom/components/stages/shared/label.svelte'), '<span />');

    expect(makePlugin().load(filePath)).toBeNull();
  });

  it('skips excluded files (stories, mocks, tests, the curated surface)', () => {
    const storyPath = join(fixtureRoot, 'custom/components/stages/canary/canary.story.svelte');
    writeFileSync(
      storyPath,
      "<script>\n  import { styleStore } from '$core/style.store';\n</script>",
    );
    expect(makePlugin().load(storyPath)).toBeNull();

    const surfacePath = join(fixtureRoot, 'custom/components/login-framework.ts');
    writeFileSync(surfacePath, "export { styleStore } from '$core/style.store';");
    expect(makePlugin().load(surfacePath)).toBeNull();
  });

  it('ignores files outside custom/components/', () => {
    mkdirSync(join(fixtureRoot, 'core'), { recursive: true });
    const outsidePath = join(fixtureRoot, 'core/style.store.ts');
    writeFileSync(outsidePath, "export { styleStore } from '$core/style.store';");
    expect(makePlugin().load(outsidePath)).toBeNull();
  });

  it('strips query strings and virtual-module prefixes from ids', () => {
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/canary.svelte');
    writeFileSync(
      filePath,
      '<script lang="ts">\n  import { styleStore } from \'$core/style.store\';\n</script>',
    );

    expect(() => makePlugin().load(`${filePath}?raw`)).toThrow(/boundary violated/);
    // Virtual modules (\0-prefixed) never map to a real file, so they are skipped.
    expect(makePlugin().load(`\0${filePath}`)).toBeNull();
  });

  it('skips non-source files (no ts/js/svelte extension)', () => {
    const cssPath = join(fixtureRoot, 'custom/components/stages/canary/canary.css');
    writeFileSync(cssPath, "/* nothing to check */\n@import url('$core/nope.css');");
    expect(makePlugin().load(cssPath)).toBeNull();
  });

  it('skips ids that do not exist on disk', () => {
    expect(makePlugin().load('/definitely/not/a/real/file.ts')).toBeNull();
  });

  it('catches a forbidden import even when hostile markup precedes the script block', () => {
    // Reproduced bypass: a lone backtick in markup desynced the old
    // whole-file TS parse and swallowed the forbidden import entirely.
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/canary.svelte');
    writeFileSync(
      filePath,
      [
        '<div>prices start at `99</div>',
        '<script lang="ts">',
        "  import { styleStore } from '$core/style.store';",
        '</script>',
      ].join('\n'),
    );
    expect(() => makePlugin().load(filePath)).toThrow(
      /forbidden-alias[\s\S]*"\$core\/style\.store"/,
    );
  });

  it('catches import.meta.glob (dynamic module map the TS AST never sees)', () => {
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/canary.svelte');
    writeFileSync(
      filePath,
      [
        '<script lang="ts">',
        '  const modules = import.meta.glob("../../core/*.ts");',
        '</script>',
      ].join('\n'),
    );
    expect(() => makePlugin().load(filePath)).toThrow(/forbidden-dynamic/);
  });

  it('catches a computed dynamic import (import(x)) as forbidden-dynamic', () => {
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/dynamic.mts');
    writeFileSync(filePath, `const mod = await import(basePath + '/core/style.store');\n`);
    expect(() => makePlugin().load(filePath)).toThrow(/forbidden-dynamic/);
  });

  it('inspects .mjs and .mts files, not only .ts/.js/.svelte', () => {
    const mjsPath = join(fixtureRoot, 'custom/components/stages/canary/helper.mjs');
    writeFileSync(mjsPath, `export { styleStore } from '$core/style.store';\n`);
    expect(() => makePlugin().load(mjsPath)).toThrow(/forbidden-alias/);
  });

  it('inspects .cjs files and their require() calls', () => {
    const cjsPath = join(fixtureRoot, 'custom/components/stages/canary/legacy.cjs');
    writeFileSync(cjsPath, `const store = require('$core/style.store');\n`);
    expect(() => makePlugin().load(cjsPath)).toThrow(/forbidden-alias/);
  });

  it('catches a dynamic import inside a markup expression ({#await import(...)})', () => {
    // Svelte 5 compiles template expressions into real runtime imports; the
    // extractor slices expression ranges out of the markup AST.
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/awaited.svelte');
    writeFileSync(
      filePath,
      [`{#await import('$core/style.store') then mod}`, `  <p>{mod}</p>`, `{/await}`].join('\n'),
    );
    expect(() => makePlugin().load(filePath)).toThrow(/forbidden-alias/);
  });

  it('catches a multiline import.meta.glob call', () => {
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/glob.svelte');
    writeFileSync(
      filePath,
      ['<script>', 'const m = import.meta.glob(', '  "../../core/*.ts"', ');', '</script>'].join(
        '\n',
      ),
    );
    expect(() => makePlugin().load(filePath)).toThrow(/forbidden-dynamic/);
  });

  it('scans a TS file with an embedded <script> string as plain TS, not Svelte', () => {
    // Completeness-critic regression probe: a text-based Svelte check
    // misrouted this file through the Svelte extractor, which only scanned
    // the code inside the string-embedded pair and missed the real import.
    const filePath = join(fixtureRoot, 'custom/components/stages/canary/embedded.ts');
    writeFileSync(
      filePath,
      [
        `const html = "<script>const x = 1;</script>";`,
        `import { styleStore } from '$core/style.store';`,
      ].join('\n'),
    );
    expect(() => makePlugin().load(filePath)).toThrow(/forbidden-alias/);
  });

  it('fails a production file importing an exempt mock file (forbidden-exempt-import)', () => {
    // The mock file itself is skipped by the load hook, but a production
    // stage importing it must fail: the exempt target is never scanned, so
    // anything it re-exports would reach the bundle unchecked.
    const mockPath = join(fixtureRoot, 'custom/components/stages/canary/internals.mock.ts');
    writeFileSync(mockPath, `export { styleStore } from '$core/style.store';\n`);
    const stagePath = join(fixtureRoot, 'custom/components/stages/canary/canary.svelte');
    writeFileSync(
      stagePath,
      `<script lang="ts">\n  import { internals } from './internals.mock';\n</script>\n`,
    );

    expect(() => makePlugin().load(stagePath)).toThrow(
      /forbidden-exempt-import[\s\S]*"\.\/internals\.mock"/,
    );
    // The mock file itself still loads without a boundary error.
    expect(makePlugin().load(mockPath)).toBeNull();
  });
});
