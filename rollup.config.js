import path from 'path';
import rimraf from 'rimraf';
import svelte from 'rollup-plugin-svelte';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';
import preprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: ['src/lib/widget/modal.svelte', 'src/lib/widget/inline.svelte'],
  output: {
    sourcemap: true,
    format: 'es',
    name: 'login-widget',
    dir: 'package/',
    plugins: [],
  },
  plugins: [
    alias({
      entries: {
        $components: path.resolve('./src/lib/components'),
        $journey: path.resolve('./src/lib/journey'),
        $widget: path.resolve('./src/lib/widget'),
      },
    }),
    {
      name: 'watch-change-plugin',
      watchChange(id) {
        return new Promise((resolve, reject) => {
          if (id.includes('src/lib/widget/modal.svelte')) {
            rimraf(path.resolve('./package/modal.js'), () => resolve());
          } else if (id.includes('src/lib/widget/inline.svelte')) {
            rimraf(path.resolve('./package/inline.js'), () => resolve());
          } else {
            this.warn('Watch change plugin detected a non-entry point file change.');
            this.warn('Will remove the old shared output `form-<hash>.js` file.');
            rimraf(path.resolve('./package/form-*.js'), () => resolve());
          }
        });
      },
    },
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
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: 'bundle.css' }),

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
    typescript(),
  ],
  watch: {
    clearScreen: false,
  },
};
