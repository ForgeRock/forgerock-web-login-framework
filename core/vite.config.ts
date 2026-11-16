import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vite';

import { packageRoot as ROOT, runtimeEntries as entries } from './collect-entries';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: false,
        // Svelte 5 compatibility - maintains new Widget({ target }) pattern
        compatibility: {
          componentApi: 4,
        },
      },
      // The package compiles the same way as the widget build; core/ has no
      // svelte.config.js of its own. No postcss: the package ships no CSS
      // (no Tailwind directives in core sources), and auto-loading the
      // consumers' PostCSS config (Tailwind) here fails without their config.
      postcss: false,
      configFile: false,
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
  css: {
    // The package ships no CSS and must not run the repo-root PostCSS config
    // (Tailwind): the walk-up autodetect from core/ finds the root
    // postcss.config.cjs and Tailwind fails without its own content config.
    postcss: { plugins: [] },
  },
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
      external: [/^svelte(\/|$)/, /^@forgerock\//, /^zod/, /^qrcode/, /^xss/],
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
