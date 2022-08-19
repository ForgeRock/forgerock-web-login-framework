import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

import aliases from './alias.config';

const config = {
  plugins: [basicSsl(), sveltekit()],
  resolve: {
    alias: aliases,
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
    watch: {
      // Very important or HMR will go nuts on all the package/* file changes
      ignored: ['**/package/**'],
    }
  },
  preview: {
    port: 3000,
  },
};

export default config;
