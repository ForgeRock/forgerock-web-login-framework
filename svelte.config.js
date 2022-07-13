import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    vite: {
      resolve: {
        alias: {
          /**
           * Reminder to ensure aliases are added to the following:
           *
           * 1. svelte.config.js
           * 2. rollup.config.js
           * 3. .storybook/main.js.
           * 4. vitest.config.ts
           *
           * TODO: Share alias object with other configs listed above
           */
          $components: path.resolve('./src/lib/components'),
          $journey: path.resolve('./src/lib/journey'),
          $locales: path.resolve('./locales'),
          $widget: path.resolve('./src/lib/widget'),
        },
      },
      server: {
        hmr: {
          // Use if tunneling through Ngrok
          // port: 443
        },
        https: true,
        cors: {
          // Use if SvelteKit server needs to support external apps
          // origin: 'https://react.crbrl.ngrok.io',
          // credentials: true
        },
        fs: {
          allow: ['locales', 'package'],
        },
      },
    },
  },
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess({
    postcss: true,
  }),
};

export default config;
