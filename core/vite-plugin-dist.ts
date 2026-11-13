import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Vite plugin for consumers of the `login-framework` package (`core/`).
 *
 * Maps the source-tree aliases (`$core`, `$components`, `$journey`,
 * `$locales`) onto the package's BUILT `dist/` output, so consumers import
 * the compiled modules instead of re-compiling the sources. Returns bare
 * package specifiers (`login-framework/dist/...`), resolved through the
 * package's exports map — never absolute paths — so builds can externalize
 * them (ESM) or bundle them (IIFE) with a plain specifier regex.
 *
 * The dist tree mirrors the source tree with three emitted-name differences
 * that this plugin reconciles:
 *   1. Compiled Svelte components: `foo.svelte` (source) is emitted as
 *      `foo.component.js` — vite-plugin-svelte re-compiles `*.svelte.js`
 *      as runes source in a consumer dev server, so the build renames them.
 *   2. JSON locale catalogs: `index.json` (source) is emitted as
 *      `index.json.js` (Rollup turns JSON imports into JS modules).
 *   3. TypeScript sources: `foo.ts` is emitted as `foo.js`.
 *
 * The plugin never touches resolution of the package's own dependencies
 * (`svelte`, `@forgerock/*`, ...), which stay external to the package and
 * resolve from the consumer's install.
 *
 * @param {object} options
 * @param {string} options.packageDir Absolute path to the `core/` package
 *   directory (consumers pass `resolve(__dirname, '../../core')`). Used to
 *   verify that the mapped dist file exists; resolution itself goes through
 *   the package specifier.
 */
export function loginFrameworkDist({ packageDir }) {
  const distDir = resolve(packageDir, 'dist');

  const aliasRoots = [
    { prefix: '$core', distPrefix: distDir },
    { prefix: '$components', distPrefix: resolve(distDir, 'components') },
    { prefix: '$journey', distPrefix: resolve(distDir, 'journey') },
    { prefix: '$locales', distPrefix: resolve(distDir, 'locales') },
  ];

  const emittedPath = (absolute) => {
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
    resolveId(source) {
      if (source.startsWith('\0')) {
        return null;
      }
      const match = aliasRoots.find(
        ({ prefix }) => source === prefix || source.startsWith(`${prefix}/`),
      );
      if (!match) {
        return null;
      }

      const rest = source.slice(match.prefix.length).replace(/^\//, '');
      const absolute = rest ? resolve(match.distPrefix, rest) : match.distPrefix;
      const emitted = emittedPath(absolute);

      // Return the resolved absolute dist path. Consumers externalize with a
      // regex over this path prefix (ESM) or bundle it (IIFE).
      return emitted;
    },
  };
}
