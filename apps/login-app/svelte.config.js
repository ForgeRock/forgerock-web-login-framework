import auto from '@sveltejs/adapter-auto';
import node from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex';
import slug from 'remark-slug';
import autolink from 'remark-autolink-headings';
import path from 'path';

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
    // $lib now defaults to SvelteKit's standard src/lib/ — the app's own code
    alias: {
      $core: path.resolve('../../core'),
      '$core/*': path.resolve('../../core/*'),
      $components: path.resolve('../../core/components'),
      '$components/*': path.resolve('../../core/components/*'),
      $journey: path.resolve('../../core/journey'),
      '$journey/*': path.resolve('../../core/journey/*'),
      '$app-locales': path.resolve('./src/locales'),
      '$app-locales/*': path.resolve('./src/locales/*'),
      $locales: path.resolve('../../core/locales'),
      '$locales/*': path.resolve('../../core/locales/*'),
      $package: path.resolve('../../packages/login-widget/dist'),
      '$package/*': path.resolve('../../packages/login-widget/dist/*'),
      // Server utilities live in the app, not the widget
      $server: path.resolve('./src/lib/server'),
      '$server/*': path.resolve('./src/lib/server/*'),
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
