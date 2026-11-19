/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it, vi } from 'vitest';

import appConfig from '../../apps/login-app/vite.config';
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

  it('bundles the login-framework dist into the widget output (no external)', () => {
    // `login-framework` is a private workspace package that is never published:
    // emitted `login-framework/dist/...` imports could not resolve on an npm
    // consumer's machine, so the ESM build must inline the framework.
    expect(rollupOptions?.external).toBeUndefined();
  });

  it('emits no login-framework specifier rewrite (output paths absent)', () => {
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

  it('declares no login-framework dependency (private package, bundled)', () => {
    const manifest = readPackageManifest();
    expect(Object.keys(manifest.dependencies ?? {})).not.toContain('login-framework');
    expect(Object.keys(manifest.peerDependencies ?? {})).not.toContain('login-framework');
  });
});

describe('svelte single runtime', () => {
  const repoRoot = resolve(import.meta.dirname, '../..');
  const lockfile = readFileSync(resolve(repoRoot, 'pnpm-lock.yaml'), 'utf8');

  const lockfileSection = (startMarker: string, endMarker: string): string =>
    lockfile.slice(lockfile.indexOf(startMarker), lockfile.indexOf(endMarker));

  const uniqueMatches = (text: string, pattern: RegExp): ReadonlyArray<string> =>
    Array.from(new Set(Array.from(text.matchAll(pattern), (match) => match[1])));

  const resolveConfig = async (config: UserConfigExport) =>
    typeof config === 'function' ? config({ command: 'build', mode: 'production' }) : config;

  it('dedupes svelte in the widget ESM config', () => {
    expect(esmConfig.resolve?.dedupe).toContain('svelte');
  });

  it('dedupes svelte in the widget IIFE config', () => {
    expect(iifeConfig.resolve?.dedupe).toContain('svelte');
  });

  it('dedupes svelte in the login-app config', async () => {
    const appResolved = await resolveConfig(appConfig);
    expect(appResolved.resolve?.dedupe).toContain('svelte');
  });

  it('resolves one svelte version across every lockfile importer', () => {
    const importers = lockfileSection('\nimporters:', '\npackages:');
    expect(
      uniqueMatches(importers, /\n {6}svelte:\n {8}specifier: .+\n {8}version: (\S+)/g),
    ).toHaveLength(1);
  });

  it('declares the same svelte specifier in every workspace manifest', () => {
    const importers = lockfileSection('\nimporters:', '\npackages:');
    expect(uniqueMatches(importers, /\n {6}svelte:\n {8}specifier: (.+)\n/g)).toHaveLength(1);
  });

  it('locks a single svelte package version', () => {
    const packages = lockfileSection('\npackages:', '\nsnapshots:');
    expect(uniqueMatches(packages, /\n {2}svelte@(\S+):\n/g)).toHaveLength(1);
  });
});
