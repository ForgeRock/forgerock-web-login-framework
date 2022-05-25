import { resolve } from 'path';
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  resolve: {
    alias: {
      $components: resolve('./src/lib/components'),
        $journey: resolve('./src/lib/journey'),
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
