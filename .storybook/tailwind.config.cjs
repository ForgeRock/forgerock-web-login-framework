/**
 * Storybook-specific Tailwind config.
 * Re-uses the widget preset but overrides content paths to resolve
 * correctly from the monorepo root (where Storybook runs).
 */
module.exports = {
  content: [
    './packages/login-widget/src/**/*.{html,js,svelte,ts}',
    './core/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  presets: [require('../themes/default/config.cjs')],
  theme: {
    extend: {},
  },
};
