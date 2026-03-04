import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { resolve } from 'path';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/**
 * IIFE build config — produces a self-contained bundle for <script> tag usage.
 *
 * Key differences from the ESM config (vite.config.ts):
 *   - formats: ['iife'] with global name `ForgeRockLoginWidget`
 *   - external: [] — all deps are inlined into the bundle
 *   - emptyOutDir: false — preserves ESM output from the prior build step
 *   - define: replaces process.env.NODE_ENV for transitive deps (immer, zod, etc.)
 *
 * Run order in build:release: build (ESM) → build:iife (this) → types pipeline
 */
export default defineConfig({
  esbuild: {
    tsconfigRaw: {
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
    },
  },
  plugins: [
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
    alias: {
      $core: resolve('../../core'),
      $components: resolve('../../core/components'),
      $journey: resolve('../../core/journey'),
      $locales: resolve('../../core/locales'),
    },
  },
  css: {
    postcss: {
      plugins: [postcssImport, tailwindcss, autoprefixer],
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
