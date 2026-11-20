/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vite';

import { packageRoot as ROOT, runtimeEntries as entries } from './collect-entries';
import { packageCssConfig, packageExternal, packageSveltePluginOptions } from './vite-shared';

/**
 * SSR (server-condition) build for the `login-framework` package.
 *
 * Compiles the same runtime surface as `vite.config.ts`, but with Svelte's
 * server compilation (`build.ssr: true`): components emit server render
 * functions that never touch `document` at module scope, so SvelteKit can
 * server-render pages importing them. The client build (`vite.config.ts`)
 * stays the tree for browser bundles; the consumer-side resolver plugin
 * (`vite-plugin-dist.ts`) picks this tree when it sees an SSR resolution
 * (`options.ssr`).
 */
export default defineConfig({
  plugins: [svelte({ ...packageSveltePluginOptions() })],
  resolve: {
    alias: {
      $core: resolve(ROOT),
      $components: resolve(ROOT, 'components'),
      $journey: resolve(ROOT, 'journey'),
      $locales: resolve(ROOT, 'locales'),
    },
  },
  css: packageCssConfig,
  build: {
    // Svelte server compilation: components emit SSR render functions.
    ssr: true,
    outDir: 'dist-server',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rollupOptions: {
      external: packageExternal,
      output: {
        preserveModules: true,
        preserveModulesRoot: ROOT,
        entryFileNames: (chunkInfo) => {
          // Same rename as the client build: emitted components must not be
          // named `*.svelte.js` (vite-plugin-svelte re-compiles those as
          // runes source in a consumer's dev server).
          return chunkInfo.name.replace(/\.svelte$/, '.component') + '.js';
        },
      },
    },
  },
});
