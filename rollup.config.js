import autoprefixer from 'autoprefixer';
import path from 'path';
import postcssImport from 'postcss-import';
import rimraf from 'rimraf';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import preprocess from 'svelte-preprocess';
import tailwindcss from 'tailwindcss';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: ['src/lib/widget/modal.svelte', 'src/lib/widget/inline.svelte'],
  onwarn: (warning) => {
    // TODO: Revisit once the JS SDK is updated to pure ES Modules
    if (warning.code === 'THIS_IS_UNDEFINED') {
      return;
    }

    // console.warn everything else
    console.warn(warning.message);
  },
  output: {
    sourcemap: true,
    format: 'es',
    name: 'login-widget',
    dir: 'package/',
    plugins: [],
  },
  plugins: [
    alias({
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
      entries: {
        $components: path.resolve('./src/lib/components'),
        $journey: path.resolve('./src/lib/journey'),
        $locales: path.resolve('./locales'),
        $widget: path.resolve('./src/lib/widget'),
      },
    }),
    // Clear target directory
    {
      name: 'generate-bundle-plugin',
      generateBundle() {
        // Clears out `/package` directory when the new bundle is generated
        // NOTE: Returning a promise is required to ensure this completes before writing bundle
        return new Promise((resolve) => {
          rimraf(path.resolve('./package/*.js'), () => {
            // TODO: Improve this so it's not a nested function
            // Can't do './package/*.js*' above or it removes the package.json file
            rimraf(path.resolve('./package/*.js.map'), resolve);
          });
        });
      },
    },
    json(),
    // Generate CSS output from `import 'thing.css';` imports and component <style>
    postcss({
      extract: path.resolve('./package/widget.css'),
      plugins: [postcssImport, tailwindcss, autoprefixer],
    }),
    // Compile Svelte
    svelte({
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
      emitCss: true,
      preprocess: preprocess({
        typescript: {
          tsconfigFile: './tsconfig.json',
        },
      }),
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
  watch: {
    clearScreen: false,
  },
};
