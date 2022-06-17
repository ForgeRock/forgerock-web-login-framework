const colorLib = require('color');
const plugin = require('tailwindcss/plugin');

const boxes = require('./boxes.cjs');
const buttons = require('./buttons.cjs');
const designTokens = require('./tokens.cjs');
const inputs = require('./inputs.cjs');

/**
 * The below theme just extends from the default them found here:
 * https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      ...designTokens,
    },
  },
  /**
   * Prefixing all classes, so they don't collide with existing classes, if used as widget
   */
  prefix: 'tw_',
  plugins: [
    plugin(({ addComponents, addUtilities, theme }) => {
      addComponents({
        ...buttons(theme),
        ...boxes(theme),
        ...inputs(theme),
      });
      addUtilities({
        /**
         * https://www.sarasoueidan.com/blog/focus-indicators/
         */
        '.focusable-element': {
          outlineColor: colorLib(theme('ringColor.DEFAULT')).fade(0.7).toString(),
          outlineOffset: '0',
          outlineStyle: 'solid',
          outlineWidth: '0',
          transition:
            'background-color ease-in-out 0.15s, outline-color ease-in-out 0.2s, outline-offset ease-in-out 0.1s',
          '&:focus': {
            outlineOffset: '0',
            outlineWidth: '3px',
            outlineColor: colorLib(theme('ringColor.DEFAULT')).fade(0.1).toString(),
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
