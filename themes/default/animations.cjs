module.exports = {
  /**
   * Checkbox animations
   */
  animation: {
    check: `check 125ms 250ms cubic-bezier(.4,.0,.23,1) forwards`,
    radio: `radio 125ms 250ms cubic-bezier(.4,.0,.23,1) forwards`,
    squish: `squish 200ms cubic-bezier(.4,.0,.23,1)`,
  },
  keyframes: ({ theme }) => ({
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
  }),
};
