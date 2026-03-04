import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      $server: resolve('./src/lib/server'),
      $routes: resolve('./src/routes'),
    },
  },
  test: {
    include: ['src/lib/server/**/*.test.ts'],
    exclude: ['src/lib/server/integration/**'],
  },
});
