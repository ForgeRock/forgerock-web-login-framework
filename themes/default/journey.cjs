const colorLib = require('color');

module.exports = function (theme) {
  return {
    '.kba-fieldset': {
      position: 'relative',
      borderColor: theme('colors.secondary.light'),
      borderBottom: '1px solid',
      borderTop: '1px solid',
      marginBottom: theme('spacing.4'),
      paddingBottom: theme('spacing.6'),
      paddingTop: theme('spacing.14'),
    },
    '.kba-fieldset_dark': {
      borderColor: theme('colors.body.dark'),
    },
    '.kba-legend': {
      position: 'absolute',
      top: theme('spacing.6'),
      fontWeight: theme('fontWeight.medium'),
    },
    '.kba-legend_dark': {
      color: theme('colors.secondary.light'),
    },
    '.password-button': {
      alignItems: 'center',
      backgroundColor: colorLib(theme('colors.background.light')).lighten(0.01).toString(),
      borderLeft: '0 !important',
      borderTopLeftRadius: '0px !important',
      borderBottomLeftRadius: '0px !important',
      display: 'flex',
      lineHeight: theme('spacing.6'),
      padding: `${theme('spacing.1')} ${theme('spacing.3')}`,
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    '.password-button_dark': {
      backgroundColor: colorLib(theme('colors.black')).fade(0.95).toString(),
    },
    '.password-icon': {
      color: theme('colors.primary.dark'),
      fill: 'currentcolor',
    },
    '.password-icon_dark': {
      color: theme('colors.secondary.light'),
    },
  };
};
