/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { surfaceDist } from './vite-plugin-surface-dist';

/**
 * Unit tests for the package-build plugin that writes the compiled curated
 * surface module (`dist/login-framework.js` and the server-tree twin). The
 * tests run the plugin's `closeBundle` against a sandbox fixture tree: a
 * surface file with one runtime re-export, and the `dist/` output directory
 * the plugin writes into. A missing surface file must fail with the restore
 * instructions, not Vite's raw ENOENT.
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

const plugin = (tree: 'client' | 'server') =>
  surfaceDist({ packageRoot, tree, surfaceFile }) as { closeBundle: () => void };

describe('surfaceDist', () => {
  it('writes the compiled surface module into the dist tree on closeBundle', () => {
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('client').closeBundle();

    const written = readFileSync(join(packageRoot, 'dist', 'login-framework.js'), 'utf8');
    expect(written).toContain("export { interpolate } from './_utilities/i18n.utilities.js';");
  });

  it('leaves no temp file behind after a successful write', () => {
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('client').closeBundle();

    const distEntries = readdirSync(join(packageRoot, 'dist'));
    expect(distEntries).toEqual(['login-framework.js']);
  });

  it('writes the server tree into dist-server', () => {
    mkdirSync(join(surfaceFile, '..'), { recursive: true });
    writeFileSync(surfaceFile, SURFACE_TEXT, 'utf8');

    plugin('server').closeBundle();

    const written = readFileSync(join(packageRoot, 'dist-server', 'login-framework.js'), 'utf8');
    expect(written).toContain("export { interpolate } from './_utilities/i18n.utilities.js';");
  });

  it('fails with restore instructions when the curated surface file is missing', () => {
    // No surface file written: the project predates the sandbox or it was deleted.
    expect(() => plugin('client').closeBundle()).toThrow(/curated surface file is missing/);
    try {
      plugin('client').closeBundle();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toContain(surfaceFile);
      expect(message).toContain('ping-lf update');
      // Not a raw ENOENT leak: the error must name the file and the fix.
      expect(message).not.toMatch(/^ENOENT/);
    }
  });
});
