const plugin = require('tailwindcss/plugin');

const boxes = require('./boxes.cjs');
const compositions = require('./compositions.cjs');
const journey = require('./journey.cjs');
const primitives = require('./primitives.cjs');
const designTokens = require('./tokens.cjs');
const utilities = require('./utilities.cjs');

/**
 * The below theme just extends from the default them found here:
 * https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  /**
   * The "theme" object is essentially how you set your "design tokens".
   * These are the small unites of colors, spacing, border widgets and such
   * that are used throughout the system.
   *
   * You can either add properties straight to the theme and create your
   * own from scratch, or you can use an existing theme and extend/modify
  */
  theme: {
    extend: {
      ...designTokens,
    },
  },
  /**
   * Prefixing all classes, so they don't collide with existing classes, if used as widget
   */
  prefix: 'tw_',
  /**
   * Plugins are used to add additional classes to Tailwind and have them function
   * as if they were already a part of the system. This is helpful if you want to add
   * more complex component classes that control more than just one style attribute.
   */
  plugins: [
    plugin(({ addComponents, addUtilities, theme }) => {
      addComponents({
        /**
         * Non-alpha order is intentional
         */
        ...primitives(theme),
        ...boxes(theme),
        ...compositions(theme),
        ...journey(theme),
      });
      addUtilities(utilities(theme));
    }),
  ],
};
