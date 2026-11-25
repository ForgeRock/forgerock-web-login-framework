import { svelte } from '@sveltejs/vite-plugin-svelte';
import autoprefixer from 'autoprefixer';
import { resolve } from 'path';
import postcssImport from 'postcss-import';
import sveltePreprocess from 'svelte-preprocess';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

import { customRegistry } from '../../core/journey/_utilities/registry/vite-plugin';
import { loginFrameworkDist } from '../../core/vite-plugin-dist';

/**
 * IIFE build config — produces a self-contained bundle for <script> tag usage.
 *
 * Key differences from the ESM config (vite.config.ts):
 *   - formats: ['iife'] with global name `ForgeRockLoginWidget`
 *   - external: [] — every dependency is inlined, npm packages and the
 *     framework-core modules the loginFrameworkDist plugin resolves into
 *     the package's built dist alike (the ESM bundle now also inlines the
 *     framework; this build additionally inlines the npm dependencies)
 *   - emptyOutDir: false — preserves ESM output from the prior build step
 *   - define: replaces process.env.NODE_ENV for transitive deps (immer, zod, etc.)
 *
 * Run order in build:release: build (ESM) → build:iife (this) → types pipeline
 */
export default defineConfig({
  // Stringified so esbuild parses it itself; its typed `TsconfigRaw` rejects keys
  // it doesn't read (module, moduleResolution, strict, …) even though they're valid
  // tsconfig. Listed for parity with tsconfig.json.
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        verbatimModuleSyntax: true,
        isolatedModules: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    }),
  },
  plugins: [
    loginFrameworkDist({ packageDir: resolve('../../core') }),
    customRegistry({ projectRoot: resolve('../..') }),
    svelte({
      compilerOptions: {
        dev: false,
        compatibility: {
          componentApi: 4,
        },
      },
      preprocess: sveltePreprocess({
        typescript: {
          tsconfigFile: './tsconfig.json',
        },
        postcss: true,
      }),
      configFile: false,
    }),
  ],
  resolve: {
    // One Svelte runtime and one copy of each @forgerock runtime dep in the
    // bundle: core/dist imports `svelte/*` and `@forgerock/*`, which must
    // not resolve a second copy from core/node_modules.
    dedupe: [
      'svelte',
      '@forgerock/journey-client',
      '@forgerock/oidc-client',
      '@forgerock/protect',
      '@forgerock/storage',
    ],
    // $core/$components/$journey/$locales are mapped onto the package's
    // built dist by the loginFrameworkDist plugin above; only the
    // curated custom-component surface stays aliased to source. The IIFE
    // bundles the framework (self-contained script tag, `external: []`).
    alias: {
      '$login-framework': resolve('../../experimental/custom/login-framework.ts'),
    },
  },
  css: {
    postcss: {
      plugins: [postcssImport(), tailwindcss, autoprefixer],
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve('./src/lib/index.svelte'),
      fileName: 'widget.iife',
      formats: ['iife'],
      name: 'ForgeRockLoginWidget',
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'widget.iife.js',
        assetFileNames: 'widget.[ext]',
      },
    },
  },
});
