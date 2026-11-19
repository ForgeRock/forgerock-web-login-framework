/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Runtime-module collection shared by the package's build configs
 * (`vite.config.ts` for the client tree, `vite.config.server.ts` for the
 * SSR tree). Both compile the same surface, one file per module.
 */
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

import { customRegistrySourcePath } from './vite-shared';

const ROOT = import.meta.dirname;

/**
 * Directories and files excluded from the shared surface.
 */
const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-server', // SSR build output of this package
  'server', // SvelteKit-only: feeds constants.ts, login-app server code only
  join('journey', '_utilities', 'registry', 'wrapper-templates'), // registry seeding source
]);
const EXCLUDED_FILES = new Set([
  'constants.ts', // SvelteKit $app/$env
  'vite.config.ts', // client build config — must never be part of its own build graph
  'vite.config.server.ts', // SSR build config
  'vite-plugin-dist.ts', // consumer-side resolver for dist, build tooling
  'vite-plugin-dist.test.ts', // tests excluded from the build surface
  'vite-shared.ts', // shared options for this package's two Vite builds, build tooling
  'vite-config.test.ts', // tests excluded from the build surface
  'login-framework-surface.ts', // import-surface parity checker, build tooling
  'login-framework-surface.test.ts', // its tests
  'collect-entries.ts', // this helper, build tooling
  'style.stories.js',
  'style.story.svelte',
  join('journey', '_utilities', 'registry', 'vite-plugin.ts'), // build tooling
  join('journey', '_utilities', 'registry', 'registry.ts'), // Node-only registry script
  join('journey', 'callbacks', '_utilities', 'callback-presets.ts'), // imports test mocks, consumed by tests only
  customRegistrySourcePath, // generated per consumer build, resolved from source by vite-plugin-dist
]);

/**
 * Test fixtures (`*.mock.ts`) never ship, except the ones the public surface
 * re-exports for consumers' own stories and mocks.
 */
const SHIPPED_MOCKS = new Set([
  join('journey', '_utilities', 'step.mock.ts'), // createJourneyStep, re-exported by login-framework.ts
]);

export function isRuntimeModule(file: string): boolean {
  if (!/\.(ts|svelte)$/.test(file)) {
    return false;
  }
  if (file.endsWith('.test.ts') || file.endsWith('.d.ts')) {
    return false;
  }
  if (file.endsWith('.mock.ts') && !SHIPPED_MOCKS.has(file)) {
    return false;
  }
  if (file.endsWith('.stories.js') || file.endsWith('.story.svelte')) {
    return false;
  }
  if (EXCLUDED_FILES.has(file)) {
    return false;
  }
  const pathParts = file.split('/');
  return !pathParts.some((part, index) =>
    EXCLUDED_DIRS.has(pathParts.slice(0, index + 1).join('/')),
  );
}

function collectRuntimeModules(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    const rel = relative(ROOT, full).split('\\').join('/');
    if (statSync(full).isDirectory()) {
      return collectRuntimeModules(full);
    }
    return isRuntimeModule(rel) ? [full] : [];
  });
}

export const packageRoot = ROOT;
export const runtimeEntries = collectRuntimeModules(ROOT);
