import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      $core: resolve('../../core'),
      $components: resolve('../../core/components'),
      $journey: resolve('../../core/journey'),
      $locales: resolve('../../core/locales'),
    },
  },
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    dir: '../../core',
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
});
