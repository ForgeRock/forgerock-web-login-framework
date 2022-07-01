module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  presets: [
    require('./themes/default/config.cjs'),
  ],
  theme: {
    extend: {
      // https://tailwindcss.com/docs/theme
    }
  },
  // prefix: '<your prefix, if needed>',
  // plugins: [
    // https://tailwindcss.com/docs/plugins#adding-components
  // ]
}
