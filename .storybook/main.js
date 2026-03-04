import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  stories: ['../core/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
  staticDirs: ['../apps/login-app/static'],

  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@vueless/storybook-dark-mode',
    '@storybook/addon-docs',
  ],

  framework: {
    name: '@storybook/sveltekit',
    options: {},
  },

  async viteFinal(config) {
    // Check if the Svelte Vite plugin is already registered by the framework.
    // When Storybook runs from the monorepo root (outside SvelteKit), the
    // framework preset may not add it automatically.
    const hasSveltePlugin = (config.plugins || [])
      .flat()
      .some((p) => p && p.name && p.name.startsWith('vite-plugin-svelte'));

    const extraPlugins = [];
    if (!hasSveltePlugin) {
      const { svelte } = await import('@sveltejs/vite-plugin-svelte');
      extraPlugins.push(svelte());
    }

    return mergeConfig(config, {
      plugins: extraPlugins,
      resolve: {
        alias: {
          $core: resolve(__dirname, '../core'),
          $components: resolve(__dirname, '../core/components'),
          $journey: resolve(__dirname, '../core/journey'),
          $locales: resolve(__dirname, '../core/locales'),
        },
      },
    });
  },
};
