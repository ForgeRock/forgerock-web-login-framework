import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

import aliases from './alias.config';

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  plugins: [svelte({ hot: !process.env.VITEST })],
});
