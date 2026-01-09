import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(
  ({ mode }): UserConfig => ({
    plugins: [
      // Only use SSL plugin in development mode, not production/preview
      ...(mode === 'development' ? [basicSsl()] : []),
      sveltekit(),
    ],
    resolve: {
      alias: {
        '$app-locales': resolve('./src/locales'),
        $locales: resolve('../../core/locales'),
        $package: resolve('../../packages/login-widget/dist'),
      },
    },
    server: {
      host: '0.0.0.0',
      cors: {
        // Use if SvelteKit server needs to support external apps
        // origin: //'https://react.crbrl.ngrok.io',
        // credentials: true
      },
      fs: {
        // Allow serving files from the core directory and widget package
        allow: ['../../core', '../../packages/login-widget'],
      },
      hmr: {
        // Use if tunneling through Ngrok
        // port: 443
      },
      // HTTPS is handled by basicSsl plugin in dev mode
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
  }),
);
