import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';
import { resolve } from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  build: {
    sourcemap: 'inline',
  },
  kit: {
    adapter: adapter(),
    vite: {
      resolve: {
        alias: {
          /**
           * Reminder to ensure aliases are added to tsconfig.json,
           * rollup.config.js and .storybook/main.js.
           *
           * TODO: Share alias object with other configs listed above
           */

          $components: resolve('./src/lib/components'),
          $journey: resolve('./src/lib/journey'),
          $widget: resolve('./src/lib/widget'),
        }
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
          allow: ['package']
        }
      }
    }
  },
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess()
};

export default config;
