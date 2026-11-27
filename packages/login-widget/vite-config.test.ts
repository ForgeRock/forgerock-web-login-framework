/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it, vi } from 'vitest';

import appConfig from '../../apps/login-app/vite.config';
import { packageDedupe } from '../../core/vite-shared';
import esmConfig from './vite.config';
import iifeConfig from './vite.config.iife';

import type { UserConfigExport } from 'vite';

// sveltekit() loads the app's svelte.config.js, which pulls a second copy of
// svelte-preprocess into the process; the dedupe assertion needs only the config shape.
// The path is the app's own resolution of '@sveltejs/kit/vite': a bare specifier would
// resolve from this package, where kit is not installed, and miss the app config's import.
vi.mock('../../apps/login-app/node_modules/@sveltejs/kit/src/exports/vite/index.js', () => ({
  sveltekit: () => [],
}));

describe('widget ESM build bundling', () => {
  const rollupOptions = esmConfig.build?.rollupOptions;
  const output = Array.isArray(rollupOptions?.output)
    ? rollupOptions?.output[0]
    : rollupOptions?.output;

  it('bundles the framework-core dist into the widget output (no external)', () => {
    // `framework-core` is a private workspace package that is never published:
    // emitted `framework-core/dist/...` imports could not resolve on an npm
    // consumer's machine, so the ESM build must inline the framework.
    expect(rollupOptions?.external).toBeUndefined();
  });

  it('emits no framework-core specifier rewrite (output paths absent)', () => {
    expect(output?.paths).toBeUndefined();
  });
});

describe('widget runtime dependencies', () => {
  function readPackageManifest(): {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  } {
    return JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'));
  }

  it('declares no framework-core dependency (private package, bundled)', () => {
    const manifest = readPackageManifest();
    expect(Object.keys(manifest.dependencies ?? {})).not.toContain('framework-core');
    expect(Object.keys(manifest.peerDependencies ?? {})).not.toContain('framework-core');
  });

  it('built ESM artifact holds zero framework-core specifiers (post-build guard)', () => {
    // Config-level checks above prove intent; this proves the artifact.
    // dist/index.js is gitignored build output: skipped when unbuilt (fresh
    // checkouts, the CI test job). The CI build job runs build:release but
    // not the vitest suite, so the guard bites on local and release builds
    // run via `pnpm test` after a build, not in CI. `framework-core` is a
    // private workspace package; a single emitted specifier would be
    // unresolvable on an npm consumer's machine (F1's original defect).
    const artifact = resolve(import.meta.dirname, 'dist/index.js');
    if (!existsSync(artifact)) {
      return;
    }
    const code = readFileSync(artifact, 'utf8');
    // Specifier boundary: a quote or the start of `framework-core/dist/`
    // or `framework-core/...` import paths. `framework-core-surface` as a
    // substring of an unrelated identifier would not be a module specifier.
    expect(
      code.match(/['"]framework-core\//) ?? code.match(/^import\s+['"]framework-core['"]/m),
    ).toBeNull();
  });
});

/**
 * Specifiers in the consumer manifests for the shared deps. The dep list
 * itself is `packageDedupe` in `core/vite-shared.ts` — the single source the
 * three consumer configs spread into `resolve.dedupe` and this file iterates.
 */
const SHARED_SPECIFIERS: Readonly<Record<string, string>> = {
  svelte: '^5.55.7',
  '@forgerock/journey-client': '^2.3.1',
  '@forgerock/oidc-client': '^2.3.1',
  '@forgerock/protect': '^2.3.1',
  '@forgerock/storage': '^2.3.1',
};

describe('single runtime, one copy per shared dependency', () => {
  const repoRoot = resolve(import.meta.dirname, '../..');
  const lockfile = readFileSync(resolve(repoRoot, 'pnpm-lock.yaml'), 'utf8');

  const lockfileSection = (startMarker: string, endMarker: string): string =>
    lockfile.slice(lockfile.indexOf(startMarker), lockfile.indexOf(endMarker));

  const uniqueMatches = (text: string, pattern: RegExp): ReadonlyArray<string> =>
    Array.from(new Set(Array.from(text.matchAll(pattern), (match) => match[1])));

  const resolveConfig = async (config: UserConfigExport) =>
    typeof config === 'function' ? config({ command: 'build', mode: 'production' }) : config;

  // pnpm lockfile v9 nests every importer dependency at the same 6/8-space
  // indentation, so one pattern per shared dep covers all workspaces. The
  // lookbehind plus exact indent anchors the key at line start, so `svelte`
  // does not also match `eslint-plugin-svelte`; scoped names need quotes in
  // the YAML, bare names do not.
  const importerPattern = (dep: string): RegExp =>
    new RegExp(
      `(?<=\\n)      ${dep.startsWith('@') ? "'" : ''}${dep}${
        dep.startsWith('@') ? "'" : ''
      }:\\n {8}specifier: (.+)\\n {8}version: (\\S+)`,
      'g',
    );

  it.each(packageDedupe)(`dedupes %s in the widget ESM config`, (dep) => {
    expect(esmConfig.resolve?.dedupe).toContain(dep);
  });

  it.each(packageDedupe)(`dedupes %s in the widget IIFE config`, (dep) => {
    expect(iifeConfig.resolve?.dedupe).toContain(dep);
  });

  it.each(packageDedupe)(`dedupes %s in the login-app config`, async (dep) => {
    const appResolved = await resolveConfig(appConfig);
    expect(appResolved.resolve?.dedupe).toContain(dep);
  });

  it.each(packageDedupe)('locks one %s specifier and version across every importer', (dep) => {
    const importers = lockfileSection('\nimporters:', '\npackages:');
    const pairs = Array.from(importers.matchAll(importerPattern(dep)), (m) => `${m[1]} -> ${m[2]}`);
    expect(Array.from(new Set(pairs))).toHaveLength(1);
  });

  it.each(packageDedupe)('locks a single %s package version', (dep) => {
    const packages = lockfileSection('\npackages:', '\nsnapshots:');
    // Scoped keys are quoted in the YAML with the quote before the closing
    // colon (`'@forgerock/x@1.2.3':`), so the capture spans the version plus
    // a possible trailing quote and is stripped after the match; bare keys
    // have no quote.
    expect(
      uniqueMatches(
        packages,
        new RegExp(
          `\\n {2}${dep.startsWith('@') ? "'" : ''}${dep.replace('/', '\\/')}@([^:]+):\\n`,
          'g',
        ),
      ).map((version) => version.replace(/'$/, '')),
    ).toHaveLength(1);
  });

  it('declares the shared specifier in every workspace manifest', () => {
    const importers = lockfileSection('\nimporters:', '\npackages:');
    for (const dep of packageDedupe) {
      expect(uniqueMatches(importers, importerPattern(dep))).toEqual([SHARED_SPECIFIERS[dep]]);
    }
  });
});
