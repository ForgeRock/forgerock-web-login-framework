import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // The host mounts this app at this prefix: Kit strips it when matching
    // routes and adds it to every URL the app emits.
    paths: { base: '/custom-components' },
    // Pages render in the browser only (ssr = false), so deployment is plain
    // static files — no Node runtime. fallback: every URL serves the app
    // shell; the client router then renders the actual route.
    adapter: adapter({ fallback: 'index.html' }),
  },
};

export default config;
