import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      $core: resolve('../../core'),
      $components: resolve('../../core/components'),
      $journey: resolve('../../core/journey'),
      $locales: resolve('../../core/locales'),
      '$login-framework': resolve('../../experimental/custom/login-framework.ts'),
    },
  },
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: [
      resolve('../../core/**/*.test.ts'),
      resolve('../../experimental/custom/**/*.test.ts'),
    ],
    exclude: ['node_modules', 'dist'],
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
});
