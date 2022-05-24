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
    // Using the Svelte CSF is quite limiting
    // '@storybook/addon-svelte-csf',
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
          $components: resolve('./src/lib/components'),
          $journey: resolve('./src/lib/journey'),
          $widget: resolve('./src/lib/widget'),
        }
      }
    });
  }
};
