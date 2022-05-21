const preprocess = require('svelte-preprocess');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-svelte-csf',
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
    storyStoreV7: false
  },
  //   async viteFinal(config, { configType }) {
  //     // return the customized config
  //     return mergeConfig(config, {
  //       // customize the Vite config here
  //       resolve: {
  //         alias: {}
  //       }
  //     });
  //   }
};
