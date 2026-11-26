import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
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

  const regenerate = () =>
    Effect.runPromise(
      runRegistryScript(projectRoot, { exclude }).pipe(Effect.provide(NodeContext.layer)),
    );

  const seed = () =>
    Effect.runPromise(seedMissingWrappers(projectRoot).pipe(Effect.provide(NodeContext.layer)));

  const buildStart = () => seed().then(regenerate);

  return {
    name: 'framework-core:custom-registry',
    buildStart,
    configureServer(server: ViteDevServer) {
      server.watcher.on('all', (_event, filePath) => {
        if (
          !filePath.endsWith('.svelte') ||
          filePath.endsWith('.story.svelte') ||
          !watchedDirs.some((dir) => filePath.startsWith(dir))
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
