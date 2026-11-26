/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import { surfaceDistModule } from './login-framework-dist-surface';

/**
 * Vite plugin for the `framework-core` package builds (client + server):
 * writes the compiled curated-surface module (`login-framework.js`) into
 * the tree being built, right after the build output is complete. The
 * generated module re-exports the package's emitted modules, so consumers
 * resolve `$login-framework` to compiled dist code instead of bundling the
 * surface source (which SvelteKit's build pipeline miscompiles — see
 * `login-framework-dist-surface.ts`).
 *
 * Installed once per tree in `vite.config.ts` (client → `dist/`) and
 * `vite.config.server.ts` (server → `dist-server/`). Runs at `closeBundle`
 * so the generated re-export targets exist by the time the file is
 * written; the file itself is plain generated JS (no bundler involvement).
 *
 * Build tooling, colocated with the other package-side plugins and
 * excluded from the package build by `collect-entries.ts`.
 */

/** Options for {@link surfaceDist}. */
interface SurfaceDistOptions {
  /**
   * Absolute path to the `core/` package directory (the vite configs pass
   * `__dirname`-equivalent, the directory holding this plugin).
   */
  packageRoot: string;
  /** Which dist tree to write into: `dist` or `dist-server`. */
  tree: 'client' | 'server';
  /**
   * Absolute path to the curated surface file
   * (`custom/components/login-framework.ts` in the repo root).
   */
  surfaceFile: string;
}

// Subset of vite's Plugin type this plugin fills in. Declared structurally
// so core/ doesn't import vite's types (same approach as vite-plugin-dist.ts).
interface SurfaceDistPlugin {
  name: string;
  apply: 'build';
  closeBundle(): void;
}

export function surfaceDist({
  packageRoot,
  tree,
  surfaceFile,
}: SurfaceDistOptions): SurfaceDistPlugin {
  const outDir = resolve(packageRoot, tree === 'client' ? 'dist' : 'dist-server');
  const outFile = join(outDir, 'login-framework.js');

  return {
    name: 'framework-core:surface-dist',
    apply: 'build',
    closeBundle() {
      const surfaceText = readFileSync(surfaceFile, 'utf8');
      const generated = surfaceDistModule(surfaceText, tree);
      mkdirSync(outDir, { recursive: true });
      // Atomic pattern used across this repo's build outputs: write to a
      // temp file, then rename over the target.
      const tempPath = `${outFile}.tmp`;
      writeFileSync(tempPath, generated);
      // Sync rename within the same directory is atomic on macOS and Linux.
      renameSync(tempPath, outFile);
    },
  };
}
