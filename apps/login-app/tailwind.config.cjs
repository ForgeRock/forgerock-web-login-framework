module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    // Negated subglobs: core/ is a workspace package with its own
    // node_modules and dist; scanning them bloats the CSS and slows builds.
    '../../core/**/*.{html,js,svelte,ts}',
    '!../../core/node_modules/**',
    '!../../core/dist/**',
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
