import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import svelte from 'rollup-plugin-svelte';
import alias from '@rollup/plugin-alias';
import sveltePreprocess from 'svelte-preprocess';

import aliases from './alias.config.js';

const production = !process.env.ROLLUP_WATCH;
const packageFolder = 'package';
const plugins = [
  alias({
    entries: aliases,
  }),
  postcss({
    extract: path.resolve('./package/widget.css'),
    plugins: [postcssImport, tailwindcss, autoprefixer],
  }),
  svelte({
    compilerOptions: {
      // enable run-time checks when not in production
      dev: !production,
    },

    // we want to embed the CSS in the generated JS bundle
    emitCss: true,
    preprocess: sveltePreprocess({
      typescript: {
        tsconfigFile: './tsconfig.json',
      },
    }),
  }),
  resolve({
    browser: true,
    dedupe: ['svelte'],
  }),
  commonjs(),
  json(),

  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: true,
    inlineSources: true,
  }),
  // minify
  // production && terser(),
];

function warningHandler(warning) {
  // TODO: Revisit once the JS SDK is updated to pure ES Modules
  if (warning.code === 'THIS_IS_UNDEFINED') {
    return;
  }

  // TODO: This is Tailwind confusing nested rules with cascade layers in file `src/lib/widget/main.css`
  if (warning.message.includes('Nested @tailwind rules were detected, but are not supported.')) {
    return;
  }

  // TODO: Improve our use of regular JS files within project; using `allowJS` breaks type generation
  if (warning.message.includes('@rollup/plugin-typescript TS7016')) {
    return;
  }

  // console.warn everything else
  console.warn(warning.message);
}

export default [
  /** ****************************
   * ES Module Bundling
   */
  {
    input: 'src/lib/widget/inline.svelte',
    onwarn: warningHandler,
    output: {
      file: path.join(packageFolder, 'inline.js'),
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins,
  },
  {
    input: 'src/lib/widget/modal.svelte',
    onwarn: warningHandler,
    output: {
      file: path.join(packageFolder, 'modal.js'),
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins,
  },

  /** ****************************
   * CJS Module Bundling
   */
  {
    input: 'src/lib/widget/inline.svelte',
    onwarn: warningHandler,
    output: {
      file: path.join(packageFolder, 'inline.cjs'),
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins,
  },
  {
    input: 'src/lib/widget/modal.svelte',
    onwarn: warningHandler,
    output: {
      file: path.join(packageFolder, 'modal.cjs'),
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    plugins,
  },
];
