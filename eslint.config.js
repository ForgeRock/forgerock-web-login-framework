import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';
import storybook from 'eslint-plugin-storybook';

export default tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Svelte recommended rules
  ...svelte.configs['flat/recommended'],

  // Storybook rules
  ...storybook.configs['flat/recommended'],

  // Global settings
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2017,
        ...globals.node,
      },
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
    },
  },

  // Svelte file specific settings
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // Custom rule overrides
  {
    rules: {
      // Disable navigation resolve rules - too strict for existing codebase
      'svelte/no-navigation-without-resolve': 'off',
      // Disable each-key requirement - existing codebase doesn't use keys
      'svelte/require-each-key': 'off',
      // Warn on HTML tags (XSS) instead of error
      'svelte/no-at-html-tags': 'warn',
      // Warn on infinite reactive loop detection (can have false positives)
      'svelte/infinite-reactive-loop': 'warn',
      // Warn on immutable reactive statements
      'svelte/no-immutable-reactive-statements': 'warn',
      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_|^err$',
        },
      ],
      // Allow unused expressions for optional chaining side effects
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
    },
  },

  // Ignore patterns
  {
    ignores: [
      '**/storybook-static/**',
      '.storybook/**',
      'seed.spec.ts',
      '**/*.cjs',
      '**/*.json',
      'packages/login-widget/dist/**',
      'packages/login-widget/svelte-package/**',
      '**/.svelte-kit/**',
      '.husky/**',
      'node_modules/**',
      '**/build/**',
      'core/**/*.d.ts',
      'packages/login-widget/dist/**/*.d.ts',
    ],
  },
);
