const colorLib = require('color');

module.exports = function (theme) {
  return {
    /**
     * Alert
     */
    '.alert': {
      backgroundColor: theme('colors.background.light'),
      borderColor: colorLib(theme('colors.background.light')).darken(0.1).toString(),
      borderRadius: theme('borderRadius.DEFAULT'),
      borderWidth: '1px',
      color: theme('colors.black'),
      marginBottom: theme('spacing.6'),
      padding: theme('spacing.4'),

      '&:focus': {
        borderRadius: theme('borderRadius.DEFAULT'),
        outlineColor: colorLib(theme('ringColor.DEFAULT')).fade(0.1).toString(),
        outlineOffset: '2px',
        outlineStyle: 'solid',
        outlineWidth: '3px',
      },
    },
    '.alert_dark': {
      backgroundColor: theme('colors.background.dark'),
      borderColor: theme('colors.black'),
      color: theme('colors.white'),

      '&:focus': {
        outlineColor: colorLib(theme('ringColor.DEFAULT')).lighten(0.2).fade(0.1).toString(),
      },
      '& svg': {
        color: theme('colors.white'),
        fill: 'currentColor',
      },
    },
    '.alert-error': {
      backgroundColor: theme('colors.error.light'),
      borderColor: theme('colors.error.dark'),

      '& svg': {
        color: theme('colors.error.dark'),
        fill: 'currentColor',
      },
    },
    '.alert-error_dark': {
      backgroundColor: theme('colors.error.dark'),
      borderColor: colorLib(theme('colors.error.dark')).darken(0.2).toString(),

      '& svg': {
        color: theme('colors.error.light'),
        fill: 'currentColor',
      },
    },
    '.alert-info': {
      backgroundColor: colorLib(theme('colors.primary.light')).lighten(0.9).toString(),
      borderColor: theme('colors.primary.light'),

      '& svg': {
        color: theme('colors.primary.dark'),
        fill: 'currentColor',
      },
    },
    '.alert-info_dark': {
      backgroundColor: colorLib(theme('colors.primary.light')).darken(0.4).toString(),
      borderColor: colorLib(theme('colors.primary.dark')).darken(0.2).toString(),

      '& svg': {
        color: colorLib(theme('colors.primary.light')).lighten(0.9).toString(),
        fill: 'currentColor',
      },
    },
    '.alert-success': {
      backgroundColor: theme('colors.success.light'),
      borderColor: theme('colors.success.dark'),

      '& svg': {
        color: theme('colors.success.dark'),
        fill: 'currentColor',
      },
    },
    '.alert-success_dark': {
      backgroundColor: theme('colors.success.dark'),
      borderColor: colorLib(theme('colors.success.dark')).darken(0.2).toString(),

      '& svg': {
        color: theme('colors.success.light'),
        fill: 'currentColor',
      },
    },
    '.alert-warning': {
      backgroundColor: theme('colors.warning.light'),
      borderColor: theme('colors.warning.dark'),

      '& svg': {
        color: theme('colors.warning.dark'),
        fill: 'currentColor',
      },
    },
    '.alert-warning_dark': {
      backgroundColor: theme('colors.warning.dark'),
      borderColor: colorLib(theme('colors.warning.dark')).darken(0.2).toString(),

      '& svg': {
        color: theme('colors.warning.light'),
        fill: 'currentColor',
      },
    },
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
      '&:focus': {
        outlineOffset: '2px',
      },
      '&:active': {
        outlineOffset: '3px',
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
    /**
     * Checkbox primitive theme settings
     */
    '.checkbox-label': {
      color: theme('colors.secondary.dark'),
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

      '& ~ span > .input-error-message': {
        display: 'none',
      },
      '& ~ span > .input-info-message': {
        display: 'none',
      },
      '& ~ * > p': {
        display: 'none',
      },
      '&[aria-invalid="true"]': {
        background: `no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.01).toString(),
        backgroundPosition: `right ${theme('spacing.3')} center`,
        backgroundSize: `${theme('spacing.4')} ${theme('spacing.4')}`,
      },
      '&[aria-invalid="true"] ~ * > p': {
        display: 'block',
      },
      '&[aria-invalid="true"] ~ button': {
        borderColor: theme('colors.error.dark'),
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]': {
        outlineColor: colorLib(theme('colors.error.light')).fade(0.8).toString(),
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]:focus': {
        outlineColor: colorLib(theme('colors.error.light')).fade(0.5).toString(),
      },
      '&[aria-invalid="true"]:focus': {
        backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      },
    },
    '.checkbox-input_dark': {
      accentColor: theme('colors.primary.light'),
    },
    /**
     * Form primitive theme settings
     */
    '.form-base': {},
    /**
     * String input and select primitive theme settings
     */
    '.input-base': {
      backgroundColor: colorLib(theme('colors.background.light')).darken(0.02).toString(),
      border: `${theme('borderWidth.DEFAULT')} solid ${theme('colors.secondary.DEFAULT')}`,
      borderRadius: theme('borderRadius.DEFAULT'),
      color: theme('colors.black'),
      fontSize: theme('fontSize.base'),
      lineHeight: theme('spacing.6'),
      padding: theme('spacing.3'),

      '&:hover': {
        backgroundColor: theme('colors.background.light'),
      },
      '&:focus': {
        backgroundColor: theme('colors.background.light'),
      },
      '&[aria-invalid="true"]': {
        borderColor: theme('colors.error.dark'),
        background: `no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.background.light')).darken(0.02).toString(),
        backgroundPosition: `right ${theme('spacing.3')} center`,
        backgroundSize: `${theme('spacing.4')} ${theme('spacing.4')}`,
      },
      '&[aria-invalid="true"] ~ button': {
        borderColor: theme('colors.error.dark'),
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]': {
        outlineColor: colorLib(theme('colors.error.light')).fade(0.8).toString(),
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]:focus': {
        outlineColor: colorLib(theme('colors.error.dark')).fade(0.3).toString(),
        backgroundColor: theme('colors.background.light'),
      },
      '&[aria-invalid="true"]:hover': {
        backgroundColor: theme('colors.background.light'),
      },
      // TODO: is this needed? I don't think so.
      // '&:invalid:hover': {
      //   backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      // },
    },
    '.input-base_dark': {
      backgroundColor: colorLib(theme('colors.body.dark')).fade(0.5).toString(),
      // borderColor: colorLib(theme('colors.black')).fade(0.1).toString(),
      borderColor: theme('colors.secondary.dark'),
      color: theme('colors.white'),

      '&:focus': {
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.25).toString(),
      },
      '&:hover': {
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.25).toString(),
      },
      '&[aria-invalid="true"]': {
        borderColor: theme('colors.error.light'),
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.light'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.5).toString(),
      },
      '&[aria-invalid="true"]:focus': {
        outlineColor: `${colorLib(theme('colors.error.light')).fade(0.3).toString()} !important`,
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.25).toString(),
      },
      '&[aria-invalid="true"]:hover': {
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.25).toString(),
      },
      '&[aria-invalid="true"] ~ button': {
        borderColor: theme('colors.error.light'),
      },
      // TODO: is this needed? I don't think so.
      // '&:invalid:hover': {
      //   backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      // },
    },
    '.input-label': {
      color: theme('colors.secondary.dark'),
    },
    '.input-label_dark': {
      color: theme('colors.secondary.light'),

      ':where(input:autofill) + &': {
        color: theme('colors.secondary.dark'),
      },
      ':where(input:autofill) + &': {
        color: theme('colors.secondary.dark'),
      },
    },
    /**
     * Input error message
     */
    '.input-error-message': {
      color: theme('colors.error.dark'),
      fontSize: theme('fontSize.base'),
      margin: theme('spacing.1'),
      width: '100%',
    },
    '.input-error-message_dark': {
      color: theme('colors.error.light'),
    },
    '.input-info-message': {
      color: theme('colors.secondary.dark'),
      fontSize: theme('fontSize.base'),
      margin: theme('spacing.1'),
      width: '100%',

      '&.isInvalid': {
        color: theme('colors.error.dark'),
      },
    },
    '.input-info-message_dark': {
      color: theme('colors.secondary.light'),

      '&.isInvalid': {
        color: theme('colors.error.light'),
      },
    },
    '.link': {
      color: theme('colors.blue.600'),
      textDecoration: 'underline',

      '&:hover': {
        textDecoration: 'none',
      },
    },
    '.link_dark': {
      color: theme('colors.blue.400'),
    },
    '.select-base': {
      appearance: 'none',
      /**
       * The below background property prevents Storybook a11y from determining contrast.
       * This is likely due to the presence of the image.
       */
      background: `no-repeat right ${theme(
        'spacing.3',
      )} center url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
        theme('colors.secondary.dark'),
      ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundColor: colorLib(theme('colors.background.light')).darken(0.02).toString(),
      backgroundSize: '16px 12px',
      // TODO: Use design tokens, not absolute values
      height: 'calc(3rem + 2px)',

      '&:hover': {
        backgroundColor: colorLib(theme('colors.background.light')).darken(0.05).toString(),
      },
      '&:focus': {
        backgroundColor: colorLib(theme('colors.background.light')).darken(0.05).toString(),
      },
      '&[aria-invalid="true"]': {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
          theme('colors.secondary.dark'),
        ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.background.light')).darken(0.02).toString(),
        backgroundPosition: 'right 0.75rem center, center right 2.25rem',
        backgroundSize: `16px 12px, ${theme('spacing.4')} ${theme('spacing.4')}`,
      },
    },
    '.select-base_dark': {
      background: `no-repeat right ${theme(
        'spacing.3',
      )} center / 16px 12px url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
        theme('colors.secondary.light'),
      ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundColor: colorLib(theme('colors.body.dark')).fade(0.5).toString(),

      '&:hover,': {
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.25).toString(),
      },
      '&:focus': {
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.25).toString(),
      },
      '&[aria-invalid="true"]': {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
          theme('colors.secondary.light'),
        ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.light'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: colorLib(theme('colors.body.dark')).fade(0.5).toString(),
        backgroundPosition: 'right 0.75rem center, center right 2.25rem',
        backgroundSize: `16px 12px, ${theme('spacing.4')} ${theme('spacing.4')}`,
      },
    },
    '.spinner': {
      verticalAlign: '-0.125em',
      border: '0.25em solid',
      borderRightColor: 'transparent',
    },
  };
};
