import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  build: {
    sourcemap: 'inline',
  },
  kit: {
    adapter: adapter(),
    vite: {
      server: {
        hmr: {
          // Use if tunneling through Ngrok is used
          // port: 443
        },
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
