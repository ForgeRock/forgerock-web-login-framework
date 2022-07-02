module.exports = {
  /**
   * Checkbox animations: Don't touch unless you know what you're doing :)
   */
  animation: {
    check: `check 125ms 250ms cubic-bezier(.4,.0,.23,1) forwards`,
    squish: `squish 200ms cubic-bezier(.4,.0,.23,1)`,
  },
  keyframes: {
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
        borderColor: 'white',
        height: '0',
        transform: 'translate3d(0,0,0) rotate(45deg)',
        width: '0',
      },
      '33%': {
        borderColor: 'white',
        height: '0',
        width: '0.35em',
        transform: 'translate3d(0,0,0) rotate(45deg)',
      },
      '100%': {
        borderColor: 'white',
        height: '0.8em',
        transform: 'translate3d(0,0,0) rotate(45deg)',
        width: '0.35em',
      },
    },
  },
};
