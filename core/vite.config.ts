import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import { defineConfig } from 'vite';

const ROOT = import.meta.dirname;

/**
 * Directories and files excluded from the shared surface.
 */
const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'server', // SvelteKit-only: feeds constants.ts, login-app server code only
  join('journey', '_utilities', 'registry', 'wrapper-templates'), // registry seeding source
]);
const EXCLUDED_FILES = new Set([
  'constants.ts', // SvelteKit $app/$env
  'vite.config.ts', // this build config — must never be part of its own build graph
  'vite-plugin-dist.ts', // consumer-side resolver for dist, build tooling
  'style.stories.js',
  'style.story.svelte',
  join('journey', '_utilities', 'registry', 'vite-plugin.ts'), // build tooling
  join('journey', '_utilities', 'registry', 'registry.ts'), // Node-only registry script
]);

function isRuntimeModule(file) {
  if (!/\.(ts|svelte)$/.test(file)) {
    return false;
  }
  if (file.endsWith('.test.ts') || file.endsWith('.d.ts')) {
    return false;
  }
  if (file.endsWith('.stories.js') || file.endsWith('.story.svelte')) {
    return false;
  }
  if (EXCLUDED_FILES.has(file)) {
    return false;
  }
  const pathParts = file.split('/');
  return !pathParts.some((part, index) =>
    EXCLUDED_DIRS.has(pathParts.slice(0, index + 1).join('/')),
  );
}

function collectRuntimeModules(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    const rel = relative(ROOT, full).split('\\').join('/');
    if (statSync(full).isDirectory()) {
      return collectRuntimeModules(full);
    }
    return isRuntimeModule(rel) ? [full] : [];
  });
}

const entries = collectRuntimeModules(ROOT);

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
