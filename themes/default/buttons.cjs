module.exports = function(theme) {

  return {
    /**
     * Button primitive theme settings
     */
    '.button-base': {
      // NOTE: Ensure all button have borders for consistent height between regular and outline buttons
      border: `${theme('borderWidth.DEFAULT')} solid`,
      borderRadius: theme('borderRadius.DEFAULT'),
      outlineOffset: '0',
      position: 'relative',
      fontSize: theme('fontSize.base'),
      lineHeight: 1.5,
      padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
      zIndex: '0',
      '&:focus, &:active': {
        outlineOffset: '2px',
      },
      '&::before': {
        background: `black`,
        outline: `${theme('borderWidth.DEFAULT')} solid black`,
        borderRadius: theme('borderRadius.DEFAULT'),
        content: '""',
        display: 'block',
        height: '100%',
        left: '0',
        position: 'absolute',
        opacity: '0',
        top: '0',
        transition: `opacity 0.25s`,
        width: '100%',
        zIndex: '-1',
      },
      '&:hover::before, &:focus::before': {
        opacity: `0.05`,
      },
    },
    '.button-primary': {
      borderColor: theme('colors.primary.dark'),
      backgroundColor: theme('colors.primary.dark'),
      color: theme('colors.white'),
      '&:hover::before, &:focus::before': {
        opacity: `0.2`,
      },
    },
    '.button-primary_dark': {
      borderColor: theme('colors.primary.light'),
      backgroundColor: theme('colors.primary.light'),
      '&:hover::before, &:focus::before': {
        opacity: `0.2`,
      },
    },
    '.button-outline': {
      borderColor: theme('colors.secondary.dark'),
    },
    '.button-outline_dark': {
      borderColor: theme('colors.secondary.light'),
      color: theme('colors.white'),
      '&:hover::before, &:focus::before': {
        opacity: `0.3`,
      },
    },
    '.button-secondary': {
      borderColor: theme('colors.secondary.light'),
      backgroundColor: theme('colors.secondary.light'),
      color: theme('colors.black'),
      '&:hover::before, &:focus::before': {
        opacity: `0.1`,
      },
    },
    '.button-secondary_dark': {},
  };
};
