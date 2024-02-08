const colorLib = require('color');

module.exports = (theme) => ({
  /**
   * https://www.sarasoueidan.com/blog/focus-indicators/
   */
  '.focusable-element': {
    '--outline-color':
      'hsl(var(--tw-colors-focus-default-hs),var(--tw-colors-focus-default-l), 0.7)',
    outlineColor: `var(--outline-color, ${colorLib(theme('ringColor.DEFAULT'))
      .fade(0.7)
      .toString()})`,
    outlineOffset: '0',
    outlineStyle: 'solid',
    outlineWidth: '0',
    transition:
      'background-color ease-in-out 0.15s, outline-color ease-in-out 0.2s, outline-offset ease-in-out 0.1s',
    '&:focus': {
      '--outline-color':
        'hsl(var(--tw-colors-focus-default-hs),var(--tw-colors-focus-default-l), 0.1)',
      outlineOffset: '0',
      outlineWidth: '3px',
      outlineColor: `var(--outline-color, ${colorLib(theme('ringColor.DEFAULT'))
        .fade(0.1)
        .toString()})`,
    },
    '&:active': {
      outlineOffset: '2px',
      outlineWidth: '4px',
    },
  },
  '.focusable-element_dark': {
    '--outline-color':
      'hsl(var(--tw-colors-focus-default-hs), calc(var(--tw-colors-focus-default-l) + 20%), 0.7)',
    outlineColor: `var(--outline-color, ${colorLib(theme('ringColor.DEFAULT'))
      .lighten(0.2)
      .fade(0.7)
      .toString()})`,
    '&:focus': {
      '--outline-color':
        'hsl(var(--tw-colors-focus-default-hs), calc(var(--tw-colors-focus-default-l) + 20%), 0.1)',
      outlineColor: `var(--outline-color, ${colorLib(theme('ringColor.DEFAULT'))
        .lighten(0.2)
        .fade(0.1)
        .toString()})`,
    },
  },
  '.input-spacing': {
    marginBottom: theme('spacing.4'),
  },
  '.primary-header': {
    '--color': 'hsl(var(--tw-colors-header-dark-hs),var(--tw-colors-header-dark-l))',
    '--font-size': 'var(--tw-font-size-2xl-type)',
    color: `var(--color, ${theme('colors.header.dark')})`,
    fontSize: `var(--font-size, ${theme('fontSize.2xl')})`,
    fontWeight: theme('fontWeight.light'),
    marginBottom: theme('spacing.4'),
    textAlign: 'center',
  },
  '.primary-header_dark': {
    '--color': 'hsl(var(--tw-colors-header-light-hs),var(--tw-colors-header-light-l))',
    color: `var(--color, ${theme('colors.header.light')})`,
  },
  '.secondary-header': {
    '--font-size': 'var(--tw-font-size-lg-type)',
    fontWeight: theme('fontWeight.medium'),
    fontSize: `var(--font-size, ${theme('fontSize.lg')})`,
    marginBottom: theme('spacing.4'),
  },
  '.secondary-header_dark': {
    '--color': 'hsl(var(--tw-colors-secondary-light-hs),var(--tw-colors-secondary-light-l))',
    color: `var(--color, ${theme('colors.secondary.light')})`,
  },
});
