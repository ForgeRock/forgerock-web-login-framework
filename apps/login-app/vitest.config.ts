import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

import { customRegistry } from '../../core/journey/_utilities/registry/vite-plugin';

export default defineConfig({
  resolve: {
    alias: {
      $core: resolve('../../core'),
      $components: resolve('../../core/components'),
      $journey: resolve('../../core/journey'),
      $locales: resolve('../../core/locales'),
      '$app-locales': resolve('./src/locales'),
      $lib: resolve('./src/lib'),
      $server: resolve('./src/lib/server'),
    },
  },
  plugins: [
    customRegistry({ projectRoot: resolve('../..') }),
    svelte({ hot: !process.env.VITEST }),
  ],
  test: {
    include: [resolve('./src/**/*.test.ts')],
    exclude: ['node_modules', 'dist'],
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
});
