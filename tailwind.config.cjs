module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        cyan: '#17a2b8',
        blue: '#0B7BC1',
        'gray-dark': '#324054',
        gray: '#69788b',
        'gray-light': '#d3d8e0',
        green: '#2ed47a',
        indigo: '#6610f2',
        'light-blue': '#e4f4fd',
        magenta: '#d24572',
        orange: '#fd7e14',
        purple: '#6f42c1',
        pink: '#e83e8c',
        red: '#f7685b',
        teal: '#20c997',
        yellow: '#ffb946',
      },
      fontFamily: {
        /**
         * Just add Open Sans to default font stack
         * Only Open Sans is an imported font, remaining fonts are "system" fonts
         */
        sans: [
          '"Open Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
      },
      fontSize: {
        sm: ['0.8125rem', '1.25'],
        base: ['0.9375rem', '1.25'],
        lg: ['1.25rem', '1'],
        xl: ['1.5rem', '2.5'],
        '2xl': ['2rem', '2.5'],
        '3xl': ['3rem', '3.75'],
      },
    },
  },
  prefix: 'tw_',
  // Forms plugin _could_ be useful, but don't use the "base" strategy as it will collide
  // with customer styling on third-party apps
  // plugins: [
  //   require('@tailwindcss/forms')({
  //     strategy: 'class', // only generate classes
  //   })
  // ],
};
