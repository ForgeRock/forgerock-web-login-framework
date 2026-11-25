/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Shared Vite build options for the `framework-core` package's two builds:
 * `vite.config.ts` (client tree) and `vite.config.server.ts` (SSR tree).
 * Both compile the same surface the same way, so the Svelte plugin options
 * and the CSS config live here once.
 */
import type { Options as SveltePluginOptions } from '@sveltejs/vite-plugin-svelte';
import type { CSSOptions } from 'vite';

/**
 * Options for the `@sveltejs/vite-plugin-svelte` plugin.
 *
 * `configFile: false` because core/ has no `svelte.config.js` of its own and
 * must not auto-load a consumer's one. No `postcss` option here: the plugin
 * does not accept one (it warns "invalid plugin options" at runtime); the
 * PostCSS pipeline is configured on the Vite `css` level instead (see
 * {@link packageCssConfig}).
 */
export const packageSveltePluginOptions = (): SveltePluginOptions => ({
  compilerOptions: {
    dev: false,
    // Component styles travel inside the compiled JS (client: appended on
    // mount; SSR: rendered into the page head). Nothing is extracted, so
    // consumers need no stylesheet import to get a component's styles.
    css: 'injected',
    // Svelte 5 compatibility - maintains new Widget({ target }) pattern
    compatibility: {
      componentApi: 4,
    },
  },
  configFile: false,
});

/**
 * Vite `css` config for both package builds. The package emits no stylesheet
 * (component styles are injected, see {@link packageSveltePluginOptions}; no
 * Tailwind directives in core sources) and must not run the repo-root
 * PostCSS config (Tailwind): the walk-up autodetect from core/ finds the
 * root `postcss.config.cjs` and Tailwind fails without its own content
 * config. An empty plugin pipeline disables that autodetect.
 */
export const packageCssConfig: CSSOptions = { postcss: { plugins: [] } };

/**
 * Specifier core code uses to import the generated custom-component registry.
 * Both builds leave it external and the consumer-side resolver
 * (`vite-plugin-dist.ts`) maps it to the source file, so the registry the
 * consumer's `customRegistry` plugin generates is the one that ships.
 */
export const customRegistrySpecifier = '$journey/_utilities/registry/custom-registry';

/** The generated registry's path relative to the package root. */
export const customRegistrySourcePath = 'journey/_utilities/registry/custom-registry.ts';

/** Rollup `external` list for both package builds. */
export const packageExternal: Array<string | RegExp> = [
  /^svelte(\/|$)/,
  /^@forgerock\//,
  /^zod/,
  /^qrcode/,
  /^xss/,
  customRegistrySpecifier,
];
