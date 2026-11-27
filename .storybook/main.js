import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';

import { customRegistry } from '../core/journey/_utilities/registry/vite-plugin.ts';
import { customImportBoundary } from '../core/vite-plugin-custom-imports.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  stories: [
    '../core/**/*.stories.@(js|jsx|ts|tsx|svelte)',
    '../custom/components/**/*.stories.@(js|jsx|ts|tsx|svelte)',
    '../apps/login-app/src/lib/**/*.stories.@(js|jsx|ts|tsx|svelte)',
  ],
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

    const extraPlugins = [
      customRegistry({ projectRoot: resolve(__dirname, '..') }),
      customImportBoundary({ projectRoot: resolve(__dirname, '..') }),
    ];
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
          '$login-framework': resolve(__dirname, '../custom/components/login-framework.ts'),
          // Bare key prefix-matches $custom/<rest>; a '$custom/*' key would
          // never match (Vite alias object keys match exactly or by /-boundary).
          $custom: resolve(__dirname, '../custom/components'),
          $lib: resolve(__dirname, '../apps/login-app/src/lib'),
        },
      },
    });
  },
};
