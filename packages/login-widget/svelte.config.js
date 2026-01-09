import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Svelte 5 compatibility - maintains new Widget({ target }) pattern
    compatibility: {
      componentApi: 4,
    },
  },
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],
};

export default config;
