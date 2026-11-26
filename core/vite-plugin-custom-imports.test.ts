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
 * The checker logic itself is covered by custom-imports.test.ts — these
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
    // Virtual modules (\0-prefixed) never map to a real file — must be skipped.
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
});
