const { resolve } = require('path');
const { mergeConfig } = require('vite');

module.exports = {
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

  // For tighter Vite integration
  async viteFinal(config) {
    return mergeConfig(config, {
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
