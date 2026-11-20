/**
 * Storybook-specific Tailwind config.
 * Re-uses the widget preset but overrides content paths to resolve
 * correctly from the monorepo root (where Storybook runs).
 */
module.exports = {
  content: [
    './packages/login-widget/src/**/*.{html,js,svelte,ts}',
    // Negated subglobs: core/ is a workspace package with its own
    // node_modules and dist; scanning them bloats the CSS and slows builds.
    // dist-server is the duplicate SSR tree and *.d.ts are duplicate copies
    // of the sources, so neither can add classes the scan has not seen.
    './core/**/*.{html,js,svelte,ts}',
    '!./core/node_modules/**',
    '!./core/dist/**',
    '!./core/dist-server/**',
    '!./core/**/*.d.ts',
    './apps/**/*.{html,js,svelte,ts}',
    './experimental/custom/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  presets: [require('../themes/default/config.cjs')],
  theme: {
    extend: {},
  },
};
