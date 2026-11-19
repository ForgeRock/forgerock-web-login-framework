import { existsSync } from 'fs';
import { resolve } from 'path';

import { customRegistrySourcePath, customRegistrySpecifier } from './vite-shared';

/** Options for {@link loginFrameworkDist}. */
interface LoginFrameworkDistOptions {
  /**
   * Absolute path to the `core/` package directory (consumers pass
   * `resolve('../../core')`). Used to locate the built trees and verify that
   * the mapped dist file exists.
   */
  packageDir: string;
}

// Structural subset of vite's Plugin type this plugin fills in. Declared
// locally so core/ doesn't import vite's types (same approach as the
// registry's customRegistry plugin).
interface DistResolverPlugin {
  name: string;
  enforce: 'pre';
  resolveId(source: string, importer: unknown, options?: { ssr?: boolean }): string | null;
}

/**
 * Vite plugin for consumers of the `login-framework` package (`core/`).
 *
 * Maps the source-tree aliases (`$core`, `$components`, `$journey`,
 * `$locales`) onto the package's BUILT output, so consumers import the
 * compiled modules instead of re-compiling the sources. Returns the
 * absolute dist path, so builds can externalize them (ESM) or bundle them
 * (IIFE) with a plain path-prefix regex.
 *
 * Two built trees exist, one per Svelte compile condition:
 *   - `dist/`     client compilation — browser bundles and client hydration
 *   - `dist-server/` SSR compilation — SvelteKit's server bundle picks these
 *     when the plugin sees an SSR resolution (`options.ssr`), so server
 *     rendering never executes client-only compiled templates (which touch
 *     `document` at module scope).
 *
 * Both trees mirror the source tree with three emitted-name differences that
 * this plugin reconciles:
 *   1. Compiled Svelte components: `foo.svelte` (source) is emitted as
 *      `foo.component.js` — vite-plugin-svelte re-compiles `*.svelte.js`
 *      as runes source in a consumer dev server, so the build renames them.
 *   2. JSON locale catalogs: `index.json` (source) is emitted as
 *      `index.json.js` (Rollup turns JSON imports into JS modules).
 *   3. TypeScript sources: `foo.ts` is emitted as `foo.js`.
 *
 * Sources with nothing built inside an existing tree (e.g. `$core/constants`,
 * excluded from the package build) resolve to `null`, so the consumer's own
 * alias or module resolution applies. When the tree itself is missing (the
 * package was never built), resolution throws with a `pnpm build:framework`
 * hint instead.
 *
 * One specifier is the exception: the custom registry import
 * (`customRegistrySpecifier`) resolves to the generated SOURCE file for both
 * trees, because the package builds leave it external and each consumer's
 * `customRegistry` plugin generates it. A missing file throws with a hint.
 *
 * The plugin never touches resolution of the package's own dependencies
 * (`svelte`, `@forgerock/*`, ...), which stay external to the package and
 * resolve from the consumer's install.
 */
export function loginFrameworkDist({ packageDir }: LoginFrameworkDistOptions): DistResolverPlugin {
  const distDir = resolve(packageDir, 'dist');
  const serverDistDir = resolve(packageDir, 'dist-server');
  const registrySource = resolve(packageDir, customRegistrySourcePath);

  const aliasRoots = [
    { prefix: '$core', subPath: '' },
    { prefix: '$components', subPath: 'components' },
    { prefix: '$journey', subPath: 'journey' },
    { prefix: '$locales', subPath: 'locales' },
  ];

  const emittedPath = (absolute: string): string => {
    // Already points at an emitted file (e.g. `.js`).
    if (existsSync(absolute)) {
      return absolute;
    }
    // Extensionless TS source: `foo` → `foo.js`.
    if (!/\.[jt]s$/.test(absolute) && !absolute.endsWith('.json')) {
      const jsModule = `${absolute}.js`;
      if (existsSync(jsModule)) {
        return jsModule;
      }
    }
    // Compiled component: `foo.svelte` → `foo.component.js`.
    if (absolute.endsWith('.svelte')) {
      const component = absolute.replace(/\.svelte$/, '.component.js');
      if (existsSync(component)) {
        return component;
      }
    }
    // JSON catalog: `index.json` → `index.json.js`.
    if (absolute.endsWith('.json')) {
      const jsonModule = `${absolute}.js`;
      if (existsSync(jsonModule)) {
        return jsonModule;
      }
    }
    return absolute;
  };

  return {
    name: 'login-framework-dist-resolver',
    enforce: 'pre',
    resolveId(source: string, _importer: unknown, options?: { ssr?: boolean }) {
      if (source.startsWith('\0')) {
        return null;
      }

      // Consumer-owned: the consumer's `customRegistry` plugin generates this file.
      if (source === customRegistrySpecifier) {
        if (!existsSync(registrySource)) {
          throw new Error(
            `Custom component registry not found at ${registrySource}, needed to resolve "${source}". ` +
              'Add the customRegistry Vite plugin (core/journey/_utilities/registry/vite-plugin.ts) to this build; it generates the file at buildStart.',
          );
        }
        return registrySource;
      }

      const match = aliasRoots.find(
        ({ prefix }) => source === prefix || source.startsWith(`${prefix}/`),
      );
      if (!match) {
        return null;
      }

      // SSR resolutions (SvelteKit server bundle, dev SSR) pick the
      // server-compiled tree; everything else the client one. The alias's
      // sub-path applies inside whichever tree is selected.
      const treeRoot = options?.ssr ? serverDistDir : distDir;

      // The tree itself is absent: the package was never built. Fail with the
      // fix instead of returning null, which surfaces as Vite's opaque
      // "Failed to resolve import" error.
      if (!existsSync(treeRoot)) {
        throw new Error(
          `login-framework build output not found at ${treeRoot}, needed to resolve "${source}". ` +
            'Run "pnpm build:framework" from the repository root.',
        );
      }
      const treePrefix = resolve(treeRoot, match.subPath);
      const rest = source.slice(match.prefix.length).replace(/^\//, '');
      const absolute = rest ? resolve(treePrefix, rest) : treePrefix;
      const emitted = emittedPath(absolute);

      // Nothing built at that path (e.g. `$core/constants`, excluded from the
      // package build): return null so the consumer's own resolution
      // (alias or bare-specifier failure) applies.
      if (!existsSync(emitted)) {
        return null;
      }

      // Return the resolved absolute dist path. Consumers externalize with a
      // regex over this path prefix (ESM) or bundle it (IIFE).
      return emitted;
    },
  };
}
