module.exports = function (theme) {
  return {
    /**
     * Container theme settings
     */
    '.containing-box': {
      '--bg-color': 'hsl(var(--tw-colors-background-light-hs),var(--tw-colors-background-light-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.background.light')})`,
      borderColor: theme('colors.black'),
      borderRadius: theme('borderRadius.DEFAULT'),
      boxShadow: theme('boxShadow.DEFAULT'),
      padding: `${theme('spacing.6')} ${theme('spacing.4')}`,
      width: '500px',
    },
    '.containing-box_dark': {
      '--bg-color': 'hsl(var(--tw-colors-background-dark-hs),var(--tw-colors-background-dark-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.background.dark')})`,
    },
    '.containing-box_medium': {
      height: 'fit-content',
      margin: `auto 0`,
      padding: `${theme('spacing.10')} ${theme('spacing.10')}`,
    },
  };
};
