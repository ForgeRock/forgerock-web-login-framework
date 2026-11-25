import auto from '@sveltejs/adapter-auto';
import node from '@sveltejs/adapter-node';
import { mdsvex } from 'mdsvex';
import path from 'path';
import autolink from 'remark-autolink-headings';
import slug from 'remark-slug';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  compilerOptions: {
    // Svelte 5 compatibility - maintains new Widget({ target }) pattern
    compatibility: {
      componentApi: 4,
    },
  },
  kit: {
    adapter: process.env.PREVIEW ? node() : auto(),
    // Kit RPC for the editor's *.remote.ts functions: editor pages call the Component
    // API handlers in-process instead of over /api/components HTTP
    experimental: {
      remoteFunctions: true,
    },
    // $lib now defaults to SvelteKit's standard src/lib/ — the app's own code
    alias: {
      // Server-only SvelteKit modules, deliberately excluded from the
      // framework-core package build ($app/$env imports; server/ holds
      // SvelteKit-only utilities); resolved from source. All other
      // $core/$components/$journey/$locales imports map onto the package's
      // built dist via the frameworkCoreDist Vite plugin in vite.config.ts.
      '$core/constants': path.resolve('../../core/constants.ts'),
      '$core/server': path.resolve('../../core/server'),
      '$app-locales': path.resolve('./src/locales'),
      '$app-locales/*': path.resolve('./src/locales/*'),
      $package: path.resolve('../../packages/login-widget/dist'),
      '$package/*': path.resolve('../../packages/login-widget/dist/*'),
      // Server utilities live in the app, not the widget
      $server: path.resolve('./src/lib/server'),
      '$server/*': path.resolve('./src/lib/server/*'),
      // Curated public surface for custom components (stage/callback/header/footer)
      '$login-framework': path.resolve('../../custom/components/login-framework.ts'),
      // Fixed tracked wrapper components (header/footer) — one file per element
      $custom: path.resolve('../../custom/components'),
      '$custom/*': path.resolve('../../custom/components/*'),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({
      postcss: true,
    }),
    mdsvex({
      extensions: ['.md'],
      remarkPlugins: [slug, autolink],
    }),
  ],
};

export default config;
