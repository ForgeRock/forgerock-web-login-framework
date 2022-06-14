const colorLib = require('color');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

/**
 * The below theme just extends from the default them found here:
 * https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      accentColor: ({ theme }) => ({
        primary: theme('colors.primary.dark'),
        secondary: theme('colors.secondary.dark'),
      }),
      colors: {
        body: {
          DEFAULT: colors.slate[700],
        },
        error: {
          dark: colors.red[700],
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
          light: colors.gray[200],
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
    },
  },
  /**
   * Prefixing all classes, so they don't collide with existing classes, if used as widget
   */
  prefix: 'tw_',
  plugins: [
    plugin(({ addComponents, addUtilities, theme }) => {
      addComponents({
        /**
         * Button primitive theme settings
         */
        '.button-base': {
          // NOTE: Ensure all button have borders for consistent height between regular and outline buttons
          border: `${theme('borderWidth.DEFAULT')} solid`,
          borderRadius: theme('borderRadius.DEFAULT'),
          position: 'relative',
          fontSize: theme('fontSize.base'),
          lineHeight: 1.5,
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          zIndex: '0',
          // Double && doubles up class to increase selector specificity
          '&:focus': {
            outlineOffset: '2px',
          },
          '&::before': {
            background: `black`,
            outline: `${theme('borderWidth.DEFAULT')} solid black`,
            borderRadius: theme('borderRadius.DEFAULT'),
            content: '""',
            display: 'block',
            height: '100%',
            left: '0',
            position: 'absolute',
            opacity: '0',
            top: '0',
            transition: `opacity 0.25s`,
            width: '100%',
            zIndex: '-1',
          },
          '&:hover::before, &:focus::before': {
            opacity: `0.05`,
          },
        },
        '.button-primary': {
          borderColor: theme('colors.primary.dark'),
          backgroundColor: theme('colors.primary.dark'),
          color: theme('colors.white'),
          '&:hover::before, &:focus::before': {
            opacity: `0.2`,
          },
        },
        '.button-outline': {
          borderColor: `${theme('borderWidth.DEFAULT')} solid ${theme('colors.secondary.dark')}`,
        },
        '.button-secondary': {
          borderColor: theme('colors.secondary.light'),
          backgroundColor: theme('colors.secondary.light'),
          color: theme('colors.black'),
        },
        /**
         * Container theme settings
         */
        '.containing-box': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.DEFAULT'),
          height: 'fit-content',
          margin: `auto 0`,
          padding: `${theme('spacing.14')} ${theme('spacing.10')}`,
          width: '500px',
        },
        /**
         * Checkbox primitive theme settings
         */
        '.checkbox-label': {
          marginBottom: theme('spacing.4'),
        },
        '.checkbox-input': {
          accentColor: theme('colors.primary.dark'),
          borderRadius: theme('borderRadius.DEFAULT'),
          flex: 1,
          height: theme('spacing.4'),
          marginRight: theme('spacing.1'),
          position: 'relative',
          width: theme('spacing.4'),
          top: theme('spacing.1'),
        },
        /**
         * String input and select primitive theme settings
         */
        '.input-base': {
          backgroundColor: theme('colors.white'),
          border: `${theme('borderWidth.DEFAULT')} solid ${theme('colors.gray.400')}`,
          borderRadius: theme('borderRadius.DEFAULT'),
          color: theme('colors.black'),
          display: 'block',
          fontSize: theme('fontSize.base'),
          lineHeight: theme('spacing.6'),
          padding: theme('spacing.3'),
          transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
        },
        '.select-base': {
          appearance: 'none',
          background: `no-repeat right ${theme(
            'spacing.3',
          )} center / 16px 12px url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
            theme('colors.gray.500'),
          ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
          height: 'calc(3rem + 2px)',
        },
        /**
         * Essentially the same technique as Twitter Bootstrap's v5 "floating label"
         * https://getbootstrap.com/docs/5.0/forms/floating-labels/
         *
         * TODO: See if the new CSS pseudo-selector `has()` can replace below technique
         * when it gets full browser support
         */
        '.input-floating': {
          '&:focus, &:not(:placeholder-shown)': {
            paddingBottom: theme('spacing.1'),
            paddingTop: theme('spacing.5'),
          },
          '&::-ms-reveal': {
            display: 'none',
          },
          '&::placeholder': {
            color: 'transparent',
          },
          '&:focus ~ label, &:not(:placeholder-shown) ~ label': {
            fontWeight: theme('fontWeight.medium'),
            transform: 'scale(0.85) translateY(-0.5rem) translateX(0.15rem)',
          },
        },
        '.input-floating-label': {
          color: theme('colors.secondary.dark'),
          height: 'calc(3rem + 2px)',
          lineHeight: theme('spacing.6'),
          padding: theme('spacing.3'),
          pointerEvents: 'none',
          transformOrigin: '0 0',
          transition: 'opacity 0.1s ease-in-out, transform 0.1s ease-in-out',
        },
        '.input-stacked-label': {
          color: theme('colors.primary.dark'),
          fontWeight: 'bold',
          lineHeight: theme('spacing.6'),
        },
        '.select-floating': {
          lineHeight: theme('spacing.4'),
          padding: `${theme('spacing.6')} ${theme('spacing.9')} ${theme('spacing.1')} ${theme(
            'spacing.3',
          )}`,
        },
        '.select-floating-label': {
          fontWeight: theme('fontWeight.medium'),
        },
      });
      addUtilities({
        /**
         * https://www.sarasoueidan.com/blog/focus-indicators/
         */
        '.focusable-element': {
          '&:focus': {
            outlineColor: 'var(--tw-ring-color)',
            outlineOffset: '0',
            outlineStyle: 'solid',
            outlineWidth: '2px',
          },
        },
        '.primary-header': {
          color: theme('colors.primary.dark'),
          fontSize: theme('fontSize.2xl'),
          fontWeight: theme('fontWeight.light'),
          marginBottom: theme('spacing.2'),
          textAlign: 'center',
        },
      });
    }),
  ],
};
