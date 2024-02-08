const colorLib = require('color');
module.exports = function (theme) {
  return {
    /**
     * Alert
     */
    '.alert': {
      '--bg-color': 'hsl(var(--tw-colors-background-light-hs),var(--tw-colors-background-light-l))',
      '--border-color':
        'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) - 10%))',
      '--font-size': 'var(--tw-font-size-base-type)',
      backgroundColor: `var(--bg-color, ${theme('colors.background.light')})`,
      borderColor: `var(--border-color, ${colorLib(theme('colors.background.light'))
        .darken(0.1)
        .toString()})`,
      borderRadius: theme('borderRadius.DEFAULT'),
      borderWidth: '1px',
      color: theme('colors.black'),
      fontSize: `var(--font-size, ${theme('fontSize.base')})`,
      marginBottom: theme('spacing.6'),
      padding: theme('spacing.4'),

      '&:focus': {
        '--outline-color':
          'hsl(var(--tw-colors-focus-default-hs),var(--tw-colors-focus-default-l), 0.1)',
        borderRadius: theme('borderRadius.DEFAULT'),
        outlineColor: `var(--outline-color, ${colorLib(theme('ringColor.DEFAULT'))
          .fade(0.1)
          .toString()})`,
        outlineOffset: '2px',
        outlineStyle: 'solid',
        outlineWidth: '3px',
      },
    },
    '.alert_dark': {
      '--bg-color': 'hsl(var(--tw-colors-background-dark-hs),var(--tw-colors-background-dark-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.background.dark')})`,
      borderColor: theme('colors.black'),
      color: theme('colors.white'),

      '&:focus': {
        '--outline-color':
          'hsl(var(--tw-colors-focus-default-hs), calc(var(--tw-colors-focus-default-l) + 20%), 0.1)',
        outlineColor: `var(--outline-color, ${colorLib(theme('ringColor.DEFAULT'))
          .lighten(0.2)
          .fade(0.1)
          .toString()})`,
      },
      '& svg': {
        color: theme('colors.white'),
        fill: 'currentColor',
      },
    },
    '.alert-error': {
      '--bg-color': 'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l))',
      '--border-color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.error.light')})`,
      borderColor: `var(--border-color, ${theme('colors.error.dark')})`,

      '& svg': {
        '--color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
        color: `var(--color, ${theme('colors.error.dark')})`,
        fill: 'currentColor',
      },
    },
    '.alert-error_dark': {
      '--bg-color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
      '--border-color':
        'hsl(var(--tw-colors-error-dark-hs), calc(var(--tw-colors-error-dark-l) - 20%))',
      backgroundColor: `var(--bg-color, ${theme('colors.error.dark')})`,
      borderColor: `var(--border-color, ${colorLib(theme('colors.error.dark'))
        .darken(0.2)
        .toString()})`,

      '& svg': {
        '--color': 'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l))',
        color: `var(--color, ${theme('colors.error.light')})`,
        fill: 'currentColor',
      },
    },
    '.alert-info': {
      '--bg-color':
        'hsl(var(--tw-colors-primary-light-hs), calc(var(--tw-colors-primary-light-l) + 90%))',
      '--border-color': 'hsl(var(--tw-colors-primary-light-hs),var(--tw-colors-primary-light-l))',
      backgroundColor: `var(--bg-color, ${colorLib(theme('colors.primary.light'))
        .lighten(0.9)
        .toString()})`,
      borderColor: `var(--border-color, ${theme('colors.primary.light')})`,

      '& svg': {
        '--color': 'hsl(var(--tw-colors-primary-dark-hs),var(--tw-colors-primary-dark-l))',
        color: `var(--color, ${theme('colors.primary.dark')})`,
        fill: 'currentColor',
      },
    },
    '.alert-info_dark': {
      '--bg-color':
        'hsl(var(--tw-colors-primary-light-hs), calc(var(--tw-colors-primary-light-l) - 40%))',
      '--border-color':
        'hsl(var(--tw-colors-primary-dark-hs), calc(var(--tw-colors-primary-dark-l) - 20%))',
      backgroundColor: `var(--bg-color, ${colorLib(theme('colors.primary.light'))
        .darken(0.4)
        .toString()})`,
      borderColor: `var(--border-color, ${colorLib(theme('colors.primary.dark'))
        .darken(0.2)
        .toString()})`,

      '& svg': {
        '--color':
          'hsl(var(--tw-colors-primary-light-hs), calc(var(--tw-colors-primary-light-l) + 90%))',
        color: `var(--color, ${colorLib(theme('colors.primary.light')).lighten(0.9).toString()})`,
        fill: 'currentColor',
      },
    },
    '.alert-success': {
      '--bg-color': 'hsl(var(--tw-colors-success-light-hs),var(--tw-colors-success-light-l))',
      '--border-color': 'hsl(var(--tw-colors-success-dark-hs),var(--tw-colors-success-dark-l))',
      backgroundColor: `var(--alert-success-background-color, ${theme('colors.success.light')})`,
      borderColor: `var(--border-color, ${theme('colors.success.dark')})`,

      '& svg': {
        '--color': 'hsl(var(--tw-colors-success-dark-hs),var(--tw-colors-success-dark-l))',
        color: `var(--color, ${theme('colors.success.dark')})`,
        fill: 'currentColor',
      },
    },
    '.alert-success_dark': {
      '--bg-color': 'hsl(var(--tw-colors-success-dark-hs),var(--tw-colors-success-dark-l))',
      '--border-color':
        'hsl(var(--tw-colors-success-dark-hs), calc(var(--tw-colors-success-dark-l) - 20%))',
      backgroundColor: `var(--bg-color, ${theme('colors.success.dark')})`,
      borderColor: `var(--border-color, ${colorLib(theme('colors.success.dark'))
        .darken(0.2)
        .toString()})`,

      '& svg': {
        '--color': 'hsl(var(--tw-colors-success-light-hs),var(--tw-colors-success-light-l))',
        color: `var(--color, ${theme('colors.success.light')})`,
        fill: 'currentColor',
      },
    },
    '.alert-warning': {
      '--bg-color': 'hsl(var(--tw-colors-warning-light-hs),var(--tw-colors-warning-light-l))',
      '--border-color': 'hsl(var(--tw-colors-warning-dark-hs),var(--tw-colors-warning-dark-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.warning.light')})`,
      borderColor: `var(--border-color, ${theme('colors.warning.dark')})`,

      '& svg': {
        '--color': `hsl(var(--tw-colors-warning-dark-hs),var(tw-tw-colors-warning-dark-l))`,
        color: `var(--color, ${theme('colors.warning.dark')})`,
        fill: 'currentColor',
      },
    },
    '.alert-warning_dark': {
      '--bg-color': 'hsl(var(--tw-colors-warning-dark-hs),var(--tw-colors-warning-dark-l))',
      '--border-color':
        'hsl(var(--tw-colors-warning-dark-hs), calc(var(--tw-colors-warning-dark-l) - 20%))',
      backgroundColor: `var(--bg-color, ${theme('colors.warning.dark')})`,
      borderColor: `var(--border-color, ${colorLib(theme('colors.warning.dark'))
        .darken(0.2)
        .toString()})`,

      '& svg': {
        '--color': 'hsl(var(--tw-colors-warning-light-hs),var(--tw-colors-warning-light-l))',
        color: `var(--color, ${theme('colors.warning.light')})`,
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
      fontSize: theme('fontSize.base'),
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
      '--bg-color': 'hsl(var(--tw-colors-primary-dark-hs),var(--tw-colors-primary-dark-l))',
      '--border-color': 'hsl(var(--tw-colors-primary-dark-hs),var(--tw-colors-primary-dark-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.primary.dark')})`,
      borderColor: `var(--border-color, ${theme('colors.primary.dark')})`,
      color: theme('colors.white'),
      '&:hover::before, &:focus::before': {
        opacity: `0.2`,
      },
    },
    '.button-primary_dark': {
      '--bg-color': 'hsl(var(--tw-colors-primary-light-hs),var(--tw-colors-primary-light-l))',
      '--border-color': 'hsl(var(--tw-colors-primary-light-hs),var(--tw-colors-primary-light-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.primary.light')})`,
      borderColor: `var(--border-color, ${theme('colors.primary.light')})`,
      '&:hover::before, &:focus::before': {
        opacity: `0.2`,
      },
    },
    '.button-outline': {
      '--border-color': 'hsl(var(--tw-colors-secondary-dark-hs),var(--tw-colors-secondary-dark-l))',
      borderColor: `var(--border-color, ${theme('colors.secondary.dark')})`,
    },
    '.button-outline_dark': {
      '--border-color':
        'hsl(var(--tw-colors-secondary-light-hs),var(--tw-colors-secondary-light-l))',
      borderColor: `var(--border-color, ${theme('colors.secondary.light')})`,
      color: theme('colors.white'),
      '&:hover::before, &:focus::before': {
        opacity: `0.3`,
      },
    },
    '.button-secondary': {
      '--bg-color': 'hsl(var(--tw-colors-secondary-light-hs),var(--tw-colors-secondary-light-l))',
      '--border-color':
        'hsl(var(--tw-colors-secondary-light-hs),var(--tw-colors-secondary-light-l))',
      backgroundColor: `var(--bg-color, ${theme('colors.secondary.light')})`,
      borderColor: `var(--border-color, ${theme('colors.secondary.light')})`,
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
      '--font-size': 'var(--tw-font-size-base-type)',
      '--color': 'hsl(var(--tw-colors-secondary-dark-hs),var(--tw-colors-secondary-dark-l))',
      fontSize: `var(--font-size', ${theme('fontSize.base')})`,
      color: `var(--color, ${theme('colors.secondary.dark')})`,
    },
    '.checkbox-label_dark': {
      '--color': 'hsl(var(--tw-colors-secondary-light-hs),var(--tw-colors-secondary-light-l))',
      color: `var(--color, ${theme('colors.secondary.light')})`,
    },
    '.checkbox-input': {
      '--accent-color': 'hsl(var(--tw-colors-primary-dark-hs),var(--tw-colors-primary-dark-l))',
      accentColor: `var(--accent-color, ${theme('colors.primary.dark')})`,

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
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) + 1%))',

        background: `no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
          .lighten(0.01)
          .toString()})`,
        backgroundPosition: `right ${theme('spacing.3')} center`,
        backgroundSize: `${theme('spacing.4')} ${theme('spacing.4')}`,
      },
      '&[aria-invalid="true"] ~ * > p': {
        display: 'block',
      },
      '&[aria-invalid="true"] ~ button': {
        '--border-color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
        borderColor: `var(--border-color, ${theme('colors.error.dark')})`,
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]': {
        '--outline-color':
          'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l), 0.8)',
        outlineColor: `var(--outline-color, ${colorLib(theme('colors.error.light'))
          .fade(0.8)
          .toString()})`,
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]:focus': {
        '--outline-color':
          'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l), 0.5)',
        outlineColor: `var(--outline-color, ${colorLib(theme('colors.error.light'))
          .fade(0.5)
          .toString()})`,
      },
      '&[aria-invalid="true"]:focus': {
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) + 5%))',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
          .lighten(0.05)
          .toString()})`,
      },
    },
    '.checkbox-input_dark': {
      '--accent-color': 'hsl(var(--tw-colors-primary-light-hs),var(--tw-colors-primary-light-l))',
      accentColor: `var(--accent-color, ${theme('colors.primary.light')})`,
    },
    /**
     * Form primitive theme settings
     */
    '.form-base': {},
    /**
     * String input and select primitive theme settings
     */
    '.input-base': {
      '--bg-color':
        'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) - 2%))',
      '--border': `${theme(
        'borderWidth.DEFAULT',
      )} solid hsl(var(--tw-colors-secondary-default-hs),var(--tw-colors-secondary-default-l))`,
      '--font-size': 'var(--tw-font-size-base-type)',

      backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
        .darken(0.02)
        .toString()})`,

      border: `var(--border, ${theme('borderWidth.DEFAULT')} solid ${theme(
        'colors.secondary.DEFAULT',
      )})`,
      border: `${theme('borderWidth.DEFAULT')} solid ${theme('colors.secondary.DEFAULT')}`,
      borderRadius: theme('borderRadius.DEFAULT'),
      color: theme('colors.black'),
      fontSize: `var(--font-size, ${theme('fontSize.base')})`,
      lineHeight: theme('spacing.6'),
      padding: theme('spacing.3'),

      '&:hover': {
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs),var(--tw-colors-background-light-l))',
        backgroundColor: `var(--bg-color, ${theme('colors.background.light')})`,
      },
      '&:focus': {
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs),var(--tw-colors-background-light-l))',
        backgroundColor: `var(--bg-color, ${theme('colors.background.light')})`,
      },
      '&[aria-invalid="true"]': {
        '--border-color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) - 2%))',
        background: `no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        borderColor: `var(--border-color, ${theme('colors.error.dark')})`,
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
          .darken(0.02)
          .toString()})`,
        backgroundPosition: `right ${theme('spacing.3')} center`,
        backgroundSize: `${theme('spacing.4')} ${theme('spacing.4')}`,
      },
      '&[aria-invalid="true"] ~ button': {
        '--border-color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
        borderColor: `var(--border-color, ${theme('colors.error.dark')})`,
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]': {
        '--outline-color':
          'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l), 0.8)',
        outlineColor: `var(--outline-color, ${colorLib(theme('colors.error.light'))
          .fade(0.8)
          .toString()})`,
      },
      // Double class to increase specificity by 1 level
      '&&[aria-invalid="true"]:focus': {
        '--outline-color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l), 0.3)',
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs),var(--tw-colors-background-light-l))',
        outlineColor: `var(--outline-color, ${colorLib(theme('colors.error.dark'))
          .fade(0.3)
          .toString()})`,
        backgroundColor: `var(--bg-color, ${theme('colors.background.light')})`,
      },
      '&[aria-invalid="true"]:hover': {
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs),var(--tw-colors-background-light-l))',
        backgroundColor: `var(--bg-color, ${theme('colors.background.light')})`,
      },
      // TODO: is this needed? I don't think so.
      // '&:invalid:hover': {
      //   backgroundColor: colorLib(theme('colors.background.light')).lighten(0.05).toString(),
      // },
    },
    '.input-base_dark': {
      '--bg-color': 'hsl(var(--tw-colors-body-dark-hs),var(--tw-colors-body-dark-l), 0.5)',
      '--border-color': 'hsl(var(--tw-colors-secondary-dark-hs),var(--tw-colors-secondary-dark-l))',
      backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
        .fade(0.5)
        .toString()})`,
      borderColor: `var(--border-color, ${theme('colors.secondary.dark')})`,
      color: theme('colors.white'),

      '&:focus': {
        '--bg-color': 'hsl(var(--tw-colors-body-dark-hs),var(--tw-colors-body-dark-l), 0.25)',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.25)
          .toString()})`,
      },
      '&:hover': {
        '--bg-color': 'hsl(var(--tw-colors-body-dark-hs),var(--tw-colors-body-dark-l), 0.25)',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.25)
          .toString()})`,
      },
      '&[aria-invalid="true"]': {
        '--border-color': 'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l))',
        '--bg-color': 'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l),0.5)',
        borderColor: `var(--border-color, ${theme('colors.error.light')})`,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.light'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.5)
          .toString()})`,
      },
      '&[aria-invalid="true"]:focus': {
        '--outline-color':
          'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l), 0.3) !important',
        '--bg-color': 'hsl(var(--tw-colors-body-dark-hs),var(--tw-colors-body-dark-l), 0.25)',
        outlineColor: `var(--outline-color, ${colorLib(theme('colors.error.light'))
          .fade(0.3)
          .toString()}) !important`,
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.25)
          .toString()})`,
      },
      '&[aria-invalid="true"]:hover': {
        '--bg-color': 'hsl(var(--tw-colors-body-dark-hs),var(--tw-colors-body-dark-l), 0.25)',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.25)
          .toString()})`,
      },
      '&[aria-invalid="true"] ~ button': {
        '--border-color': 'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l))',
        borderColor: `var(--border-color, ${theme('colors.error.light')})`,
      },
      // TODO: is this needed? I don't think so.
      // '&:invalid:hover': {
      //   backgroundColor: colorLib(theme('colors.black')).fade(0.9).toString(),
      // },
    },

    '.input-label': {
      '--font-size': 'var(--tw-font-size-base-type)',
      '--color': 'hsl(var(--tw-colors-label-dark-hs), var(--tw-colors-label-dark-l))',
      fontSize: `var(--font-size, ${theme('fontSize.base')})`,
      color: `var(--color, ${theme('colors.label.dark')})`,
    },

    '.input-label_dark': {
      '--color': 'hsl(var(--tw-colors-label-light-hs),var(--tw-colors-label-light-l))',
      color: `var(--color, ${theme('colors.label.light')})`,

      ':where(input:autofill) + &': {
        '--color': 'hsl(var(--tw-colors-secondary-dark-hs),var(--tw-colors-secondary-dark-l))',
        color: `var(--color, ${theme('colors.secondary.dark')})`,
      },
      ':where(input:autofill) + &': {
        '--color': 'hsl(var(--tw-colors-secondary-dark-hs),var(--tw-colors-secondary-dark-l))',
        color: `var(--color, ${theme('colors.secondary.dark')})`,
      },
    },
    /**
     * Input error message
     */
    '.input-error-message': {
      '--color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
      '--font-size': 'var(--tw-font-size-sm-type)',
      color: `var(--color, ${theme('colors.error.dark')})`,
      fontSize: `var(--font-size, ${theme('fontSize.sm')})`,
      margin: theme('spacing.1'),
      width: '100%',
    },
    '.input-error-message_dark': {
      '--color': 'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l))',
      color: `var(--color, ${theme('colors.error.light')})`,
    },
    '.input-info-message': {
      '--color': 'hsl(var(--tw-colors-secondary-dark-hs),var(--tw-colors-secondary-dark-l))',
      '--font-size': 'var(--tw-font-size-sm-type)',
      color: `var(--color, ${theme('colors.secondary.dark')})`,
      fontSize: `var(--font-size, ${theme('fontSize.sm')})`,
      margin: theme('spacing.1'),
      width: '100%',

      '&.isInvalid': {
        '--color': 'hsl(var(--tw-colors-error-dark-hs),var(--tw-colors-error-dark-l))',
        color: `var(--color, ${theme('colors.error.dark')})`,
      },
    },
    '.input-info-message_dark': {
      '--color': 'hsl(var(--tw-colors-secondary-light-hs),var(--tw-colors-secondary-light-l))',
      color: `var(--color, ${theme('colors.secondary.light')})`,

      '&.isInvalid': {
        '--color': 'hsl(var(--tw-colors-error-light-hs),var(--tw-colors-error-light-l))',
        color: `var(--color, ${theme('colors.error.light')})`,
      },
    },
    /**
     * Don't forget to update the anchor classes in src/widget/custom.base.css
     */
    '.link': {
      '--color': 'hsl(var(--tw-colors-link-dark-hs),var(--tw-colors-link-dark-l))',
      '--font-size': 'var(--tw-font-size-base-type)',
      color: `var(--color, ${theme('colors.link.dark')})`,
      fontSize: `var(--font-size, ${theme('fontSize.base')})`,
      textDecoration: 'underline',

      '&:hover': {
        textDecoration: 'none',
      },
    },
    '.link_dark': {
      '--color': 'hsl(var(--tw-colors-link-light-hs),var(--tw-colors-link-light-l))',
      color: `var(--color, ${theme('colors.link.light')})`,
    },
    '.select-base': {
      '--bg-color':
        'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) - 2%))',
      '--color': 'hsl(var(--tw-colors-label-dark-hs), var(--tw-colors-label-dark-l))',

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
      backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
        .darken(0.02)
        .toString()})`,
      backgroundSize: '16px 12px',
      color: `var(--color, ${theme('colors.label.dark')})`,
      // TODO: Use design tokens, not absolute values
      height: 'calc(3rem + 2px)',

      '&:hover': {
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) - 5%))',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
          .darken(0.05)
          .toString()})`,
      },
      '&:focus': {
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) - 5%))',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
          .darken(0.05)
          .toString()})`,
      },
      '&[aria-invalid="true"]': {
        '--bg-color':
          'hsl(var(--tw-colors-background-light-hs), calc(var(--tw-colors-background-light-l) - 2%))',

        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
          theme('colors.secondary.dark'),
        ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.dark'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.background.light'))
          .darken(0.02)
          .toString()})`,
        backgroundPosition: 'right 0.75rem center, center right 2.25rem',
        backgroundSize: `16px 12px, ${theme('spacing.4')} ${theme('spacing.4')}`,
      },
    },
    '.select-base_dark': {
      '--bg-color': 'hsl(var(--tw-colors-body-dark-hs), var(--tw-colors-body-dark-l), 0.5)',
      '--color': 'hsl(var(--tw-colors-label-light-hs), var(--tw-colors-label-light-l))',
      background: `no-repeat right ${theme(
        'spacing.3',
      )} center / 16px 12px url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
        theme('colors.secondary.light'),
      ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
        .fade(0.5)
        .toString()})`,
      color: `var(--color, ${theme('colors.label.light')})`,

      '&:hover,': {
        '--bg-color': 'hsl(var(--tw-colors-body-dark-hs), var(--tw-colors-body-dark-l), 0.25)',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.25)
          .toString()})`,
      },

      '&:focus': {
        '--bg-color': 'hsl(var(--tw-colors-body-dark-hs), var(--tw-colors-body-dark-l), 0.25)',
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.25)
          .toString()})`,
      },

      '&[aria-invalid="true"]': {
        '--bg-color': 'hsl(var(--tw-colors-body-dark-hs), var(--tw-colors-body-dark-l), 0.5)',
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${colorLib(
          theme('colors.secondary.light'),
        ).rgb()}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${colorLib(
          theme('colors.error.light'),
        ).rgb()}' viewBox='0 0 16 16'%3E%3Cpath d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'/%3E%3C/svg%3E");`,
        backgroundColor: `var(--bg-color, ${colorLib(theme('colors.body.dark'))
          .fade(0.5)
          .toString()})`,
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
