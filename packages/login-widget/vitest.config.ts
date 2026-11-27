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
      '$login-framework': resolve('../../custom/components/login-framework.ts'),
      // Unit tests importing customer components resolve the sandbox from the
      // source tree, the same directory the frameworkCoreDist plugin maps
      // $custom onto in the consumer builds.
      $custom: resolve('../../custom/components'),
    },
  },
  plugins: [
    customRegistry({ projectRoot: resolve('../..') }),
    svelte({ hot: !process.env.VITEST }),
  ],
  test: {
    include: [
      resolve('../../core/**/*.test.ts'),
      resolve('../../custom/components/**/*.test.ts'),
      resolve('../../themes/**/*.test.ts'),
      resolve('./src/**/*.test.ts'),
      resolve('./scripts/**/*.test.mjs'),
      resolve('./*.test.ts'),
    ],
    // Absolute globs: core/ is a workspace package with its own
    // node_modules, and picomatch `**` does not match `../..`, so bare
    // 'node_modules' misses core/node_modules (zod's own tests get picked up).
    exclude: [resolve('../../**/node_modules/**'), resolve('../../**/dist/**')],
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
});
