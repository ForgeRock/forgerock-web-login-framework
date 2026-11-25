import { svelte } from '@sveltejs/vite-plugin-svelte';
import autoprefixer from 'autoprefixer';
import { resolve } from 'path';
import postcssImport from 'postcss-import';
import { visualizer } from 'rollup-plugin-visualizer';
import sveltePreprocess from 'svelte-preprocess';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

import { customRegistry } from '../../core/journey/_utilities/registry/vite-plugin';
import { customImportBoundary } from '../../core/vite-plugin-custom-imports';
import { frameworkCoreDist } from '../../core/vite-plugin-dist';
import { packageDedupe, publishedRegistryExcludes } from '../../core/vite-shared';

export default defineConfig({
  // Isolated tsconfig for esbuild — avoids dependency on .svelte-kit/tsconfig.json.
  // Passed as a JSON string because esbuild's typed `TsconfigRaw` only allows the
  // subset of keys it inspects; the rest (module, moduleResolution, strict, etc.)
  // are documented for parity with tsconfig.json but ignored at transform time.
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
    frameworkCoreDist({ packageDir: resolve('../../core') }),
    // publishedRegistryExcludes keeps the repo-local e2e canary stage out of
    // this published bundle (it registers only in login-app/Storybook builds).
    customRegistry({
      projectRoot: resolve('../..'),
      exclude: [...publishedRegistryExcludes],
    }),
    customImportBoundary({ projectRoot: resolve('../..') }),
    // Bundle stats are an on-demand developer tool, not a build artifact: the
    // output goes outside dist/ (which is the npm package's files list) and
    // the plugin only loads when ANALYZE=1 is set.
    ...(process.env.ANALYZE === '1'
      ? [
          visualizer({
            open: false,
            filename: 'stats.html',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
    svelte({
      compilerOptions: {
        dev: false,
        // Svelte 5 compatibility - maintains new Widget({ target }) pattern
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
      // Don't use svelte.config.js - we have our own settings
      configFile: false,
    }),
  ],
  resolve: {
    // One Svelte runtime and one copy of each @forgerock runtime dep in the
    // bundle: the shared list in core/vite-shared.ts is the single source.
    dedupe: [...packageDedupe],
    // $core/$components/$journey/$locales and the curated custom-component
    // surface ($login-framework → generated dist/login-framework.js) are
    // mapped onto the package's built dist by the frameworkCoreDist plugin
    // above; no alias entry may shadow those resolutions.
    alias: {},
  },
  css: {
    postcss: {
      plugins: [postcssImport(), tailwindcss, autoprefixer],
    },
  },
  server: {
    fs: {
      // Allow serving files from the core directory during dev
      allow: ['../../core'],
    },
  },
  build: {
    lib: {
      entry: resolve('./src/lib/index.svelte'),
      fileName: 'index',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'widget.[ext]',
      },
    },
  },
});
