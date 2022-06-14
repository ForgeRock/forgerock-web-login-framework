const { resolve } = require('path');
const preprocess = require('svelte-preprocess');
// use `mergeConfig` to recursively merge Vite options
const { mergeConfig } = require('vite');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss')
        }
      }
    }
  ],
  framework: '@storybook/svelte',
  core: {
    builder: '@storybook/builder-vite'
  },
  svelteOptions: {
    preprocess: preprocess()
  },
  features: {
    storyStoreV7: true
  },
  // For tighter Vite integration
  async viteFinal(config, { configType }) {
    // return the customized config
    return mergeConfig(config, {
      // customize the Vite config here
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
      }
    });
  }
};
