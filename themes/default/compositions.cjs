const colorLib = require('color');

module.exports = (config, theme) => ({
  /**
   * Checkbox Animated Composition
   * Rework of this example: https://codepen.io/dylanraga/pen/Qwqbab
   */
  '.animated-check': {
    borderColor: theme('colors.primary.dark'),
    borderRadius: theme('borderRadius.DEFAULT'),
    borderWidth: '2px',
    cursor: 'pointer',
    fontSize: '1.5em',
    height: '1em',
    outlineColor: colorLib(theme('ringColor.DEFAULT')).fade(0.7).toString(),
    outlineOffset: '0',
    outlineStyle: 'solid',
    outlineWidth: '0',
    position: 'relative',
    transition:
      'border-color ease-in-out 0.15s, border-width 250ms cubic-bezier(.4,.0,.23,1), box-shadow ease-in-out 0.15s, outline-color ease-in-out 0.2s, outline-offset ease-in-out 0.1s',
    width: '1em',
  },
  '.animated-check_dark': {
    borderColor: theme('colors.secondary.light'),
  },
  '.checkbox-input_animated': {
    '&:checked + label > span': {
      animation: `${config('prefix')}${theme('animation.squish')}`,
      borderColor: theme('colors.primary.dark'),
      borderWidth: '0.5em',
    },
    '&:focus + label > span': {
      outlineColor: colorLib(theme('ringColor.DEFAULT')).fade(0.1).toString(),
      outlineOffset: '1px',
      outlineWidth: '3px',
    },
    '& + label > span:before': {
      borderBottom: '3px solid transparent',
      borderRight: '3px solid transparent',
      bottom: '-0.1em',
      left: '-0.4em',
      overflow: 'hidden',
      position: 'absolute',
      transform: 'rotate(45deg)',
      transformOrigin: '0 100%',
      willChange: 'height, transform, width',
    },
    '&:checked + label > span:before': {
      // TODO: Adding the prefix feels a bit weird, but necessary atm
      // TODO: Animation is a bit janky at slow speeds, but can't find right combination
      animation: `${config('prefix')}${theme('animation.check')}`,
      // Nested quotes is necessary
      content: '""',
    },
  },
  '.checkbox-input_animated_dark': {
    '&:checked + label > span': {
      borderColor: theme('colors.primary.light'),
    },
  },
  /**
   * Dialog box theme settings
   */
  '.dialog-box': {
    backgroundColor: theme('colors.background.light'),
    borderRadius: theme('borderRadius.DEFAULT'),
    boxShadow: theme('boxShadow.DEFAULT'),
    height: '100%',
    margin: `${theme('spacing.2')} 0 0 0`,
    maxHeight: '100%',
    maxWidth: '100%',
    opacity: 0,
    padding: theme('spacing.6'),
    paddingBottom: theme('spacing.16'),
    top: '75%',
    width: '100%',
    willChange: 'top, opacity',

    '&[open]': {
      animation: `${config('prefix')}${theme('animation.slideUp')}`,
    },
    '&::backdrop': {
      animation: `${config('prefix')}${theme('animation.fadeIn')}`,
      backgroundColor: colorLib(theme('colors.body.light')).fade(0.2).toString(),
    },
  },
  '.dialog-box_dark': {
    backgroundColor: theme('colors.background.dark'),

    '&::backdrop': {
      backgroundColor: colorLib(theme('colors.body.dark')).fade(0.2).toString(),
    },
  },
  '.dialog-box_medium': {
    height: 'fit-content',
    margin: 'auto',
    maxWidth: theme('maxWidth.lg'),
    padding: theme('spacing.12'),
    width: theme('width["3/4"]'),
  },
  '.dialog-closing': {

    '&[open]': {
      animation: `${config('prefix')}${theme('animation.slideDown')}`,
      display: 'block',
    },
    '&::backdrop': {
      animation: `${config('prefix')}${theme('animation.fadeOut')}`,
      backgroundColor: colorLib(theme('colors.body.light')).fade(0.2).toString(),
    },
  },
  '.dialog-x': {
    borderRadius: theme('borderRadius.DEFAULT'),
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
    whiteSpace: 'nowrap',
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
    left: theme('spacing.0'),
    top: theme('spacing.0'),
    transform: 'scale(0.85) translateY(-0.5rem) translateX(0.15rem)',
    transformOrigin: 'top left',
    whiteSpace: 'nowrap',
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
  /**
   * Radio animated composition
   * Rework of this example: https://codepen.io/dylanraga/pen/Qwqbab
   */
  '.animated-radio': {
    borderColor: theme('colors.white'),
    borderRadius: theme('borderRadius.full'),
    borderWidth: '2px',
    boxShadow: `0 0 0 2px ${theme('colors.primary.dark')}`,
    display: 'block',
    cursor: 'pointer',
    height: '100%',
    transition: 'border-width 250ms cubic-bezier(.4,.0,.23,1), box-shadow ease-in-out 0.15s',
    width: '100%',
  },
  '.animated-radio_dark': {
    borderColor: theme('colors.secondary.light'),
    boxShadow: `none`,
  },
  '.radio-input_animated': {

    '&:focus + label > span > span': {
      boxShadow: `0 0 0 4px ${colorLib(theme('ringColor.DEFAULT'))
        .fade(0.1)
        .toString()} !important`,
    },
    '&:checked + label > span > span': {
      animation: `${config('prefix')}${theme('animation.squish')}`,
      // borderColor: theme('colors.primary.dark'),
      borderWidth: '0.5em',
    },
    '& + label > span > span:before': {
      backgroundColor: theme('colors.primary.dark'),
      borderRadius: theme('borderRadius.full'),
      height: '100%',
      left: '0',
      overflow: 'hidden',
      position: 'absolute',
      top: '0',
      transform: 'scale(0)',
      transformOrigin: 'center',
      width: '100%',
      willChange: 'transform',
    },
    '&:checked + label > span > span:before': {
      // TODO: Adding the prefix feels a bit weird, but necessary atm
      animation: `${config('prefix')}${theme('animation.radio')}`,
      content: '""',
    },
  },
  '.radio-input_animated_dark': {

    '&:checked + label > span > span': {
      borderColor: theme('colors.secondary.light'),
    },
    '& + label > span > span:before': {
      backgroundColor: theme('colors.primary.light'),
    },
  },
});
