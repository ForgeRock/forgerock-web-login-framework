module.exports = {
  /**
   * Checkbox animations
   */
  animation: {
    /**
     * Make sure to add these animations to app.css and widget/main.css
     */
    check: `check 125ms 250ms cubic-bezier(.4,.0,.23,1) forwards`,
    fadeIn: `fadeIn 500ms ease forwards`,
    fadeOut: `fadeOut 500ms ease forwards`,
    slideDown: `slideDown 100ms ease-out forwards`,
    slideUp: `slideUp 100ms ease-out forwards`,
    radio: `radio 125ms 250ms cubic-bezier(.4,.0,.23,1) forwards`,
    squish: `squish 200ms cubic-bezier(.4,.0,.23,1)`,
  },
  keyframes: ({ theme }) => ({
    check: {
      '0%': {
        borderColor: theme('colors.white'),
        height: '0',
        transform: 'translate3d(0,0,0) rotate(45deg)',
        width: '0',
      },
      '33%': {
        borderColor: theme('colors.white'),
        height: '0',
        transform: 'translate3d(0,0,0) rotate(45deg)',
        width: '0.35em',
      },
      '100%': {
        borderColor: theme('colors.white'),
        height: '0.8em',
        transform: 'translate3d(0,0,0) rotate(45deg)',
        width: '0.35em',
      },
    },
    fadeIn: {
      '0%': {
        opacity: 0,
      },
      '100%': {
        opacity: 1,
      },
    },
    fadeOut: {
      '0%': {
        opacity: 1,
      },
      '100%': {
        opacity: 0,
      },
    },
    slideDown: {
      '0%': {
        opacity: 1,
        top: '0%',
      },
      '50%': {
        opacity: 1,
        top: '35%',
      },
      '100%': {
        opacity: 0,
        top: '50%',
      },
    },
    slideUp: {
      '0%': {
        opacity: 0,
        top: '50%',
      },
      '50%': {
        opacity: 1,
        top: '15%',
      },
      '100%': {
        opacity: 1,
        top: 0,
      },
    },
    radio: {
      '0%': {
        transform: 'scale(0)',
      },
      '33%': {
        transform: 'scale(0.5)',
      },
      '80%': {
        transform: 'scale(0.9)',
      },
      '100%': {
        transform: 'scale(0.8)',
      },
    },
    squish: {
      '0%': {
        transform: 'scale(1)',
      },
      '33%': {
        transform: 'scale(.85)',
      },
      '100%': {
        transform: 'scale(1)',
      },
    },
  }),
};
