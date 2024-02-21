module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:storybook/recommended',
  ],
  plugins: ['svelte3', '@typescript-eslint'],
  ignorePatterns: [
    'storybook-static',
    '*.cjs',
    '*.json',
    'package/*',
    'svelte-package/*',
    '.svelte-kit',
    '.svelte-kit/tsconfig.json',
    '.husky',
  ],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
    {
      files: ['test/**'],
      plugins: ['plugin:playwright/recommended'],
    },
  ],
  settings: {
    'svelte3/typescript': () => require('typescript'),
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
};
