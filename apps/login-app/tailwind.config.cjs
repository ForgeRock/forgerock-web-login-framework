module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    // The app compiles the login-framework package's built dist (not core
    // sources), so Tailwind scans the emitted .component.js/.js files; the
    // package's own node_modules (pnpm symlinks) stay negated.
    '../../core/dist/**/*.js',
    '!../../core/node_modules/**',
    '../../packages/login-widget/src/**/*.{html,js,svelte,ts}',
    '../../experimental/custom/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  presets: [require('../../themes/default/config.cjs')],
  theme: {
    extend: {
      // https://tailwindcss.com/docs/theme
    },
  },
};
