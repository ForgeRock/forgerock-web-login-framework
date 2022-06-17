const colorLib = require('color');

module.exports = function (theme) {
  return {
    /**
     * Checkbox primitive theme settings
     */
     '.checkbox-label': {
      color: theme('colors.secondary.dark'),
      marginBottom: theme('spacing.4'),
    },
    '.checkbox-label_dark': {
      color: theme('colors.secondary.light'),
    },
    '.checkbox-input': {
      accentColor: theme('colors.primary.dark'),
      borderRadius: theme('borderRadius.DEFAULT'),
      flex: 1,
      height: theme('spacing.4'),
      marginRight: theme('spacing.1'),
      position: 'relative',
      width: theme('spacing.4'),
      top: theme('spacing.1'),
    },
    '.checkbox-input_dark': {
      accentColor: theme('colors.primary.light'),
    },
    /**
     * String input and select primitive theme settings
     */
     '.input-base': {
      backgroundColor: colorLib(theme('colors.background.light')).lighten(0.01).toString(),
      border: `${theme('borderWidth.DEFAULT')} solid ${theme('colors.secondary.DEFAULT')}`,
      borderRadius: theme('borderRadius.DEFAULT'),
      color: theme('colors.black'),
      fontSize: theme('fontSize.base'),
      lineHeight: theme('spacing.6'),
      padding: theme('spacing.3'),
      '&:hover, &:focus': {
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      },
      '&:invalid': {
        borderColor: theme('colors.error.dark'),
        background: `no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.01).toString(),
        // TODO: Use design tokens, not absolute values
        backgroundPosition: `right ${theme('spacing.3')} center`,
        backgroundSize: `${theme('spacing.4')} ${theme('spacing.4')}`,
        outlineColor: colorLib(theme('colors.error.light')).fade(0.8).toString(),
      },
      '&:invalid:focus': {
        outlineColor: colorLib(theme('colors.error.light')).fade(0.1).toString(),
      },
      '&:invalid:focus, &:invalid:hover': {
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      },
    },
    '.input-base_dark': {
      backgroundColor: colorLib(theme('colors.black')).fade(0.95).toString(),
      color: theme('colors.white'),
      '&:focus': {
        backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      },
      '&:hover': {
        backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      },
      '&:invalid': {
        borderColor: theme('colors.error.light'),
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.light'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.black')).fade(0.95).toString(),
      },
      '&:invalid:focus': {
        backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      },
      '&:invalid:hover': {
        backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      },
    },
    '.input-label': {
      color: theme('colors.secondary.dark'),
    },
    '.input-label_dark': {
      color: theme('colors.secondary.light'),
    },
    '.select-base': {
      appearance: 'none',
      background: `no-repeat right ${theme(
        'spacing.3',
      )} center url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
        theme('colors.secondary.dark'),
      ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundColor: colorLib(theme('colors.background.light')).lighten(0.01).toString(),
      backgroundSize: '16px 12px',
      // TODO: Use design tokens, not absolute values
      height: 'calc(3rem + 2px)',
      '&:hover, &:focus': {
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      },
      '&:invalid': {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
          theme('colors.secondary.dark'),
        ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.01).toString(),
        backgroundPosition: 'right 0.75rem center, center right 2.25rem',
        backgroundSize: `16px 12px, ${theme('spacing.4')} ${theme('spacing.4')}`,
      },
      '&:invalid:focus': {
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      },
      '&:invalid:hover': {
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      },
    },
    '.select-base_dark': {
      background: `no-repeat right ${theme(
        'spacing.3',
      )} center / 16px 12px url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
        theme('colors.secondary.light'),
      ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundColor: colorLib(theme('colors.black')).fade(0.95).toString(),
      '&:hover, &:focus': {
        backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      },
      '&:invalid': {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
          theme('colors.secondary.light'),
        ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.light'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.black')).fade(0.95).toString(),
      },
      '&:invalid:focus': {
        backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      },
      '&:invalid:hover': {
        backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      },
    },
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
  };
};
