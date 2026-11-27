/**
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * This script copies TypeScript declaration files from svelte-package output
 * to the dist directory for distribution, and copies referenced core type
 * files into dist/core/ so published types have resolvable imports.
 *
 * Run directly (`node scripts/copyTypes.mjs`); the copy logic is the
 * default export and runs only on direct execution, so the test can import
 * this module for the exported file lists without touching the real repo.
 */

import { copyFileSync, existsSync, mkdirSync, realpathSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/** Widget d.ts files copied from svelte-package output into dist/. */
export const WIDGET_TYPE_FILES = [
  { src: 'index.svelte.d.ts', dest: 'index.d.ts' },
  { src: 'types.d.ts', dest: 'types.d.ts' },
  { src: 'interfaces.d.ts', dest: 'interfaces.d.ts' },
  { src: 'widget.config.d.ts', dest: 'widget.config.d.ts' },
];

/**
 * Core d.ts files copied into dist/core/ because the published widget types
 * reference them (directly or transitively) via the `$core/*` alias paths
 * that processTypes.mjs rewrites to `./core/*`.
 */
export const CORE_TYPE_FILES = [
  'interfaces.d.ts',
  'captcha.config.d.ts',
  'component.store.d.ts',
  'links.store.d.ts',
  'locale.store.d.ts',
  'style.store.d.ts',
  'oidc/oidc.store.d.ts',
  'oauth/oauth.store.d.ts',
  'user/user.store.d.ts',
  'protect/protect.store.d.ts',
  'journey/journey.interfaces.d.ts',
  'journey/config.store.d.ts',
];

/**
 * The imperative shell. Runs only when the script is the entry point, so
 * importing the module (for the exported lists) has no side effects.
 *
 * @returns {number} process exit code: 1 when any core declaration is
 *   missing or no widget type was copied, 0 otherwise.
 */
const main = () => {
  const importMetaDirectoryPath = dirname(fileURLToPath(import.meta.url));
  const rootDir = join(importMetaDirectoryPath, '..');
  const repoRoot = join(rootDir, '../..');

  // Widget code is now at root of src/lib/, so svelte-package outputs to svelte-package/ directly
  const sveltePackageDir = join(rootDir, 'svelte-package');
  const distDir = join(rootDir, 'dist');

  // Ensure dist directory exists
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  let copiedCount = 0;
  let skippedCount = 0;

  for (const { src, dest } of WIDGET_TYPE_FILES) {
    const srcPath = join(sveltePackageDir, src);
    const destPath = join(distDir, dest);

    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${src} → dist/${dest}`);
      copiedCount++;
    } else {
      console.warn(`⚠ Skipped ${src} (not found)`);
      skippedCount++;
    }
  }

  console.log(`\nWidget type copying: ${copiedCount} copied, ${skippedCount} skipped`);

  if (copiedCount === 0) {
    console.error('❌ No type files were copied. Did you run svelte-package first?');
    return 1;
  }

  // --- Core type files referenced by widget types ---
  // These are the .d.ts files from core/ that widget types import via $core/ aliases.
  // They get copied into dist/core/ to match the alias rewriting in processTypes.mjs.

  const coreDir = join(repoRoot, 'core');
  let coreCopiedCount = 0;
  const missingCoreFiles = [];

  for (const relPath of CORE_TYPE_FILES) {
    const srcPath = join(coreDir, relPath);
    const destPath = join(distDir, 'core', relPath);

    // Ensure destination subdirectory exists
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
      console.log(`✓ Copied core/${relPath} → dist/core/${relPath}`);
      coreCopiedCount++;
    } else {
      console.error(
        `❌ Missing core declaration: core/${relPath} not found. ` +
          `Published types reference ./core/${relPath} via dist/index.d.ts; ` +
          `copying a partial set would publish unresolvable imports (TS2307). ` +
          `Run the declaration build first: pnpm --filter framework-core run build:types`,
      );
      missingCoreFiles.push(relPath);
    }
  }

  console.log(`Core type copying: ${coreCopiedCount} copied, ${missingCoreFiles.length} missing`);

  // A missing core declaration file must fail the release build: the published
  // tarball's dist/index.d.ts imports ./core/* unconditionally, so a skipped
  // file silently ships unresolvable type imports to npm consumers.
  return missingCoreFiles.length > 0 ? 1 : 0;
};

// The copy logic above runs only when the script is the entry point; the
// test imports this module for the exported file lists. Both paths are
// realpathed: `process.argv[1]` keeps the invoked path (`/tmp/...`) while
// `import.meta.url` resolves symlinks (`/private/tmp/...`), so a plain
// comparison is false under symlinked temp dirs (macOS CI) and the script
// would silently no-op. An argv[1] naming a nonexistent path is treated as
// not-the-entry-point (ENOENT-safe): importing must never throw.
const isEntryPoint = (() => {
  if (!process.argv[1]) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
})();

const exitCode = isEntryPoint ? main() : 0;
if (isEntryPoint && exitCode !== 0) {
  process.exitCode = exitCode;
}
export default exitCode;
