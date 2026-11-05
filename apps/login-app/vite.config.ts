import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';
import { defineConfig } from 'vite';

import { customRegistry } from '../../core/journey/_utilities/registry/vite-plugin';

import type { UserConfig } from 'vite';

// The preview proxy forwards to the configured AM origin — default domain by
// default, or the custom domain when FR_AM_URL points at one.
const amProxyTarget = new URL(process.env.FR_AM_URL ?? 'https://openam-sdks.forgeblocks.com/am')
  .origin;

export default defineConfig(
  ({ mode }): UserConfig => ({
    envDir: resolve('../..'),
    plugins: [
      customRegistry({ projectRoot: resolve('../..') }),
      // Only use SSL plugin in development mode, not production/preview
      ...(mode === 'development' ? [basicSsl()] : []),
      sveltekit(),
    ],
    resolve: {
      alias: {
        '$app-locales': resolve('./src/locales'),
        $locales: resolve('../../core/locales'),
        $package: resolve('../../packages/login-widget/dist'),
        '$login-framework': resolve('../../experimental/custom/login-framework.ts'),
        $custom: resolve('../../experimental/custom'),
        '$custom/*': resolve('../../experimental/custom/*'),
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
        // Allow serving files from the core, widget, and experimental custom-component directories.
        allow: ['../../core', '../../packages/login-widget', '../../experimental'],
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
      // The proxy target follows FR_AM_URL (custom domains included);
      // changeOrigin presents that origin's Host so AM answers as itself.
      // /enduser and /openidm are proxied for the enduser-dashboard redirect flow.
      proxy: {
        '/am': {
          target: amProxyTarget,
          changeOrigin: true,
        },
        '/enduser': {
          target: amProxyTarget,
          changeOrigin: true,
        },
        '/openidm': {
          target: amProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }),
);
