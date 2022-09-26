const { resolve } = require('path');
const preprocess = require('svelte-preprocess');
const { mergeConfig } = require('vite'); // use `mergeConfig` to recursively merge Vite options

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
  staticDirs: ['../static'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
    'storybook-dark-mode',
    // https://storybook.js.org/addons/storybook-addon-code-editor
    // 'storybook-addon-code-editor',
  ],
  framework: '@storybook/svelte',
  core: {
    builder: '@storybook/builder-vite',
  },
  svelteOptions: {
    preprocess: preprocess(),
  },
  features: {
    storyStoreV7: true,
  },
  // For tighter Vite integration
  async viteFinal(config, { configType }) {
    // return the customized config
    return mergeConfig(config, {
      // customize the Vite config here
      resolve: {
        alias: {
          /**
           * Reminder to ensure aliases are also added here:
           * 1. .storybook/main.js.
           * 2. tsconfig.json
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
};
