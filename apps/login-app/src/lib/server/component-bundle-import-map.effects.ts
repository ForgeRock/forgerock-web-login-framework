/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Bare-specifier → runtime-URL entries rendered as the page's import map. */
export interface ComponentBundleImportMap {
  [specifier: string]: string;
}

interface DepOptimizerEntry {
  file?: string;
}

interface DepOptimizerMetadata {
  browserHash?: string;
  optimized?: Record<string, DepOptimizerEntry>;
}

/** Vite dep-optimizer state; rewritten on every (re-)optimization, so per-request reads are current. */
const METADATA_RELPATH = 'node_modules/.vite/deps/_metadata.json';

/** The bundle declares `external: [/^svelte/, /^@forgerock/]` (BUNDLE_CONTRACT.md). */
const SPECIFIER_PATTERN = /^(?:svelte|@forgerock)(?:\/|$)/;

/**
 * Generates the import map that resolves the Custom Component bundle's bare
 * `svelte`/`@forgerock` specifiers to this host's single runtime copy:
 *
 *   dev, deps optimized    →  { "svelte/internal/client": "/node_modules/.vite/deps/svelte_internal_client.js?v=<browserHash>", ... }
 *   dev, not optimized yet →  null (bundle load fails visibly; deps optimize on first request)
 *   build / prod / tests   →  null (stable framework URLs arrive with IAM-12133)
 */
export function getComponentBundleImportMap(): ComponentBundleImportMap | null {
  if (!import.meta.env.DEV || process.env.VITEST) {
    return null;
  }

  const metadataPath = resolve(process.cwd(), METADATA_RELPATH);
  if (!existsSync(metadataPath)) {
    return null;
  }

  let metadata: DepOptimizerMetadata;
  try {
    metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as DepOptimizerMetadata;
  } catch {
    return null;
  }

  const { browserHash, optimized } = metadata;
  if (!browserHash || !optimized) {
    return null;
  }

  const entries: ComponentBundleImportMap = {};
  for (const [specifier, entry] of Object.entries(optimized)) {
    if (!SPECIFIER_PATTERN.test(specifier) || !entry.file) {
      continue;
    }
    entries[specifier] = `/node_modules/.vite/deps/${entry.file}?v=${browserHash}`;
  }
  return Object.keys(entries).length > 0 ? entries : null;
}
