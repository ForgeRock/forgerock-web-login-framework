import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import storybook from 'eslint-plugin-storybook';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { resolve } from 'node:path';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

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
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1) value imports from proper (package) modules
            ['^\\u0000[^.$]', '^[^.$]'],
            // 2) value imports from file-based modules (relative + $ aliases)
            ['^\\u0000\\$', '^\\u0000\\.', '^\\$', '^\\.'],
            // 3) type-only imports from proper modules
            ['^[^.$].*\\u0000$'],
            // 4) type-only imports from file-based modules (relative + $ aliases)
            ['^(\\$|\\.).*\\u0000$'],
          ],
        },
      ],
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

  // TypeScript/Svelte import style (keeps type-only imports in their own blocks)
  {
    files: ['**/*.{ts,tsx,svelte}'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },

  // Ignore everything listed in .gitignore
  includeIgnoreFile(resolve('.gitignore')),

  // Additional ignores not covered by .gitignore
  {
    ignores: ['component-studio/**', '.storybook/**', 'seed.spec.ts', '**/*.cjs', '**/*.json'],
  },
);
