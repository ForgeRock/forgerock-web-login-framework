const colorLib = require('color');

module.exports = (theme) => ({
  /**
   * https://www.sarasoueidan.com/blog/focus-indicators/
   */
  '.focusable-element': {
    outlineColor: colorLib(theme('ringColor.DEFAULT')).fade(0.7).toString(),
    outlineOffset: '0',
    outlineStyle: 'solid',
    outlineWidth: '0',
    transition:
      'background-color ease-in-out 0.15s, outline-color ease-in-out 0.2s, outline-offset ease-in-out 0.1s',
    '&:focus': {
      outlineOffset: '0',
      outlineWidth: '3px',
      outlineColor: colorLib(theme('ringColor.DEFAULT')).fade(0.1).toString(),
    },
    '&:active': {
      outlineOffset: '2px',
      outlineWidth: '4px',
    },
  },
  '.focusable-element_dark': {
    outlineColor: colorLib(theme('ringColor.DEFAULT')).lighten(0.2).fade(0.7).toString(),
    '&:focus': {
      outlineColor: colorLib(theme('ringColor.DEFAULT')).lighten(0.2).fade(0.1).toString(),
    },
  },
  '.input-spacing': {
    marginBottom: theme('spacing.4'),
  },
  '.primary-header': {
    color: theme('colors.header.dark'),
    fontSize: theme('fontSize.2xl'),
    fontWeight: theme('fontWeight.light'),
    marginBottom: theme('spacing.4'),
    textAlign: 'center',
  },
  '.primary-header_dark': {
    color: theme('colors.header.light'),
  },
  '.secondary-header': {
    fontWeight: theme('fontWeight.medium'),
    fontSize: theme('fontSize.base'),
    marginBottom: theme('spacing.4'),
  },
  '.secondary-header_dark': {
    color: theme('colors.secondary.light'),
  },
});
