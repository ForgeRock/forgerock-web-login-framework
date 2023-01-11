import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

const config = {
  plugins: [basicSsl(), sveltekit()],
  server: {
    host: '0.0.0.0',
    cors: {
      // Use if SvelteKit server needs to support external apps
      // origin: //'https://react.crbrl.ngrok.io',
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
    port: 8443,
    watch: {
      // If a request is made on page render, enable the below, or it will cause a ton of requests on change
      // ignored: ['**/package/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
};

export default config;
