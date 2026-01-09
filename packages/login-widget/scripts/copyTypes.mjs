/**
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * This script copies TypeScript declaration files from svelte-package output
 * to the dist directory for distribution, and copies referenced core type
 * files into dist/core/ so published types have resolvable imports.
 */

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const importMetaPath = fileURLToPath(import.meta.url);
const importMetaDirectoryPath = dirname(importMetaPath);
const rootDir = join(importMetaDirectoryPath, '..');
const repoRoot = join(rootDir, '../..');

// Widget code is now at root of src/lib/, so svelte-package outputs to svelte-package/ directly
const sveltePackageDir = join(rootDir, 'svelte-package');
const distDir = join(rootDir, 'dist');

// --- Widget type files from svelte-package ---

const filesToCopy = [
  { src: 'index.svelte.d.ts', dest: 'index.d.ts' },
  { src: 'types.d.ts', dest: 'types.d.ts' },
  { src: 'interfaces.d.ts', dest: 'interfaces.d.ts' },
];

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

let copiedCount = 0;
let skippedCount = 0;

for (const { src, dest } of filesToCopy) {
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
  process.exit(1);
}

// --- Core type files referenced by widget types ---
// These are the .d.ts files from core/ that widget types import via $core/ aliases.
// They get copied into dist/core/ to match the alias rewriting in processTypes.mjs.

const coreFilesToCopy = [
  'interfaces.d.ts',
  'component.store.d.ts',
  'sdk.config.d.ts',
  'links.store.d.ts',
  'locale.store.d.ts',
  'style.store.d.ts',
  'oauth/oauth.store.d.ts',
  'user/user.store.d.ts',
  'journey/journey.interfaces.d.ts',
  'journey/config.store.d.ts',
];

const coreDir = join(repoRoot, 'core');
let coreCopiedCount = 0;
let coreSkippedCount = 0;

for (const relPath of coreFilesToCopy) {
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
    console.warn(`⚠ Skipped core/${relPath} (not found)`);
    coreSkippedCount++;
  }
}

console.log(`Core type copying: ${coreCopiedCount} copied, ${coreSkippedCount} skipped`);
