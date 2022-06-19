const colorLib = require('color');

module.exports = function(theme) {
  return {
    /**
     * Essentially the same technique as Twitter Bootstrap's v5 "floating label"
     * https://getbootstrap.com/docs/5.0/forms/floating-labels/
     *
     * TODO: See if the new CSS pseudo-selector `has()` can replace below technique
     * when it gets full browser support
     */
    '.input-floating': {
      '&:focus, &:not(:placeholder-shown)': {
        paddingBottom: theme('spacing.1'),
        paddingTop: theme('spacing.5'),
      },
      '&::-ms-reveal': {
        display: 'none',
      },
      '&::placeholder': {
        color: 'transparent',
      },
      '&:focus ~ label, &:not(:placeholder-shown) ~ label': {
        fontWeight: theme('fontWeight.medium'),
        transform: 'scale(0.85) translateY(-0.5rem) translateX(0.15rem)',
      },
    },
    '.input-floating-label': {
      height: 'calc(3rem + 2px)',
      lineHeight: theme('spacing.6'),
      padding: theme('spacing.3'),
      pointerEvents: 'none',
      transformOrigin: '0 0',
      transition: 'opacity 0.1s ease-in-out, transform 0.1s ease-in-out',
    },
    '.input-stacked-label': {
      display: 'block',
      fontWeight: 'bold',
      lineHeight: theme('spacing.6'),
      marginBottom: theme('spacing.1'),
    },
    '.select-floating': {
      lineHeight: theme('spacing.4'),
      padding: `${theme('spacing.6')} ${theme('spacing.9')} ${theme('spacing.1')} ${theme(
        'spacing.3',
      )}`,
    },
    '.select-floating-label': {
      fontWeight: theme('fontWeight.medium'),
    },
    /**
     * Input error message
     */
    '.input-error-message': {
      color: theme('colors.error.dark'),
      width: '100%',
    },
    '.input-error-message_dark': {
      color: theme('colors.error.light'),
    },
  };
};
