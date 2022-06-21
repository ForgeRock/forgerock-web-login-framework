import { resolve } from 'path';
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  resolve: {
    alias: {
      /**
       * Reminder to ensure aliases are added to the following:
       *
       * 1. svelte.config.js
       * 2. rollup.config.js
       * 3. .storybook/main.js.
       * 4. vitest.config.ts
       *
       * TODO: Share alias object with other configs listed above
       */
      $components: resolve('./src/lib/components'),
      $journey: resolve('./src/lib/journey'),
      $lib: resolve('./src/lib'),
      $widget: resolve('./src/lib/widget'),
    }
  },
  plugins: [
    svelte({ hot: !process.env.VITEST }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
