module.exports = function (theme) {
  return {
    /**
     * Container theme settings
     */
    '.containing-box': {
      backgroundColor: theme('colors.background.light'),
      borderRadius: theme('borderRadius.DEFAULT'),
      height: 'fit-content',
      margin: `auto 0`,
      padding: `${theme('spacing.14')} ${theme('spacing.10')}`,
      width: '500px',
    },
    '.containing-box_dark': {
      backgroundColor: theme('colors.background.dark'),
    },
  };
};
