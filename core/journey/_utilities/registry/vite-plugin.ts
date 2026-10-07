import { NodeContext } from '@effect/platform-node';
import { Effect } from 'effect';
import path from 'node:path';

import { runRegistryScript } from './registry';

interface CustomRegistryPluginOptions {
  /**
   * Absolute path to the project root that contains `experimental/custom/` and
   * `core/`. Both consumer Vite configs (login-widget, login-app) live two
   * directories deep, so they pass `resolve('../..')`.
   */
  projectRoot: string;
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
 * `experimental/custom/{stages,callbacks,headers,footers}/` for `@component`-annotated
 * Svelte files. Runs once at `buildStart` and, in dev, watches for adds/removals so
 * scaffolding a new component via `ping-lf generate` is picked up without a
 * server restart.
 */
export function customRegistry({ projectRoot }: CustomRegistryPluginOptions) {
  const watchedDirs = [
    path.join(projectRoot, 'experimental', 'custom', 'callbacks'),
    path.join(projectRoot, 'experimental', 'custom', 'stages'),
    path.join(projectRoot, 'experimental', 'custom', 'headers'),
    path.join(projectRoot, 'experimental', 'custom', 'footers'),
  ];

  const regenerate = () =>
    Effect.runPromise(runRegistryScript(projectRoot).pipe(Effect.provide(NodeContext.layer)));

  return {
    name: 'login-framework:custom-registry',
    buildStart: regenerate,
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
