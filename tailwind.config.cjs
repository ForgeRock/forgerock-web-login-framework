const colorLib = require('color');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  presets: [
    require('./themes/default.config.cjs'),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          // dark: colors.green[600],
          // light: colors.green[200],
        },
      },
      fontFamily: {},
      fontSize: {},
    }
  },
  // prefix: '<your prefix, if needed>',
  // plugins: [
    // plugin(({ addComponents, theme }) => {
      // addComponents({
        // https://tailwindcss.com/docs/plugins#adding-components
      // })
    // })
  // ]
}
