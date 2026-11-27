/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { surfaceDist } from './vite-plugin-surface-dist';

/**
 * Unit tests for the package-build plugin that writes the compiled curated
 * surface module (`dist/login-framework.js` and the server-tree twin). The
 * tests run the plugin's hooks against a sandbox fixture tree: a surface
 * file with one runtime re-export, and the `dist/` output directory the
 * plugin writes into. A missing surface file must fail with the restore
 * instructions, not Vite's raw ENOENT.
 *
 * The write happens in `writeBundle`, which Rollup runs only after every
 * output file was written successfully: on a failed build (`rollup()` or
 * `bundle.write()` rejects) the hook either never runs or would run with the
 * build error as its argument, so the surface file must never appear in a
 * broken dist tree (a partial dist would let downstream existsSync checks
 * pass and hide the real build error).
 */

const sandboxRoot = join(tmpdir(), 'framework-core-surface-dist-fixture');

/** A minimal valid surface: one runtime re-export the generator can map. */
const SURFACE_TEXT = "export { interpolate } from '$core/_utilities/i18n.utilities';\n";

let packageRoot: string;
let surfaceFile: string;

beforeAll(() => {
  packageRoot = join(sandboxRoot, 'core');
  surfaceFile = join(sandboxRoot, 'custom', 'components', 'login-framework.ts');
});

afterAll(() => {
  rmSync(sandboxRoot, { recursive: true, force: true });
});

afterEach(() => {
  rmSync(join(packageRoot, 'dist'), { recursive: true, force: true });
  rmSync(join(packageRoot, 'dist-server'), { recursive: true, force: true });
  rmSync(surfaceFile, { force: true });
});

const surfacePath = (tree: 'client' | 'server'): string =>
  join(packageRoot, tree === 'client' ? 'dist' : 'dist-server', 'login-framework.js');

const plugin = (tree: 'client' | 'server') => surfaceDist({ packageRoot, tree, surfaceFile });

describe('surfaceDist', () => {
  it('writes the compiled surface module into the dist tree on writeBundle', () => {
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('client').writeBundle({}, {});

    const written = readFileSync(surfacePath('client'), 'utf8');
    expect(written).toContain("export { interpolate } from './_utilities/i18n.utilities.js';");
  });

  it('leaves no temp file behind after a successful write', () => {
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('client').writeBundle({}, {});

    const distEntries = readdirSync(join(packageRoot, 'dist'));
    expect(distEntries).toEqual(['login-framework.js']);
  });

  it('writes the server tree into dist-server', () => {
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('server').writeBundle({}, {});

    const written = readFileSync(surfacePath('server'), 'utf8');
    expect(written).toContain("export { interpolate } from './_utilities/i18n.utilities.js';");
  });

  it('never writes when closeBundle runs with a build error (failed build)', () => {
    // Rollup 4 calls closeBundle with the build error as the first argument
    // when `rollup()` itself fails (plugins throwing in load/transform). The
    // plugin must ignore that call entirely: a surface file in a dist tree
    // whose real build failed would make downstream existsSync checks pass
    // and hide the error.
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('client').closeBundle(new Error('simulated build error'));

    expect(existsSync(surfacePath('client'))).toBe(false);
  });

  it('never writes when closeBundle runs without arguments (failed write phase)', () => {
    // When the render/write phase fails (generateBundle throws), Rollup calls
    // closeBundle with no arguments on the later close() (and writeBundle
    // never ran). The plugin must likewise ignore that call.
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('client').closeBundle();

    expect(existsSync(surfacePath('client'))).toBe(false);
  });

  it('fails with restore instructions when the curated surface file is missing', () => {
    // No surface file written: the project predates the sandbox or it was deleted.
    expect(() => plugin('client').writeBundle({}, {})).toThrow(/curated surface file is missing/);
    try {
      plugin('client').writeBundle({}, {});
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toContain(surfaceFile);
      expect(message).toContain('ping-lf update');
      // Not a raw ENOENT leak: the error must name the file and the fix.
      expect(message).not.toMatch(/^ENOENT/);
    }
  });
});
