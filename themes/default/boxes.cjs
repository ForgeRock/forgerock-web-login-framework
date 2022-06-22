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
    '.dialog-box': {
      backgroundColor: theme('colors.background.light'),
      borderRadius: theme('borderRadius.DEFAULT'),
      boxShadow: theme('boxShadow.DEFAULT'),
      height: '100%',
      margin: `${theme('spacing.2')} 0 0 0`,
      maxHeight: '100%',
      maxWidth: '100%',
      padding: theme('spacing.6'),
      paddingBottom: theme('spacing.16'),
      width: '100%',
    },
    '.dialog-box_dark': {
      backgroundColor: theme('colors.background.dark'),
    },
    '.dialog-box_medium': {
      height: 'fit-content',
      margin: 'auto',
      maxWidth: theme('maxWidth.lg'),
      padding: theme('spacing.12'),
      width: theme('width["3/4"]'),
    },
  };
};
