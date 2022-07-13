const colorLib = require('color');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  accentColor: ({ theme }) => ({
    primary: theme('colors.primary.dark'),
    secondary: theme('colors.secondary.dark'),
  }),
  colors: {
    background: {
      dark: colors.slate[800],
      light: colors.slate[100],
    },
    body: {
      dark: colors.slate[900],
      light: colors.slate[700],
    },
    error: {
      dark: colors.red[600],
      light: colors.red[400],
    },
    primary: {
      dark: colors.slate[700],
      /**
       * Darken the usual blue color to meet WCAG2 AA accessibility requirement
       * for use as a background with white text
       */
      light: colorLib(colors.sky[600]).darken(0.075).hex(),
    },
    tertiary: {
      dark: colors.purple[700],
      light: colors.purple[400],
    },
    secondary: {
      dark: colors.gray[700],
      DEFAULT: colors.gray[400],
      light: colors.gray[300],
    },
    success: {
      dark: colors.green[700],
      light: colors.green[400],
    },
    warning: {
      dark: colors.yellow[700],
      light: colors.yellow[400],
    },
  },
  fontFamily: {
    sans: ['"Open Sans"', ...defaultTheme.fontFamily.sans],
  },
  fontSize: {
    sm: ['0.8125rem', '1.25'],
    base: ['0.9375rem', '1.25'],
    lg: ['1.25rem', '1'],
    xl: ['1.5rem', '2.5'],
    '2xl': ['2rem', '2.5'],
    '3xl': ['3rem', '3.75'],
  },
  ringColor: ({ theme }) => ({
    DEFAULT: theme('colors.tertiary.dark'),
    ...theme('colors'),
  }),
}
