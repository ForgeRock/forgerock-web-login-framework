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

export default defineConfig({
  plugins: [
    svelte({
      ...packageSveltePluginOptions(),
    }),
  ],
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
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      // Every runtime module in the shared surface, one output file per module.
      entry: entries,
      formats: ['es'],
    },
    rollupOptions: {
      external: packageExternal,
      output: {
        preserveModules: true,
        preserveModulesRoot: ROOT,
        entryFileNames: (chunkInfo) => {
          // Renamed from the default `<name>.svelte.js`: vite-plugin-svelte
          // re-compiles `*.svelte.js` in a consumer's dev server as Svelte
          // runes source and fails with "The $ name is reserved" (this is
          // compiled output, not runes source).
          return chunkInfo.name.replace(/\.svelte$/, '.component') + '.js';
        },
      },
    },
  },
});
