import { svelte } from '@sveltejs/vite-plugin-svelte';
import autoprefixer from 'autoprefixer';
import { resolve } from 'path';
import postcssImport from 'postcss-import';
import { visualizer } from 'rollup-plugin-visualizer';
import sveltePreprocess from 'svelte-preprocess';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

import { customRegistry } from '../../core/journey/_utilities/registry/vite-plugin';
import { loginFrameworkDist } from '../../core/vite-plugin-dist';

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
    loginFrameworkDist({ packageDir: resolve('../../core') }),
    customRegistry({ projectRoot: resolve('../..') }),
    visualizer({ open: false, filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
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
    // $core/$components/$journey/$locales are mapped onto the package's
    // built dist by the loginFrameworkDist plugin above; only the
    // curated custom-component surface stays aliased to source.
    alias: {
      '$login-framework': resolve('../../experimental/custom/login-framework.ts'),
    },
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
