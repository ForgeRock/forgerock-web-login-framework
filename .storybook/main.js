const { resolve } = require('path');
const preprocess = require('svelte-preprocess');
const { mergeConfig } = require('vite'); // use `mergeConfig` to recursively merge Vite options
const turbosnap = require('vite-plugin-turbosnap');

module.exports = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
  staticDirs: ['../static'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    // https://storybook.js.org/addons/storybook-addon-code-editor
    // 'storybook-addon-code-editor',
    'storybook-dark-mode',
    {
      name: '@storybook/addon-styling',
      options: {},
    },
  ],

  framework: {
    name: '@storybook/sveltekit',
    options: {},
  },
  // For tighter Vite integration
  async viteFinal(config, { configType }) {
    // return the customized config
    return mergeConfig(config, {
      plugins:
        configType === 'PRODUCTION'
          ? [
              turbosnap({
                rootDir: config.root ?? process.cwd(),
              }),
            ]
          : [],
      // customize the Vite config here
      resolve: {
        alias: {
          /**
           * Reminder to ensure aliases are also added here:
           * 1. /config.alias.js
           * 2. /tsconfig.json
           */
          $components: resolve('./src/lib/components'),
          $journey: resolve('./src/lib/journey'),
          $lib: resolve('./src/lib'),
          $locales: resolve('./src/locales'),
          $widget: resolve('./src/widget'),
        },
      },
    });
  },
  docs: {
    autodocs: true,
  },
};
