import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { resolve } from 'path';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  // Use isolated tsconfig for esbuild (avoids dependency on .svelte-kit/tsconfig.json)
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
      // Externalize runtime dependencies — they're provided by the consumer
      external: ['@forgerock/javascript-sdk', '@forgerock/ping-protect', 'qrcode', 'xss', 'zod'],
      output: {
        // Single file bundle (no code splitting)
        inlineDynamicImports: true,
        // Consistent naming
        entryFileNames: 'index.js',
        assetFileNames: 'widget.[ext]',
      },
    },
  },
});
