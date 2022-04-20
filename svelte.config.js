import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	build: {
		sourcemap: 'inline',
	},
	kit: {
		adapter: adapter(),
		vite: {
			server: {
				hmr: {
					port: 443
				},
				cors: {
					origin: 'https://react-sample.ngrok.io',
					credentials: true,
				},
			}
		}
	},
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),
};

export default config;
