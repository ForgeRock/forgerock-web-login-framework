import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';


const config = {
  plugins: [basicSsl(), sveltekit()],
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
      $locales: path.resolve('./src/locales'),
      $widget: path.resolve('./src/widget'),
    },
  },
  server: {
    cors: {
      // Use if SvelteKit server needs to support external apps
      // origin: 'https://react.crbrl.ngrok.io',
      // credentials: true
    },
    fs: {
      allow: ['locales', 'package'],
    },
    hmr: {
      // Use if tunneling through Ngrok
      // port: 443
    },
    https: true,
    port: 3000,
  },
}

export default config;
