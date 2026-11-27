import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { runRegistryScript, seedMissingWrappers } from './registry';

interface CustomRegistryPluginOptions {
  /**
   * Absolute path to the project root that contains `custom/components/` and
   * `core/`. Both consumer Vite configs (login-widget, login-app) live two
   * directories deep, so they pass `resolve('../..')`.
   */
  projectRoot: string;
  /**
   * Subtrees of `custom/components/` (paths relative to that root,
   * `/`-separated) that never enter the generated registry. The published
   * widget builds (ESM + IIFE) exclude the repo-local e2e canary stage so it
   * cannot ship in the npm bundle; login-app and Storybook omit this and
   * register everything.
   */
  exclude?: readonly string[];
}

// Subset of vite's ViteDevServer we use. Declared structurally so core/ doesn't import vite's types.
interface ViteDevServer {
  watcher: {
    on(event: 'all', listener: (event: string, filePath: string) => void): unknown;
  };
  config: { logger: { error: (msg: string) => void } };
}

const STALE_REGISTRY_NOTE =
  '[custom-registry] regeneration failed, and the previously generated ' +
  'custom-registry.ts is stale from before the collision — it is still serving the old ' +
  'registry set. Fix or remove the colliding component file(s) above; the registry file ' +
  'regenerates on the next successful scan.';

/**
 * Sandbox locations scaffolded by CLI 0.2.x, which placed custom components
 * under `experimental/custom/`. Components now live under
 * `custom/components/{stages,callbacks}/`, and only those directories are
 * scanned, so components left in the legacy location silently drop out of
 * the build after an update. The plugin warns once per build when the legacy
 * tree still holds Svelte files.
 */
const LEGACY_SANDBOX_DIRS = [
  'experimental/custom/stages',
  'experimental/custom/callbacks',
] as const;

/** Name of the current components directory, for the warning's migration hint. */
const CURRENT_COMPONENTS_DIR = 'custom/components';

const countSvelteFilesRecursively = (dir: string): number => {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    // Missing or unreadable directory: nothing legacy to report there.
    return 0;
  }
  return entries.reduce((sum, entry) => {
    const fullPath = path.join(dir, entry);
    let isDirectory = false;
    try {
      isDirectory = statSync(fullPath).isDirectory();
    } catch {
      isDirectory = false;
    }
    if (isDirectory) {
      return sum + countSvelteFilesRecursively(fullPath);
    }
    return entry.endsWith('.svelte') ? sum + 1 : sum;
  }, 0);
};

/**
 * Prints a one-time-per-build warning when the legacy `experimental/custom/`
 * sandbox still holds Svelte components. Read-only and best-effort: it never
 * fails the build (a readdir on an absent path resolves to zero files).
 */
const warnAboutLegacySandbox = (projectRoot: string): void => {
  const foundDirs = LEGACY_SANDBOX_DIRS.filter(
    (relativeDir) => countSvelteFilesRecursively(path.join(projectRoot, relativeDir)) > 0,
  );
  if (foundDirs.length === 0) {
    return;
  }
  console.warn(
    `[custom-registry] Found custom components under the legacy ${foundDirs.join(' and ')} ` +
      'directory. Custom components moved from "experimental/custom/" to ' +
      `"${CURRENT_COMPONENTS_DIR}/"; the legacy location is NOT scanned or built, so those ` +
      'components drop out of the app. Migrate each component directory into ' +
      `${CURRENT_COMPONENTS_DIR}/stages/ or ${CURRENT_COMPONENTS_DIR}/callbacks/, update its ` +
      'imports to the "$login-framework" surface module, and run "ping-lf update" to refresh ' +
      'the framework-owned files.',
  );
};

/**
 * Regenerates `core/journey/_utilities/registry/custom-registry.ts` by scanning
 * `custom/components/{stages,callbacks}/` for `@component`-annotated
 * Svelte files, and seeds the page header/footer wrapper files into
 * `custom/components/layout/` when absent. Both run at
 * `buildStart`; in dev, the watcher also picks up adds/removals so scaffolding
 * a new component via `ping-lf generate` needs no server restart.
 */
export function customRegistry({ projectRoot, exclude }: CustomRegistryPluginOptions) {
  const watchedDirs = [
    path.join(projectRoot, 'custom', 'components', 'callbacks'),
    path.join(projectRoot, 'custom', 'components', 'stages'),
  ];

  // Single-flight guard: watch events can fire faster than a full scan (a
  // scaffolded component emits several events, and a save triggers add plus
  // change). Starting a second scan while one runs duplicated the whole
  // directory walk for nothing, so late callers await the in-flight run
  // instead of starting their own.
  let inFlightRegeneration: Promise<void> | undefined;

  const regenerate = (): Promise<void> => {
    if (inFlightRegeneration !== undefined) {
      return inFlightRegeneration;
    }
    const run = Effect.runPromise(
      runRegistryScript(projectRoot, { exclude }).pipe(Effect.provide(NodeContext.layer)),
    );
    inFlightRegeneration = run.finally(() => {
      inFlightRegeneration = undefined;
    });
    return inFlightRegeneration;
  };

  const seed = () =>
    Effect.runPromise(seedMissingWrappers(projectRoot).pipe(Effect.provide(NodeContext.layer)));

  const buildStart = () => {
    warnAboutLegacySandbox(projectRoot);
    return seed().then(regenerate);
  };

  return {
    name: 'framework-core:custom-registry',
    buildStart,
    configureServer(server: ViteDevServer) {
      server.watcher.on('all', (_event, filePath) => {
        if (
          !filePath.endsWith('.svelte') ||
          filePath.endsWith('.story.svelte') ||
          // Exact boundary: a prefix check alone would pick up a sibling
          // directory like custom/components2/ or stages-backup/.
          !watchedDirs.some((dir) => filePath === dir || filePath.startsWith(`${dir}${path.sep}`))
        ) {
          return;
        }
        regenerate().catch((cause) => {
          server.config.logger.error(`[custom-registry] regeneration failed: ${String(cause)}`);
          // The previously generated custom-registry.ts stays on disk on failure, so it
          // keeps serving the stale registry set. Say so loudly — the stale file masks
          // the collision if the plugin only logs the regeneration error.
          server.config.logger.error(STALE_REGISTRY_NOTE);
        });
      });
    },
  };
}
