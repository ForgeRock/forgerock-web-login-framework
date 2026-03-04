module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}', '../../core/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  presets: [require('../../themes/default/config.cjs')],
  theme: {
    extend: {
      // https://tailwindcss.com/docs/theme
    },
  },
};
