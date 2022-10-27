module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}', './.storybook/preview-head.html'],
  darkMode: 'class',
  presets: [require('./themes/default/config.cjs')],
  theme: {
    extend: {
      // https://tailwindcss.com/docs/theme
    },
  },
};
